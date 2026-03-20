// frontend/src/hooks/useCounterManagement.ts

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createCounter as createCounterApi,
  getCounters,
  updateCounterStatus as updateCounterStatusApi,
} from "../api/counterManagementApi";
import type {
  Counter,
  CreateCounterRequest,
  ListCountersResponse,
} from "../types/counter";

interface UseCounterManagementResult {
  counters: Counter[];
  stats: Pick<ListCountersResponse, "totalCount" | "centerId" | "openCount" | "closedCount"> | null;
  loading: boolean;
  createLoading: boolean;
  statusUpdateLoading: boolean;
  error: string | null;
  fetchCounters: (centerId: number) => Promise<void>;
  createCounter: (centerId: number, request: CreateCounterRequest) => Promise<Counter>;
  updateCounterStatus: (
    centerId: number,
    counterId: number,
    isOpen: boolean,
    reason?: string
  ) => Promise<Counter>;
  applyRealtimeCounterStatusChange: (counterId: number, isOpen: boolean) => void;
}

export function useCounterManagement(): UseCounterManagementResult {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [stats, setStats] = useState<UseCounterManagementResult["stats"]>(null);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const selectedCenterRef = useRef<number | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchCounters = useCallback(async (centerId: number) => {
    selectedCenterRef.current = centerId;

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const data = await getCounters(centerId);

      if (!isMountedRef.current) {
        return;
      }

      setCounters(data.counters);
      setStats({
        totalCount: data.totalCount,
        centerId: data.centerId,
        openCount: data.openCount,
        closedCount: data.closedCount,
      });
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }

      setError(err instanceof Error ? err.message : "Failed to load counters.");
      setCounters([]);
      setStats(null);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const createCounter = useCallback(async (centerId: number, request: CreateCounterRequest) => {
    if (isMountedRef.current) {
      setCreateLoading(true);
      setError(null);
    }

    try {
      const created = await createCounterApi(centerId, request);

      if (isMountedRef.current && selectedCenterRef.current != null) {
        await fetchCounters(selectedCenterRef.current);
      }

      return created;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to create counter.");
      }

      throw err;
    } finally {
      if (isMountedRef.current) {
        setCreateLoading(false);
      }
    }
  }, [fetchCounters]);

  const updateCounterStatus = useCallback(
    async (centerId: number, counterId: number, isOpen: boolean, reason?: string) => {
      if (isMountedRef.current) {
        setStatusUpdateLoading(true);
        setError(null);
      }

      try {
        const updated = await updateCounterStatusApi(centerId, counterId, {
          isOpen,
          reason,
        });

        if (isMountedRef.current && selectedCenterRef.current != null) {
          await fetchCounters(selectedCenterRef.current);
        }

        return updated;
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : "Failed to update counter status.");
        }

        throw err;
      } finally {
        if (isMountedRef.current) {
          setStatusUpdateLoading(false);
        }
      }
    },
    [fetchCounters]
  );

  const applyRealtimeCounterStatusChange = useCallback((counterId: number, isOpen: boolean) => {
    if (!isMountedRef.current) {
      return;
    }

    setCounters((previous) => {
      const next = previous.map((counter) =>
        counter.counterId === counterId ? { ...counter, isOpen } : counter
      );

      setStats((currentStats) => {
        if (!currentStats) {
          return currentStats;
        }

        const openCount = next.filter((counter) => counter.isOpen).length;
        return {
          ...currentStats,
          openCount,
          closedCount: Math.max(0, next.length - openCount),
          totalCount: next.length,
        };
      });

      return next;
    });
  }, []);

  return {
    counters,
    stats,
    loading,
    createLoading,
    statusUpdateLoading,
    error,
    fetchCounters,
    createCounter,
    updateCounterStatus,
    applyRealtimeCounterStatusChange,
  };
}
