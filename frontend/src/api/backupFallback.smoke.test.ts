import { describe, it, expect, beforeEach, vi } from "vitest";
import axios, { AxiosError } from "axios";

vi.mock("./axiosInstance", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import axiosInstance from "./axiosInstance";
import { supabase } from "../lib/supabaseClient";
import { loginUser } from "./authApi";
import { getAllServiceCenters } from "./serviceCenterApi";
import { bookToken } from "./appointmentApi";

function networkError(): AxiosError {
  return new axios.AxiosError("Network Error", "ERR_NETWORK", undefined, undefined, undefined);
}

describe("Backup fallback smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("uses Supabase login fallback when backend is down", async () => {
    vi.mocked(axiosInstance.post).mockRejectedValue(networkError());

    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>;
    fromMock.mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: () => ({
            eq: (field: string, value: string) => ({
              maybeSingle: async () => {
                if (field === "username" && value === "citizen1") {
                  return {
                    data: {
                      user_id: 3,
                      username: "citizen1",
                      email: "citizen1@demo.local",
                      password_hash: "Demo@123",
                      role: "citizen",
                      center_id: 1,
                      is_active: true,
                    },
                    error: null,
                  };
                }

                return { data: null, error: null };
              },
            }),
          }),
        };
      }

      if (table === "counters") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            }),
          }),
        };
      }

      throw new Error(`Unhandled table in test: ${table}`);
    });

    const response = await loginUser({ username: "citizen1", password: "Demo@123" });

    expect(response.role).toBe("citizen");
    expect(response.token).toContain(".");
    expect(response.userId).toBe(3);
  });

  it("uses Supabase service-center fallback when backend is down", async () => {
    vi.mocked(axiosInstance.get).mockRejectedValue(networkError());

    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>;
    fromMock.mockImplementation((table: string) => {
      if (table === "service_centers") {
        return {
          select: () => ({
            order: async () => ({
              data: [
                {
                  center_id: 1,
                  name: "Colombo One Stop Center",
                  address: "No. 12, Main Street, Colombo 01",
                  phone: "+94112223344",
                  email: "colombo.center@demo.local",
                  description: "Primary demo center",
                  timezone: "Asia/Colombo",
                  capacity: 150,
                  opening_time: "08:00:00",
                  closing_time: "17:00:00",
                  is_active: true,
                  created_at: "2026-04-19T10:00:00Z",
                },
              ],
              error: null,
            }),
          }),
        };
      }

      throw new Error(`Unhandled table in test: ${table}`);
    });

    const centers = await getAllServiceCenters();

    expect(centers.length).toBeGreaterThan(0);
    expect(centers[0].centerId).toBe(1);
    expect(centers[0].isAvailable).toBe(true);
  });

  it("uses Supabase appointment fallback when backend is down", async () => {
    vi.mocked(axiosInstance.post).mockRejectedValue(networkError());
    localStorage.setItem("token", "header.eyJzdWIiOiIzIiwicm9sZSI6ImNpdGl6ZW4ifQ.sig");

    const fakeSupabase = {
      from: vi.fn((table: string) => {
        if (table === "tokens") {
          return {
            select: () => ({
              eq: () => ({
                eq: async () => ({ count: 2, error: null }),
              }),
            }),
            insert: () => ({
              select: () => ({
                single: async () => ({ data: { token_id: 3 }, error: null }),
              }),
            }),
          };
        }

        if (table === "appointments") {
          return {
            insert: () => ({
              select: () => ({
                single: async () => ({
                  data: {
                    appointment_id: 3,
                    center_id: 1,
                    user_id: 3,
                    appointment_date: "2026-04-19",
                    appointment_time: "10:30:00",
                    status: "Booked",
                    created_at: "2026-04-19T10:30:00Z",
                  },
                  error: null,
                }),
              }),
            }),
            update: () => ({
              eq: async () => ({ error: null }),
            }),
          };
        }

        throw new Error(`Unhandled table in test: ${table}`);
      }),
    };

    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>;
    fromMock.mockImplementation(fakeSupabase.from as never);

    const booked = await bookToken({
      centerId: 1,
      appointmentDate: "2026-04-19",
      appointmentTime: "10:30:00",
    });

    expect(booked.appointmentId).toBe(3);
    expect(booked.tokenNumber).toBe("T03");
  });
});
