// frontend/src/hooks/useQueueHub.ts

// frontend/src/hooks/useQueueHub.ts

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    HubConnection,
    HubConnectionBuilder,
    HubConnectionState,
    HttpTransportType,
    LogLevel,
} from "@microsoft/signalr";
import { useAuth } from "../context/AuthContext";
import { usePageVisibility } from "./usePageVisibility";

export type QueueHubConnectionStatus = "connecting" | "disconnected" | "reconnecting" | "connected";

export interface TokenCalledPayload {
    tokenId: number;
    centerId: number;
    counterId: number;
    userId: number | null;
    tokenNumber: string;
    issuedDate: string;
    status: string;
    issuedTime: string;
    calledAt: string;
}

export interface TokenStatusUpdatedPayload {
    tokenId: number;
    centerId: number;
    counterId: number;
    tokenNumber: string;
    newStatus: "served" | "skipped";
    servedAt: string | null;
    skippedAt: string | null;
    nextWaitingTokenNumber: string | null;
}

export interface TokenReassignedPayload {
    tokenId: number;
    tokenNumber: string;
    centerId: number;
    sourceCounterId: number;
    targetCounterId: number;
    reassignedAt: string;
    reason?: string | null;
}

export interface TokenCancelledPayload {
    tokenId: number;
    tokenNumber: string;
    counterId: number;
    centerId: number;
    cancelledAt: string;
    cancelledBy: "citizen" | "admin" | string;
    nextWaitingTokenNumber: string | null;
    newWaitingCount: number;
}

export interface QueueUpdatedWaitingTokenPayload {
    tokenId: number;
    tokenNumber: string;
    queuePosition: number;
    issuedAt: string;
    estimatedWaitSeconds: number;
}

export interface QueueUpdatedPayload {
    counterId: number;
    centerId: number;
    waitingTokens: QueueUpdatedWaitingTokenPayload[];
    waitingCount: number;
    servedCountToday: number;
    skippedCountToday: number;
    timestamp: string;
    triggerAction: string;
}

export interface CounterStatusChangedPayload {
    counterId: number;
    centerId: number;
    isOpen: boolean;
    counterName: string;
    changedAt: string;
}

export interface UseQueueHubOptions {
    centerId?: number;
    counterId?: number;
    isOfficer?: boolean;
    enabled?: boolean;
    onReconnected?: () => Promise<void> | void;
}

interface UseQueueHubResult {
    latestCalledToken: TokenCalledPayload | null;
    latestStatusUpdate: TokenStatusUpdatedPayload | null;
    latestReassignment: TokenReassignedPayload | null;
    latestCancellation: TokenCancelledPayload | null;
    latestQueueUpdate: QueueUpdatedPayload | null;
    latestCounterStatusChange: CounterStatusChangedPayload | null;
    connectionStatus: QueueHubConnectionStatus;
    lastConnectedAt: Date | null;
    reconnectAttempt: number;
    reconnect: () => Promise<void>;
}

const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAYS_MS = [1000, 2000, 4000, 8000, 16000, 30000];
const SESSION_CENTER_ID_KEY = "queuehub:centerId";
const SESSION_COUNTER_ID_KEY = "queuehub:counterId";

const getHubUrl = () => {
    const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? window.location.origin).replace(/\/+$/, "");
    const baseUrl = rawBaseUrl.replace(/\/api$/i, "");
    return `${baseUrl}/hubs/queue`;
};

const createEventDedupKey = {
    called: (payload: TokenCalledPayload) => `called:${payload.tokenId}:${payload.calledAt}`,
    status: (payload: TokenStatusUpdatedPayload) => `status:${payload.tokenId}:${payload.newStatus}:${payload.servedAt ?? ""}:${payload.skippedAt ?? ""}`,
    reassigned: (payload: TokenReassignedPayload) => `reassigned:${payload.tokenId}:${payload.reassignedAt}:${payload.sourceCounterId}:${payload.targetCounterId}`,
    cancelled: (payload: TokenCancelledPayload) => `cancelled:${payload.tokenId}:${payload.cancelledAt}`,
    queueUpdated: (payload: QueueUpdatedPayload) => `queue:${payload.counterId}:${payload.timestamp}:${payload.triggerAction}`,
    counterStatus: (payload: CounterStatusChangedPayload) => `counter-status:${payload.counterId}:${payload.changedAt}:${payload.isOpen}`,
};

export function useQueueHub(options: UseQueueHubOptions): UseQueueHubResult {
    const { user } = useAuth();
    const isVisible = usePageVisibility();

    const {
        centerId,
        counterId,
        isOfficer = false,
        enabled = true,
        onReconnected,
    } = options;

    const [latestCalledToken, setLatestCalledToken] = useState<TokenCalledPayload | null>(null);
    const [latestStatusUpdate, setLatestStatusUpdate] = useState<TokenStatusUpdatedPayload | null>(null);
    const [latestReassignment, setLatestReassignment] = useState<TokenReassignedPayload | null>(null);
    const [latestCancellation, setLatestCancellation] = useState<TokenCancelledPayload | null>(null);
    const [latestQueueUpdate, setLatestQueueUpdate] = useState<QueueUpdatedPayload | null>(null);
    const [latestCounterStatusChange, setLatestCounterStatusChange] = useState<CounterStatusChangedPayload | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<QueueHubConnectionStatus>("connecting");
    const [lastConnectedAt, setLastConnectedAt] = useState<Date | null>(null);
    const [reconnectAttempt, setReconnectAttempt] = useState(0);

    const hubUrl = useMemo(() => getHubUrl(), []);
    const isMountedRef = useRef(true);
    const connectionRef = useRef<HubConnection | null>(null);
    const stopRequestedRef = useRef(false);
    const seenEventsRef = useRef<Map<string, number>>(new Map());
    const reconnectAttemptRef = useRef(0);
    const reconnectTimerRef = useRef<number | null>(null);
    const pageVisibilityReconnectRef = useRef(false);

    const effectiveCenterId = (centerId ?? Number(sessionStorage.getItem(SESSION_CENTER_ID_KEY) || "")) || undefined;
    const effectiveCounterId = (counterId ?? Number(sessionStorage.getItem(SESSION_COUNTER_ID_KEY) || "")) || undefined;
    const hasValidCenterId = Boolean(effectiveCenterId && !Number.isNaN(effectiveCenterId));
    const hasValidCounterId = Boolean(effectiveCounterId && !Number.isNaN(effectiveCounterId));
    const canConnect = enabled && (hasValidCenterId || (isOfficer && hasValidCounterId));

    const getAccessToken = useCallback(() => {
        return localStorage.getItem("token") ?? null;
    }, []);

    const clearReconnectTimer = useCallback(() => {
        if (reconnectTimerRef.current != null) {
            window.clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
    }, []);

    const clearSessionGroupState = useCallback(() => {
        sessionStorage.removeItem(SESSION_CENTER_ID_KEY);
        sessionStorage.removeItem(SESSION_COUNTER_ID_KEY);
    }, []);

    const resolveApiBaseUrl = useCallback(() => {
        const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? window.location.origin).replace(/\/+$/, "");
        return rawBaseUrl.replace(/\/api$/i, "");
    }, []);

    const isTokenExpired = useCallback((token: string) => {
        try {
            const [, payload] = token.split(".");
            if (!payload) {
                return true;
            }

            const parsed = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
            if (!parsed.exp) {
                return false;
            }

            return Date.now() >= parsed.exp * 1000;
        } catch {
            return true;
        }
    }, []);

    const refreshAccessToken = useCallback(async () => {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
            return false;
        }

        try {
            const response = await fetch(`${resolveApiBaseUrl()}/api/auth/refresh`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ refreshToken }),
            });

            if (!response.ok) {
                return false;
            }

            const data = await response.json() as { token?: string; refreshToken?: string };
            if (!data.token) {
                return false;
            }

            localStorage.setItem("token", data.token);
            if (data.refreshToken) {
                localStorage.setItem("refreshToken", data.refreshToken);
            }

            return true;
        } catch {
            return false;
        }
    }, [resolveApiBaseUrl]);

    const ensureValidAccessToken = useCallback(async () => {
        const token = getAccessToken();
        if (!token) {
            return false;
        }

        if (!isTokenExpired(token)) {
            return true;
        }

        const refreshed = await refreshAccessToken();
        if (refreshed) {
            return true;
        }

        localStorage.removeItem("token");
        localStorage.removeItem("auth_user");
        clearSessionGroupState();
        window.location.href = "/login";
        return false;
    }, [clearSessionGroupState, getAccessToken, isTokenExpired, refreshAccessToken]);

    const shouldProcessEvent = useCallback((key: string) => {
        const seenEvents = seenEventsRef.current;
        if (seenEvents.has(key)) {
            return false;
        }

        seenEvents.set(key, Date.now());
        if (seenEvents.size > 200) {
            const sorted = [...seenEvents.entries()].sort((a, b) => a[1] - b[1]);
            for (let i = 0; i < sorted.length - 150; i += 1) {
                seenEvents.delete(sorted[i][0]);
            }
        }

        return true;
    }, []);

    const joinGroups = useCallback(async (connection: HubConnection) => {
        if (connection.state !== HubConnectionState.Connected) {
            return;
        }

        if (effectiveCenterId && !Number.isNaN(effectiveCenterId)) {
            await connection.invoke("JoinCenterGroup", effectiveCenterId);
        }

        if (isOfficer && effectiveCounterId && !Number.isNaN(effectiveCounterId)) {
            await connection.invoke("JoinCounterGroup", effectiveCounterId);
        }
    }, [effectiveCenterId, effectiveCounterId, isOfficer]);

    const leaveGroups = useCallback(async (connection: HubConnection) => {
        if (connection.state !== HubConnectionState.Connected) {
            return;
        }

        if (effectiveCenterId && !Number.isNaN(effectiveCenterId)) {
            await connection.invoke("LeaveCenterGroup", effectiveCenterId);
        }

        if (isOfficer && effectiveCounterId && !Number.isNaN(effectiveCounterId)) {
            await connection.invoke("LeaveCounterGroup", effectiveCounterId);
        }
    }, [effectiveCenterId, effectiveCounterId, isOfficer]);

    const attachEventListeners = useCallback((connection: HubConnection) => {
        connection.off("TokenCalled");
        connection.off("TokenStatusUpdated");
        connection.off("TokenReassigned");
        connection.off("TokenCancelled");
        connection.off("QueueUpdated");
        connection.off("CounterStatusChanged");

        connection.on("TokenCalled", (calledToken: TokenCalledPayload) => {
            if (!isMountedRef.current || (effectiveCenterId && calledToken.centerId !== effectiveCenterId)) return;
            if (!shouldProcessEvent(createEventDedupKey.called(calledToken))) return;
            setLatestCalledToken(calledToken);
        });

        connection.on("TokenStatusUpdated", (updatedToken: TokenStatusUpdatedPayload) => {
            if (!isMountedRef.current || (effectiveCenterId && updatedToken.centerId !== effectiveCenterId)) return;
            if (!shouldProcessEvent(createEventDedupKey.status(updatedToken))) return;
            setLatestStatusUpdate(updatedToken);
        });

        connection.on("TokenReassigned", (reassignedToken: TokenReassignedPayload) => {
            if (!isMountedRef.current || (effectiveCenterId && reassignedToken.centerId !== effectiveCenterId)) return;
            if (!shouldProcessEvent(createEventDedupKey.reassigned(reassignedToken))) return;
            setLatestReassignment(reassignedToken);
        });

        connection.on("TokenCancelled", (cancelledToken: TokenCancelledPayload) => {
            if (!isMountedRef.current || (effectiveCenterId && cancelledToken.centerId !== effectiveCenterId)) return;
            if (!shouldProcessEvent(createEventDedupKey.cancelled(cancelledToken))) return;
            setLatestCancellation(cancelledToken);
        });

        connection.on("QueueUpdated", (queueUpdated: QueueUpdatedPayload) => {
            if (!isMountedRef.current || (effectiveCenterId && queueUpdated.centerId !== effectiveCenterId)) return;
            if (isOfficer && effectiveCounterId && queueUpdated.counterId !== effectiveCounterId) return;
            if (!shouldProcessEvent(createEventDedupKey.queueUpdated(queueUpdated))) return;
            setLatestQueueUpdate(queueUpdated);
        });

        connection.on("CounterStatusChanged", (payload: CounterStatusChangedPayload) => {
            if (!isMountedRef.current || (effectiveCenterId && payload.centerId !== effectiveCenterId)) return;
            if (!shouldProcessEvent(createEventDedupKey.counterStatus(payload))) return;
            setLatestCounterStatusChange(payload);
        });
    }, [effectiveCenterId, effectiveCounterId, isOfficer, shouldProcessEvent]);

    const handleConnected = useCallback(async (connection: HubConnection) => {
        await joinGroups(connection);

        reconnectAttemptRef.current = 0;
        clearReconnectTimer();
        setReconnectAttempt(0);
        setConnectionStatus("connected");
        setLastConnectedAt(new Date());

        if (effectiveCenterId) {
            sessionStorage.setItem(SESSION_CENTER_ID_KEY, String(effectiveCenterId));
        }

        if (effectiveCounterId) {
            sessionStorage.setItem(SESSION_COUNTER_ID_KEY, String(effectiveCounterId));
        }

        if (onReconnected) {
            await onReconnected();
        }
    }, [clearReconnectTimer, effectiveCenterId, effectiveCounterId, joinGroups, onReconnected]);

    const scheduleReconnect = useCallback((reason: string) => {
        if (stopRequestedRef.current || !isMountedRef.current) {
            return;
        }

        if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
            setConnectionStatus("disconnected");
            return;
        }

        reconnectAttemptRef.current += 1;
        const attempt = reconnectAttemptRef.current;
        const delay = RECONNECT_DELAYS_MS[Math.min(attempt - 1, RECONNECT_DELAYS_MS.length - 1)];
        setReconnectAttempt(attempt);
        setConnectionStatus("reconnecting");
        console.log(`[QueueHub] reconnect reason=${reason}, attempt=${attempt}, delay=${delay}ms`);

        clearReconnectTimer();
        reconnectTimerRef.current = window.setTimeout(() => {
            void reconnect();
        }, delay);
    }, [clearReconnectTimer]);

    const connect = useCallback(async () => {
        if (stopRequestedRef.current || !isMountedRef.current) {
            return;
        }

        if (!canConnect) {
            setConnectionStatus("disconnected");
            return;
        }

        const hasValidToken = await ensureValidAccessToken();
        if (!hasValidToken) {
            return;
        }

        let connection = connectionRef.current;
        if (!connection) {
            connection = new HubConnectionBuilder()
                .withUrl(hubUrl, {
                    accessTokenFactory: () => getAccessToken() ?? "",
                    // Avoid negotiate->connect ID mismatch behind proxies/load balancers.
                    // Direct WebSocket mode skips negotiate and stabilizes real-time connectivity.
                    skipNegotiation: true,
                    transport: HttpTransportType.WebSockets,
                    // JWT bearer auth is sent via accessTokenFactory; cookies are not required.
                    // Disabling credentials avoids cross-origin negotiate failures when ACA-Credentials is missing.
                    withCredentials: false,
                })
                .configureLogging(LogLevel.Warning)
                .build();

            connection.onclose(() => {
                if (!stopRequestedRef.current) {
                    scheduleReconnect("onclose");
                }
            });

            connectionRef.current = connection;
        }

        attachEventListeners(connection);

        if (connection.state === HubConnectionState.Connected) {
            await handleConnected(connection);
            return;
        }

        setConnectionStatus("connecting");

        try {
            await connection.start();
            if (!isMountedRef.current || stopRequestedRef.current) {
                return;
            }

            await handleConnected(connection);
        } catch {
            scheduleReconnect("start-failed");
        }
    }, [attachEventListeners, canConnect, ensureValidAccessToken, getAccessToken, handleConnected, hubUrl, scheduleReconnect]);

    const reconnect = useCallback(async () => {
        const connection = connectionRef.current;
        clearReconnectTimer();

        if (connection && connection.state === HubConnectionState.Connected) {
            try {
                await leaveGroups(connection);
                await connection.stop();
            } catch {
            }
        }

        await connect();
    }, [clearReconnectTimer, connect, leaveGroups]);

    useEffect(() => {
        isMountedRef.current = true;
        stopRequestedRef.current = false;

        if (!canConnect) {
            setLatestCalledToken(null);
            setLatestStatusUpdate(null);
            setLatestReassignment(null);
            setLatestCancellation(null);
            setLatestQueueUpdate(null);
            setLatestCounterStatusChange(null);
            setConnectionStatus("disconnected");
            return;
        }

        if (centerId && !Number.isNaN(centerId)) {
            sessionStorage.setItem(SESSION_CENTER_ID_KEY, String(centerId));
        }

        if (counterId && !Number.isNaN(counterId)) {
            sessionStorage.setItem(SESSION_COUNTER_ID_KEY, String(counterId));
        }

        void connect();

        return () => {
            stopRequestedRef.current = true;
            isMountedRef.current = false;
            clearReconnectTimer();

            const connectionToStop = connectionRef.current;
            if (connectionToStop) {
                connectionToStop.off("TokenCalled");
                connectionToStop.off("TokenStatusUpdated");
                connectionToStop.off("TokenReassigned");
                connectionToStop.off("TokenCancelled");
                connectionToStop.off("QueueUpdated");
                connectionToStop.off("CounterStatusChanged");
            }

            const stop = async () => {
                if (connectionToStop?.state === HubConnectionState.Connected) {
                    try {
                        await leaveGroups(connectionToStop);
                    } catch {
                    }
                }

                try {
                    await connectionToStop?.stop();
                } finally {
                    connectionRef.current = null;
                }
            };

            void stop();
        };
    }, [centerId, clearReconnectTimer, connect, counterId, canConnect, leaveGroups]);

    useEffect(() => {
        if (!isVisible || !isMountedRef.current) {
            return;
        }

        if (connectionStatus === "disconnected" || connectionStatus === "reconnecting") {
            if (pageVisibilityReconnectRef.current) {
                return;
            }

            pageVisibilityReconnectRef.current = true;
            void reconnect().finally(() => {
                pageVisibilityReconnectRef.current = false;
            });
            return;
        }

        if (connectionStatus === "connected" && onReconnected) {
            void onReconnected();
        }
    }, [connectionStatus, isVisible, onReconnected, reconnect]);

    useEffect(() => {
        if (user) {
            return;
        }

        clearSessionGroupState();
        stopRequestedRef.current = true;
        clearReconnectTimer();
        reconnectAttemptRef.current = 0;
        setReconnectAttempt(0);

        const connection = connectionRef.current;
        if (connection) {
            void connection.stop();
            connectionRef.current = null;
        }

        setConnectionStatus("disconnected");
    }, [clearReconnectTimer, clearSessionGroupState, user]);

    return {
        latestCalledToken,
        latestStatusUpdate,
        latestReassignment,
        latestCancellation,
        latestQueueUpdate,
        latestCounterStatusChange,
        connectionStatus,
        lastConnectedAt,
        reconnectAttempt,
        reconnect,
    };
}
