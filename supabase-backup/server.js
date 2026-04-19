import "dotenv/config";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const app = express();
const port = Number(process.env.PORT || 7000);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.");
}

const jwtSecret = process.env.BACKUP_JWT_SECRET || "CHANGE_ME_SUPABASE_BACKUP_SECRET_AT_LEAST_32_CHARS";
if (jwtSecret.length < 32) {
  throw new Error("BACKUP_JWT_SECRET must be at least 32 characters.");
}

const jwtIssuer = process.env.BACKUP_JWT_ISSUER || "queuelanka-supabase-backup";
const jwtAudience = process.env.BACKUP_JWT_AUDIENCE || "queuelanka-client";
const tokenTtlSeconds = Number(process.env.DEFAULT_TOKEN_TTL_SECONDS || 3600);

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

app.use(cors({ origin: true, credentials: false }));
app.use(express.json());

function ok(res, data, message) {
  const payload = { success: true, data };
  if (message) {
    payload.message = message;
  }
  return res.status(200).json(payload);
}

function fail(res, status, code, message) {
  return res.status(status).json({ code, message });
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function toTokenNumber(sequence) {
  return `T${pad2(sequence)}`;
}

function authRequired(req, res, next) {
  const authHeader = req.header("authorization") || req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!token) {
    return fail(res, 401, "AUTH_REQUIRED", "Missing bearer token.");
  }

  try {
    const payload = jwt.verify(token, jwtSecret, {
      issuer: jwtIssuer,
      audience: jwtAudience,
    });
    req.user = payload;
    return next();
  } catch {
    return fail(res, 401, "AUTH_INVALID", "Invalid or expired token.");
  }
}

function roleAllowed(...roles) {
  return (req, res, next) => {
    const role = String(req.user?.role || "").toLowerCase();
    if (!roles.map((item) => item.toLowerCase()).includes(role)) {
      return fail(res, 403, "FORBIDDEN", "You do not have permission to perform this action.");
    }
    return next();
  };
}

function computeAverageServiceTimeSeconds(rows) {
  const seconds = rows
    .map((row) => {
      if (!row.called_at || !row.served_time) {
        return null;
      }
      const calledAt = new Date(row.called_at).getTime();
      const servedAt = new Date(row.served_time).getTime();
      if (Number.isNaN(calledAt) || Number.isNaN(servedAt) || servedAt < calledAt) {
        return null;
      }
      return Math.floor((servedAt - calledAt) / 1000);
    })
    .filter((value) => value !== null);

  if (seconds.length === 0) {
    return 0;
  }

  return Math.floor(seconds.reduce((sum, item) => sum + item, 0) / seconds.length);
}

async function getCounterOrNull(counterId) {
  const { data, error } = await supabase
    .from("counters")
    .select("counter_id, center_id, name, status, current_token_id")
    .eq("counter_id", counterId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function getCounterStats(counterId) {
  const counter = await getCounterOrNull(counterId);
  if (!counter) {
    return null;
  }

  const date = todayIsoDate();
  const { data: rows, error } = await supabase
    .from("tokens")
    .select("status, called_at, served_time")
    .eq("center_id", counter.center_id)
    .eq("issued_date", date);

  if (error) {
    throw error;
  }

  const servedCount = rows.filter((row) => String(row.status).toLowerCase() === "completed").length;
  const skippedCount = rows.filter((row) => String(row.status).toLowerCase() === "skipped").length;
  const averageServiceTimeSeconds = computeAverageServiceTimeSeconds(rows);

  return {
    servedCount,
    skippedCount,
    averageServiceTimeSeconds,
  };
}

app.get("/", (_req, res) => {
  return ok(res, {
    service: "QueueLanka Supabase Backup API",
    status: "Healthy",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (_req, res) => {
  return ok(res, { status: "Healthy" });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password, role, centerId } = req.body || {};

    if (!username || !email || !password) {
      return fail(res, 400, "VALIDATION_ERROR", "username, email and password are required.");
    }

    const normalizedRole = String(role || "citizen").toLowerCase();

    const { data, error } = await supabase
      .from("users")
      .insert({
        username,
        email,
        password_hash: password,
        role: normalizedRole,
        center_id: centerId || null,
        is_active: true,
      })
      .select("user_id, username, role")
      .single();

    if (error) {
      if (error.code === "23505") {
        return fail(res, 409, "DUPLICATE_USER", "Username or email already exists.");
      }
      throw error;
    }

    return ok(res, {
      userId: data.user_id,
      username: data.username,
      role: data.role,
    });
  } catch (error) {
    console.error("register error", error);
    return fail(res, 500, "INTERNAL_ERROR", "Failed to register user.");
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return fail(res, 400, "VALIDATION_ERROR", "username and password are required.");
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("user_id, username, email, password_hash, role, center_id, is_active")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!user || !user.is_active || user.password_hash !== password) {
      return fail(res, 401, "INVALID_CREDENTIALS", "Invalid username or password.");
    }

    let counterId = null;
    if (String(user.role).toLowerCase() === "officer") {
      const { data: counter } = await supabase
        .from("counters")
        .select("counter_id")
        .eq("officer_user_id", user.user_id)
        .order("counter_id", { ascending: true })
        .limit(1)
        .maybeSingle();
      counterId = counter?.counter_id ?? null;
    }

    const claims = {
      sub: String(user.user_id),
      unique_name: user.username,
      role: String(user.role).toLowerCase(),
      centerId: user.center_id != null ? String(user.center_id) : undefined,
    };

    const token = jwt.sign(claims, jwtSecret, {
      expiresIn: tokenTtlSeconds,
      issuer: jwtIssuer,
      audience: jwtAudience,
    });

    return ok(res, {
      token,
      refreshToken: "backup-refresh-token",
      expiresIn: tokenTtlSeconds,
      role: String(user.role).toLowerCase(),
      counterId,
    });
  } catch (error) {
    console.error("login error", error);
    return fail(res, 500, "INTERNAL_ERROR", "Failed to login.");
  }
});

app.get("/api/service-centers", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("service_centers")
      .select("center_id, name, address, phone, email, description, timezone, capacity, opening_time, closing_time, is_active, created_at")
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    const payload = data.map((item) => ({
      centerId: item.center_id,
      name: item.name,
      address: item.address,
      phone: item.phone,
      email: item.email,
      description: item.description,
      timezone: item.timezone,
      capacity: item.capacity,
      openingTime: item.opening_time,
      closingTime: item.closing_time,
      isAvailable: Boolean(item.is_active),
      isActive: Boolean(item.is_active),
      createdAt: item.created_at,
    }));

    return ok(res, payload);
  } catch (error) {
    console.error("service-centers error", error);
    return fail(res, 500, "INTERNAL_ERROR", "Failed to load service centers.");
  }
});

app.get("/api/service-centers/:centerId", async (req, res) => {
  try {
    const centerId = Number(req.params.centerId);
    const { data, error } = await supabase
      .from("service_centers")
      .select("center_id, name, address, phone, email, description, timezone, capacity, opening_time, closing_time, is_active, created_at")
      .eq("center_id", centerId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return fail(res, 404, "CENTER_NOT_FOUND", "Service center not found.");
    }

    return ok(res, {
      centerId: data.center_id,
      name: data.name,
      address: data.address,
      phone: data.phone,
      email: data.email,
      description: data.description,
      timezone: data.timezone,
      capacity: data.capacity,
      openingTime: data.opening_time,
      closingTime: data.closing_time,
      isAvailable: Boolean(data.is_active),
      isActive: Boolean(data.is_active),
      createdAt: data.created_at,
    });
  } catch (error) {
    console.error("service-center by id error", error);
    return fail(res, 500, "INTERNAL_ERROR", "Failed to load service center.");
  }
});

app.get("/api/admin/centers/:centerId/counters", authRequired, roleAllowed("admin", "officer"), async (req, res) => {
  try {
    const centerId = Number(req.params.centerId);

    const { data, error } = await supabase
      .from("counters")
      .select("counter_id, center_id, name, status")
      .eq("center_id", centerId)
      .order("counter_id", { ascending: true });

    if (error) {
      throw error;
    }

    const counters = data.map((item) => ({
      counterId: item.counter_id,
      centerId: item.center_id,
      name: item.name,
      status: item.status,
      isOpen: String(item.status).toLowerCase() === "open",
    }));

    return ok(res, { counters });
  } catch (error) {
    console.error("list counters error", error);
    return fail(res, 500, "INTERNAL_ERROR", "Failed to load counters.");
  }
});

app.get("/api/counters/:counterId/tokens/waiting", authRequired, roleAllowed("officer", "admin"), async (req, res) => {
  try {
    const counterId = Number(req.params.counterId);
    const counter = await getCounterOrNull(counterId);

    if (!counter) {
      return fail(res, 404, "COUNTER_NOT_FOUND", "Counter not found.");
    }

    const { data, error } = await supabase
      .from("tokens")
      .select("token_id, token_number, queue_position, issued_time, status")
      .eq("center_id", counter.center_id)
      .eq("issued_date", todayIsoDate())
      .eq("status", "Waiting")
      .order("queue_position", { ascending: true })
      .order("token_id", { ascending: true });

    if (error) {
      throw error;
    }

    const waiting = data.map((item, index) => ({
      tokenId: item.token_id,
      tokenNumber: item.token_number,
      queuePosition: item.queue_position ?? index + 1,
      issuedAt: item.issued_time,
      estimatedWaitSeconds: (item.queue_position ?? index + 1) * 300,
      issuedTime: item.issued_time,
      status: item.status,
    }));

    return ok(res, waiting);
  } catch (error) {
    console.error("waiting tokens error", error);
    return fail(res, 500, "INTERNAL_ERROR", "Failed to load waiting tokens.");
  }
});

app.post("/api/counters/:counterId/call-next", authRequired, roleAllowed("officer", "admin"), async (req, res) => {
  try {
    const counterId = Number(req.params.counterId);
    const counter = await getCounterOrNull(counterId);

    if (!counter) {
      return fail(res, 404, "COUNTER_NOT_FOUND", "Counter not found.");
    }

    if (String(counter.status).toLowerCase() !== "open") {
      return fail(res, 400, "COUNTER_CLOSED", "This counter is currently closed.");
    }

    const date = todayIsoDate();
    const { data: waitingToken, error: waitingError } = await supabase
      .from("tokens")
      .select("token_id, center_id, user_id, token_number, issued_date, issued_time")
      .eq("center_id", counter.center_id)
      .eq("issued_date", date)
      .eq("status", "Waiting")
      .order("queue_position", { ascending: true })
      .order("token_id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (waitingError) {
      throw waitingError;
    }

    if (!waitingToken) {
      return fail(res, 404, "NO_WAITING_TOKENS", "No waiting tokens are available.");
    }

    const nowIso = new Date().toISOString();

    const { error: updateTokenError } = await supabase
      .from("tokens")
      .update({
        status: "Called",
        called_at: nowIso,
        updated_at: nowIso,
        counter_id: counterId,
      })
      .eq("token_id", waitingToken.token_id);

    if (updateTokenError) {
      throw updateTokenError;
    }

    const { error: updateCounterError } = await supabase
      .from("counters")
      .update({
        current_token_id: waitingToken.token_id,
        updated_at: nowIso,
      })
      .eq("counter_id", counterId);

    if (updateCounterError) {
      throw updateCounterError;
    }

    return ok(res, {
      tokenId: waitingToken.token_id,
      centerId: waitingToken.center_id,
      counterId,
      userId: waitingToken.user_id,
      tokenNumber: waitingToken.token_number,
      issuedDate: waitingToken.issued_date,
      status: "Called",
      issuedTime: waitingToken.issued_time,
      calledAt: nowIso,
    });
  } catch (error) {
    console.error("call-next error", error);
    return fail(res, 500, "INTERNAL_ERROR", "Failed to call next token.");
  }
});

app.put("/api/counters/:counterId/tokens/:tokenId/status", authRequired, roleAllowed("officer", "admin"), async (req, res) => {
  try {
    const counterId = Number(req.params.counterId);
    const tokenId = Number(req.params.tokenId);
    const status = String(req.body?.status || "").toLowerCase();

    if (!["served", "skipped"].includes(status)) {
      return fail(res, 400, "INVALID_STATUS", "status must be served or skipped.");
    }

    const { data: token, error: tokenError } = await supabase
      .from("tokens")
      .select("token_id, center_id, user_id, token_number, issued_date, issued_time, called_at, status, counter_id")
      .eq("token_id", tokenId)
      .maybeSingle();

    if (tokenError) {
      throw tokenError;
    }

    if (!token) {
      return fail(res, 404, "TOKEN_NOT_FOUND", "Token not found.");
    }

    if (token.counter_id !== counterId) {
      return fail(res, 403, "TOKEN_COUNTER_MISMATCH", "This token does not belong to your counter.");
    }

    if (String(token.status).toLowerCase() !== "called") {
      return fail(res, 400, "INVALID_TOKEN_STATE", "Token is not in called state.");
    }

    const nowIso = new Date().toISOString();
    const finalStatus = status === "served" ? "Completed" : "Skipped";

    const { error: updateTokenError } = await supabase
      .from("tokens")
      .update({
        status: finalStatus,
        served_time: status === "served" ? nowIso : null,
        updated_at: nowIso,
      })
      .eq("token_id", tokenId);

    if (updateTokenError) {
      throw updateTokenError;
    }

    const { error: clearCounterError } = await supabase
      .from("counters")
      .update({
        current_token_id: null,
        updated_at: nowIso,
      })
      .eq("counter_id", counterId);

    if (clearCounterError) {
      throw clearCounterError;
    }

    const date = todayIsoDate();
    const { data: nextToken, error: nextError } = await supabase
      .from("tokens")
      .select("token_id")
      .eq("center_id", token.center_id)
      .eq("issued_date", date)
      .eq("status", "Waiting")
      .order("queue_position", { ascending: true })
      .order("token_id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextError) {
      throw nextError;
    }

    if (nextToken?.token_id) {
      const { error: setNextError } = await supabase
        .from("counters")
        .update({
          current_token_id: nextToken.token_id,
          updated_at: nowIso,
        })
        .eq("counter_id", counterId);

      if (setNextError) {
        throw setNextError;
      }
    }

    return ok(res, {
      tokenId: token.token_id,
      centerId: token.center_id,
      counterId,
      userId: token.user_id,
      tokenNumber: token.token_number,
      issuedDate: token.issued_date,
      issuedTime: token.issued_time,
      calledAt: token.called_at,
      servedAt: status === "served" ? nowIso : null,
      status: finalStatus,
      nextTokenId: nextToken?.token_id ?? null,
    });
  } catch (error) {
    console.error("update token status error", error);
    return fail(res, 500, "INTERNAL_ERROR", "Failed to update token status.");
  }
});

app.get("/api/counters/:counterId/stats", authRequired, roleAllowed("officer", "admin"), async (req, res) => {
  try {
    const counterId = Number(req.params.counterId);
    const stats = await getCounterStats(counterId);

    if (!stats) {
      return fail(res, 404, "COUNTER_NOT_FOUND", "Counter not found.");
    }

    return ok(res, stats);
  } catch (error) {
    console.error("counter stats error", error);
    return fail(res, 500, "INTERNAL_ERROR", "Failed to load counter stats.");
  }
});

app.get("/api/counters/:counterId/dashboard", authRequired, roleAllowed("officer", "admin"), async (req, res) => {
  try {
    const counterId = Number(req.params.counterId);
    const counter = await getCounterOrNull(counterId);

    if (!counter) {
      return fail(res, 404, "COUNTER_NOT_FOUND", "Counter not found.");
    }

    const stats = await getCounterStats(counterId);

    const { data: waitingData, error: waitingError } = await supabase
      .from("tokens")
      .select("token_id, token_number, queue_position, issued_time, status")
      .eq("center_id", counter.center_id)
      .eq("issued_date", todayIsoDate())
      .eq("status", "Waiting")
      .order("queue_position", { ascending: true })
      .order("token_id", { ascending: true });

    if (waitingError) {
      throw waitingError;
    }

    let currentToken = null;
    if (counter.current_token_id) {
      const { data: current, error: currentError } = await supabase
        .from("tokens")
        .select("token_id, token_number, status, called_at")
        .eq("token_id", counter.current_token_id)
        .maybeSingle();

      if (currentError) {
        throw currentError;
      }

      if (current) {
        const calledAt = current.called_at ? new Date(current.called_at).getTime() : null;
        currentToken = {
          tokenId: current.token_id,
          tokenNumber: current.token_number,
          status: current.status,
          calledAt: current.called_at,
          waitedSeconds: calledAt ? Math.max(0, Math.floor((Date.now() - calledAt) / 1000)) : 0,
        };
      }
    }

    const waitingTokens = waitingData.map((item, index) => ({
      tokenId: item.token_id,
      tokenNumber: item.token_number,
      queuePosition: item.queue_position ?? index + 1,
      issuedAt: item.issued_time,
      estimatedWaitSeconds: (item.queue_position ?? index + 1) * 300,
      issuedTime: item.issued_time,
      status: item.status,
    }));

    return ok(res, {
      counterId: counter.counter_id,
      counterName: counter.name,
      isOpen: String(counter.status).toLowerCase() === "open",
      currentToken,
      waitingTokens,
      servedCount: stats?.servedCount ?? 0,
      skippedCount: stats?.skippedCount ?? 0,
      averageServiceTimeSeconds: stats?.averageServiceTimeSeconds ?? 0,
    });
  } catch (error) {
    console.error("counter dashboard error", error);
    return fail(res, 500, "INTERNAL_ERROR", "Failed to load counter dashboard.");
  }
});

app.get("/api/token/my-tokens", authRequired, async (req, res) => {
  try {
    const userId = Number(req.user.sub);

    const { data: tokens, error } = await supabase
      .from("tokens")
      .select("token_id, center_id, token_number, issued_date, status, issued_time, served_time, completed_time, cancelled_at, queue_position")
      .eq("user_id", userId)
      .order("token_id", { ascending: false });

    if (error) {
      throw error;
    }

    const centerIds = [...new Set(tokens.map((item) => item.center_id))];
    const { data: centers, error: centerError } = await supabase
      .from("service_centers")
      .select("center_id, name")
      .in("center_id", centerIds.length > 0 ? centerIds : [0]);

    if (centerError) {
      throw centerError;
    }

    const centerNameById = new Map(centers.map((item) => [item.center_id, item.name]));

    const payload = tokens.map((item) => ({
      tokenId: item.token_id,
      centerId: item.center_id,
      centerName: centerNameById.get(item.center_id) || `Center ${item.center_id}`,
      tokenNumber: item.token_number,
      issuedDate: item.issued_date,
      status: item.status,
      issuedTime: item.issued_time,
      estimatedServiceTime: null,
      servedTime: item.served_time,
      completedTime: item.completed_time,
      cancelledAt: item.cancelled_at,
      queuePosition: item.queue_position,
      eta: null,
    }));

    return ok(res, payload);
  } catch (error) {
    console.error("my tokens error", error);
    return fail(res, 500, "INTERNAL_ERROR", "Failed to load user tokens.");
  }
});

app.get("/api/token/center/:centerId/queue", authRequired, async (req, res) => {
  try {
    const centerId = Number(req.params.centerId);
    const { data, error } = await supabase
      .from("tokens")
      .select("token_id, token_number, status, queue_position")
      .eq("center_id", centerId)
      .eq("issued_date", todayIsoDate())
      .in("status", ["Waiting", "Called"])
      .order("queue_position", { ascending: true })
      .order("token_id", { ascending: true });

    if (error) {
      throw error;
    }

    const payload = data.map((item, index) => ({
      tokenId: item.token_id,
      tokenNumber: item.token_number,
      status: item.status,
      position: item.queue_position ?? index + 1,
      eta: null,
    }));

    return ok(res, payload);
  } catch (error) {
    console.error("center queue error", error);
    return fail(res, 500, "INTERNAL_ERROR", "Failed to load queue.");
  }
});

app.put("/api/token/:tokenId/cancel", authRequired, async (req, res) => {
  try {
    const tokenId = Number(req.params.tokenId);
    const userId = Number(req.user.sub);

    const { data: token, error: tokenError } = await supabase
      .from("tokens")
      .select("token_id, user_id, status")
      .eq("token_id", tokenId)
      .maybeSingle();

    if (tokenError) {
      throw tokenError;
    }

    if (!token || token.user_id !== userId) {
      return fail(res, 404, "TOKEN_NOT_FOUND", "Token not found.");
    }

    const current = String(token.status).toLowerCase();
    if (current === "cancelled") {
      return fail(res, 409, "TOKEN_ALREADY_CANCELLED", "Token is already cancelled.");
    }

    if (current !== "waiting") {
      return fail(res, 422, "TOKEN_NOT_CANCELLABLE", "Token cannot be cancelled in the current state.");
    }

    const nowIso = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("tokens")
      .update({
        status: "Cancelled",
        cancelled_at: nowIso,
        updated_at: nowIso,
      })
      .eq("token_id", tokenId);

    if (updateError) {
      throw updateError;
    }

    return ok(res, true, "Token cancelled.");
  } catch (error) {
    console.error("cancel token error", error);
    return fail(res, 500, "INTERNAL_ERROR", "Failed to cancel token.");
  }
});

app.post("/api/appointment/book", authRequired, async (req, res) => {
  try {
    const userId = Number(req.user.sub);
    const centerId = Number(req.body?.centerId);
    const appointmentDateRaw = String(req.body?.appointmentDate || "").slice(0, 10);
    const appointmentTime = String(req.body?.appointmentTime || "");

    if (!centerId || !appointmentDateRaw || !appointmentTime) {
      return fail(res, 400, "VALIDATION_ERROR", "centerId, appointmentDate and appointmentTime are required.");
    }

    const { count, error: countError } = await supabase
      .from("tokens")
      .select("token_id", { count: "exact", head: true })
      .eq("center_id", centerId)
      .eq("issued_date", appointmentDateRaw);

    if (countError) {
      throw countError;
    }

    const tokenNumber = toTokenNumber((count || 0) + 1);
    const nowIso = new Date().toISOString();

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        center_id: centerId,
        user_id: userId,
        appointment_date: appointmentDateRaw,
        appointment_time: appointmentTime,
        status: "Booked",
        token_number: tokenNumber,
      })
      .select("appointment_id, center_id, user_id, appointment_date, appointment_time, status, created_at")
      .single();

    if (appointmentError) {
      throw appointmentError;
    }

    const { data: firstOpenCounter } = await supabase
      .from("counters")
      .select("counter_id")
      .eq("center_id", centerId)
      .eq("status", "Open")
      .order("counter_id", { ascending: true })
      .limit(1)
      .maybeSingle();

    const { data: token, error: tokenError } = await supabase
      .from("tokens")
      .insert({
        center_id: centerId,
        counter_id: firstOpenCounter?.counter_id ?? null,
        user_id: userId,
        appointment_id: appointment.appointment_id,
        token_number: tokenNumber,
        issued_date: appointmentDateRaw,
        issued_time: nowIso,
        status: "Waiting",
        queue_position: (count || 0) + 1,
      })
      .select("token_id")
      .single();

    if (tokenError) {
      throw tokenError;
    }

    const { error: updateAppointmentError } = await supabase
      .from("appointments")
      .update({ token_id: token.token_id })
      .eq("appointment_id", appointment.appointment_id);

    if (updateAppointmentError) {
      throw updateAppointmentError;
    }

    return ok(res, {
      appointmentId: appointment.appointment_id,
      centerId: appointment.center_id,
      userId: appointment.user_id,
      tokenId: token.token_id,
      tokenNumber,
      appointmentDate: appointment.appointment_date,
      appointmentTime: appointment.appointment_time,
      status: appointment.status,
      createdAt: appointment.created_at,
    });
  } catch (error) {
    console.error("book appointment error", error);
    return fail(res, 500, "INTERNAL_ERROR", "Failed to book appointment.");
  }
});

app.get("/api/appointment/my-bookings", authRequired, async (req, res) => {
  try {
    const userId = Number(req.user.sub);
    const { data, error } = await supabase
      .from("appointments")
      .select("appointment_id, center_id, user_id, token_id, token_number, appointment_date, appointment_time, status, created_at")
      .eq("user_id", userId)
      .order("appointment_id", { ascending: false });

    if (error) {
      throw error;
    }

    const payload = data.map((item) => ({
      appointmentId: item.appointment_id,
      centerId: item.center_id,
      userId: item.user_id,
      tokenId: item.token_id,
      tokenNumber: item.token_number,
      appointmentDate: item.appointment_date,
      appointmentTime: item.appointment_time,
      status: item.status,
      createdAt: item.created_at,
    }));

    return ok(res, payload);
  } catch (error) {
    console.error("my bookings error", error);
    return fail(res, 500, "INTERNAL_ERROR", "Failed to load bookings.");
  }
});

app.listen(port, () => {
  console.log(`QueueLanka Supabase backup API running on port ${port}`);
});
