// frontend/src/hooks/useCounter.ts

import { useState, useCallback, useEffect, useRef } from "react";
import { counterApi, CallNextError, UpdateTokenStatusError, ReassignTokenError } from "../api/counterApi";
import type {
    QueueUpdatedPayload,
    TokenCalledPayload,
    TokenCancelledPayload,
    TokenReassignedPayload,
    TokenStatusUpdatedPayload,
} from "./useQueueHub";
import type {
    CalledTokenDto,
    CallNextErrorCode,
    AvailableCounterDto,
    CounterDashboardDto,
    CounterStatsDto,
    WaitingTokenDto,
} from "../api/counterApi";

export type TokenActionStatus = "served" | "skipped";

export interface TokenActionOutcome {
    status: TokenActionStatus;
    tokenNumber: string;
}

interface UseCounterResult {
    /** The token most recently called at this counter, or null if none yet. */
    calledToken: CalledTokenDto | null;
    /** True while the call-next API request is in-flight. */
    loading: boolean;
    /** Human-readable error message, or null if no error. */
    error: string | null;
    /** Machine-readable error code for scenario-specific UI. */
    errorCode: CallNextErrorCode | null;
    /** Triggers the call-next API action. */
    callNext: () => Promise<void>;
    /** Marks the currently called token as served. */
    serveToken: () => Promise<void>;
    /** Marks the currently called token as skipped. */
    skipToken: () => Promise<void>;
    /** True while the serve API request is in-flight. */
    serveLoading: boolean;
    /** True while the skip API request is in-flight. */
    skipLoading: boolean;
    /** Human-readable serve-action error, or null if none. */
    serveError: string | null;
    /** Human-readable skip-action error, or null if none. */
    skipError: string | null;
    /** Whether serve action can be retried immediately. */
    serveRetryable: boolean;
    /** Whether skip action can be retried immediately. */
    skipRetryable: boolean;
    /** Latest serve/skip outcome to be shown in UI feedback. */
    actionOutcome: TokenActionOutcome | null;
    /** Clears any active action outcome feedback state. */
    clearActionOutcome: () => void;
    /** Resets state back to the idle (no-token-called) state. */
    reset: () => void;
    /** Open counters in the same center (excluding this officer counter). */
    availableCounters: AvailableCounterDto[];
    /** Reassign token action loading state. */
    reassignLoading: boolean;
    /** Reassign token action error. */
    reassignError: string | null;
    /** Reassigns the given token to another counter. */
    reassignToken: (tokenId: number, targetCounterId: number, reason?: string) => Promise<boolean>;
    /** Counter dashboard payload. */
    dashboard: CounterDashboardDto | null;
    /** Waiting tokens list for this counter. */
    waitingTokens: WaitingTokenDto[];
    /** Daily stats for this counter. */
    stats: CounterStatsDto;
    /** Dashboard call loading state. */
    dashboardLoading: boolean;
    /** Stats call loading state. */
    statsLoading: boolean;
    /** Timestamp for the latest dashboard refresh. */
    dashboardLastUpdatedAt: Date | null;
    /** Fetches full dashboard payload. */
    fetchDashboard: () => Promise<void>;
    /** Fetches stats payload only. */
    fetchStats: () => Promise<void>;
}

interface QueueRefreshSignals {
    latestCalledToken: TokenCalledPayload | null;
    latestStatusUpdate: TokenStatusUpdatedPayload | null;
    latestReassignment: TokenReassignedPayload | null;
    latestCancellation: TokenCancelledPayload | null;
    latestQueueUpdate: QueueUpdatedPayload | null;
}

/**
 * Custom hook managing the "call next token" action for a counter officer.
 *
 * Usage:
 *   const { calledToken, loading, error, errorCode, callNext, reset } = useCounter(counterId);
 */
export function useCounter(
    counterId: number | undefined | null,
    centerId?: number | null,
    queueRefreshSignals?: QueueRefreshSignals,
): UseCounterResult {
    const [calledToken, setCalledToken] = useState<CalledTokenDto | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorCode, setErrorCode] = useState<CallNextErrorCode | null>(null);
    const [serveLoading, setServeLoading] = useState(false);
    const [skipLoading, setSkipLoading] = useState(false);
    const [serveError, setServeError] = useState<string | null>(null);
    const [skipError, setSkipError] = useState<string | null>(null);
    const [serveRetryable, setServeRetryable] = useState(false);
    const [skipRetryable, setSkipRetryable] = useState(false);
    const [actionOutcome, setActionOutcome] = useState<TokenActionOutcome | null>(null);
    const [availableCounters, setAvailableCounters] = useState<AvailableCounterDto[]>([]);
    const [reassignLoading, setReassignLoading] = useState(false);
    const [reassignError, setReassignError] = useState<string | null>(null);
    const [dashboard, setDashboard] = useState<CounterDashboardDto | null>(null);
    const [waitingTokens, setWaitingTokens] = useState<WaitingTokenDto[]>([]);
    const [stats, setStats] = useState<CounterStatsDto>({
        servedCount: 0,
        skippedCount: 0,
        averageServiceTimeSeconds: 0,
    });
    const [dashboardLoading, setDashboardLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [dashboardLastUpdatedAt, setDashboardLastUpdatedAt] = useState<Date | null>(null);

    const isMountedRef = useRef(true);
    const dashboardDebounceTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;

            if (dashboardDebounceTimeoutRef.current !== null) {
                window.clearTimeout(dashboardDebounceTimeoutRef.current);
                dashboardDebounceTimeoutRef.current = null;
            }
        };
    }, []);

    const fetchAvailableCounters = useCallback(async () => {
        if (centerId == null || Number.isNaN(centerId)) {
            if (isMountedRef.current) {
                setAvailableCounters([]);
            }
            return;
        }

        try {
            const counters = await counterApi.getAvailableCounters(centerId);
            if (!isMountedRef.current) return;

            const currentCounterId = counterId ?? null;
            const openCounters = counters.filter((counter) => {
                const status = counter.status?.toLowerCase?.() ?? "";
                return status === "open" && counter.counterId !== currentCounterId;
            });

            setAvailableCounters(openCounters);
        } catch {
            if (isMountedRef.current) {
                setAvailableCounters([]);
            }
        }
    }, [centerId, counterId]);

    useEffect(() => {
        void fetchAvailableCounters();
    }, [fetchAvailableCounters]);

    const fetchDashboard = useCallback(async () => {
        if (counterId == null) {
            if (isMountedRef.current) {
                setDashboard(null);
                setWaitingTokens([]);
                setDashboardLastUpdatedAt(null);
            }
            return;
        }

        if (isMountedRef.current) {
            setDashboardLoading(true);
        }

        try {
            const payload = await counterApi.getDashboard(counterId);
            if (!isMountedRef.current) return;

            const normalizedWaitingTokens = (payload.waitingTokens ?? []).slice().sort((a, b) => {
                const posA = a.queuePosition ?? Number.MAX_SAFE_INTEGER;
                const posB = b.queuePosition ?? Number.MAX_SAFE_INTEGER;
                return posA - posB;
            });

            setDashboard(payload);
            setWaitingTokens(normalizedWaitingTokens);
            setDashboardLastUpdatedAt(new Date());

            setStats({
                servedCount: payload.servedCount ?? 0,
                skippedCount: payload.skippedCount ?? 0,
                averageServiceTimeSeconds: payload.averageServiceTimeSeconds ?? 0,
            });
        } catch {
            if (!isMountedRef.current) return;
            setDashboard(null);
            setWaitingTokens([]);
        } finally {
            if (isMountedRef.current) {
                setDashboardLoading(false);
            }
        }
    }, [counterId]);

    const fetchStats = useCallback(async () => {
        if (counterId == null) {
            if (isMountedRef.current) {
                setStats({ servedCount: 0, skippedCount: 0, averageServiceTimeSeconds: 0 });
            }
            return;
        }

        if (isMountedRef.current) {
            setStatsLoading(true);
        }

        try {
            const payload = await counterApi.getStats(counterId);
            if (!isMountedRef.current) return;
            setStats({
                servedCount: payload.servedCount ?? 0,
                skippedCount: payload.skippedCount ?? 0,
                averageServiceTimeSeconds: payload.averageServiceTimeSeconds ?? 0,
            });
        } catch {
            if (!isMountedRef.current) return;
            setStats({ servedCount: 0, skippedCount: 0, averageServiceTimeSeconds: 0 });
        } finally {
            if (isMountedRef.current) {
                setStatsLoading(false);
            }
        }
    }, [counterId]);

    const scheduleDashboardRefresh = useCallback(() => {
        if (dashboardDebounceTimeoutRef.current !== null) {
            window.clearTimeout(dashboardDebounceTimeoutRef.current);
        }

        dashboardDebounceTimeoutRef.current = window.setTimeout(() => {
            dashboardDebounceTimeoutRef.current = null;
            void fetchDashboard();
        }, 300);
    }, [fetchDashboard]);

    useEffect(() => {
        void fetchDashboard();
    }, [fetchDashboard]);

    useEffect(() => {
        void fetchStats();

        const intervalId = window.setInterval(() => {
            void fetchStats();
        }, 30000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [fetchStats]);

    useEffect(() => {
        const calledEvent = queueRefreshSignals?.latestCalledToken;
        if (!calledEvent || counterId == null) return;
        if (calledEvent.counterId !== counterId) return;

        if (isMountedRef.current) {
            setCalledToken({
                tokenId: calledEvent.tokenId,
                centerId: calledEvent.centerId,
                counterId: calledEvent.counterId,
                userId: calledEvent.userId ?? 0,
                tokenNumber: calledEvent.tokenNumber,
                issuedDate: calledEvent.issuedDate,
                status: calledEvent.status,
                issuedTime: calledEvent.issuedTime,
                calledAt: calledEvent.calledAt,
            });
        }

        scheduleDashboardRefresh();
    }, [queueRefreshSignals?.latestCalledToken, counterId, scheduleDashboardRefresh]);

    useEffect(() => {
        const queueUpdatedEvent = queueRefreshSignals?.latestQueueUpdate;
        if (!queueUpdatedEvent || counterId == null) return;
        if (queueUpdatedEvent.counterId !== counterId) return;
        if (centerId != null && queueUpdatedEvent.centerId !== centerId) return;

        if (!isMountedRef.current) return;

        const normalizedWaitingTokens = (queueUpdatedEvent.waitingTokens ?? []).map((token) => ({
            tokenId: token.tokenId,
            tokenNumber: token.tokenNumber,
            queuePosition: token.queuePosition,
            issuedAt: token.issuedAt,
            estimatedWaitSeconds: token.estimatedWaitSeconds,
            issuedTime: token.issuedAt,
            status: "Waiting",
        }));

        setWaitingTokens(normalizedWaitingTokens);
        setStats({
            servedCount: queueUpdatedEvent.servedCountToday ?? 0,
            skippedCount: queueUpdatedEvent.skippedCountToday ?? 0,
            averageServiceTimeSeconds: stats.averageServiceTimeSeconds ?? 0,
        });
        setDashboardLastUpdatedAt(
            queueUpdatedEvent.timestamp
                ? new Date(queueUpdatedEvent.timestamp)
                : new Date(),
        );
    }, [queueRefreshSignals?.latestQueueUpdate, counterId, centerId, stats.averageServiceTimeSeconds]);

    useEffect(() => {
        const statusEvent = queueRefreshSignals?.latestStatusUpdate;
        if (!statusEvent || counterId == null) return;
        if (statusEvent.counterId !== counterId) return;

        if (isMountedRef.current) {
            setCalledToken(null);
        }

        scheduleDashboardRefresh();
        void fetchStats();
    }, [queueRefreshSignals?.latestStatusUpdate, counterId, scheduleDashboardRefresh, fetchStats]);

    useEffect(() => {
        const cancelledEvent = queueRefreshSignals?.latestCancellation;
        if (!cancelledEvent || counterId == null) return;
        if (cancelledEvent.counterId !== 0 && cancelledEvent.counterId !== counterId) return;
        if (centerId != null && cancelledEvent.centerId !== centerId) return;

        if (isMountedRef.current && calledToken?.tokenId === cancelledEvent.tokenId) {
            setCalledToken(null);
        }

        if (!isMountedRef.current) return;
        setWaitingTokens((prev) => prev
            .filter((token) => token.tokenId !== cancelledEvent.tokenId)
            .map((token, index) => ({
                ...token,
                queuePosition: index + 1,
            })));
    }, [queueRefreshSignals?.latestCancellation, counterId, centerId, calledToken?.tokenId]);

    useEffect(() => {
        const reassignmentEvent = queueRefreshSignals?.latestReassignment;
        if (!reassignmentEvent || counterId == null) return;

        const affectsCounter =
            reassignmentEvent.sourceCounterId === counterId
            || reassignmentEvent.targetCounterId === counterId;

        if (!affectsCounter) return;

        scheduleDashboardRefresh();
    }, [queueRefreshSignals?.latestReassignment, counterId, scheduleDashboardRefresh]);

    const callNext = useCallback(async () => {
        if (counterId == null) {
            setError("Counter not configured. Please contact an administrator.");
            setErrorCode("UNKNOWN_ERROR");
            return;
        }

        setLoading(true);
        setError(null);
        setErrorCode(null);
        setServeError(null);
        setSkipError(null);
        setServeRetryable(false);
        setSkipRetryable(false);
        setActionOutcome(null);

        try {
            const token = await counterApi.callNext(counterId);
            if (isMountedRef.current) {
                setCalledToken(token);
            }

            await fetchDashboard();
            await fetchStats();
        } catch (err) {
            if (isMountedRef.current) {
                if (err instanceof CallNextError) {
                    setError(err.message);
                    setErrorCode(err.code);
                } else {
                    setError(err instanceof Error ? err.message : "An unexpected error occurred.");
                    setErrorCode("UNKNOWN_ERROR");
                }
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [counterId, fetchDashboard, fetchStats]);

    const serveToken = useCallback(async () => {
        if (counterId == null || !calledToken) {
            setServeError("No token is currently being served.");
            setServeRetryable(false);
            return;
        }

        setServeLoading(true);
        setServeError(null);
        setServeRetryable(false);
        setSkipError(null);
        setSkipRetryable(false);

        try {
            await counterApi.updateTokenStatus(counterId, calledToken.tokenId, "served");

            if (isMountedRef.current) {
                setActionOutcome({
                    status: "served",
                    tokenNumber: calledToken.tokenNumber,
                });
                setCalledToken(null);
            }

            await fetchDashboard();
            await fetchStats();
        } catch (err) {
            if (isMountedRef.current) {
                if (err instanceof UpdateTokenStatusError) {
                    if (err.code === "INVALID_STATUS") {
                        setServeError("Token already updated. Queue state has been refreshed.");
                        setCalledToken(null);
                        setServeRetryable(false);
                    } else if (err.code === "NETWORK_ERROR") {
                        setServeError("Network issue while serving this token. Please retry.");
                        setServeRetryable(true);
                    } else {
                        setServeError(err.message);
                        setServeRetryable(false);
                    }
                } else {
                    setServeError(err instanceof Error ? err.message : "An unexpected error occurred.");
                    setServeRetryable(false);
                }
            }
        } finally {
            if (isMountedRef.current) {
                setServeLoading(false);
            }
        }
    }, [calledToken, counterId, fetchDashboard, fetchStats]);

    const skipToken = useCallback(async () => {
        if (counterId == null || !calledToken) {
            setSkipError("No token is currently being served.");
            setSkipRetryable(false);
            return;
        }

        setSkipLoading(true);
        setSkipError(null);
        setSkipRetryable(false);
        setServeError(null);
        setServeRetryable(false);

        try {
            await counterApi.updateTokenStatus(counterId, calledToken.tokenId, "skipped");

            if (isMountedRef.current) {
                setActionOutcome({
                    status: "skipped",
                    tokenNumber: calledToken.tokenNumber,
                });
                setCalledToken(null);
            }

            await fetchDashboard();
            await fetchStats();
        } catch (err) {
            if (isMountedRef.current) {
                if (err instanceof UpdateTokenStatusError) {
                    if (err.code === "INVALID_STATUS") {
                        setSkipError("Token already updated. Queue state has been refreshed.");
                        setCalledToken(null);
                        setSkipRetryable(false);
                    } else if (err.code === "NETWORK_ERROR") {
                        setSkipError("Network issue while skipping this token. Please retry.");
                        setSkipRetryable(true);
                    } else {
                        setSkipError(err.message);
                        setSkipRetryable(false);
                    }
                } else {
                    setSkipError(err instanceof Error ? err.message : "An unexpected error occurred.");
                    setSkipRetryable(false);
                }
            }
        } finally {
            if (isMountedRef.current) {
                setSkipLoading(false);
            }
        }
    }, [calledToken, counterId, fetchDashboard, fetchStats]);

    const clearActionOutcome = useCallback(() => {
        setActionOutcome(null);
    }, []);

    const reassignToken = useCallback(async (tokenId: number, targetCounterId: number, reason?: string) => {
        if (counterId == null) {
            if (isMountedRef.current) {
                setReassignError("Counter not configured. Please contact an administrator.");
            }
            return false;
        }

        if (!tokenId || !targetCounterId) {
            if (isMountedRef.current) {
                setReassignError("Select a valid token and target counter.");
            }
            return false;
        }

        if (isMountedRef.current) {
            setReassignLoading(true);
            setReassignError(null);
        }

        try {
            await counterApi.reassignToken(counterId, tokenId, targetCounterId, reason);

            if (isMountedRef.current) {
                setReassignError(null);
            }

            await fetchDashboard();
            await fetchStats();
            return true;
        } catch (err) {
            if (!isMountedRef.current) return false;

            if (err instanceof ReassignTokenError) {
                setReassignError(err.message);
            } else {
                setReassignError(err instanceof Error ? err.message : "An unexpected error occurred.");
            }
            return false;
        } finally {
            if (isMountedRef.current) {
                setReassignLoading(false);
            }
        }
        return false;
    }, [counterId, fetchDashboard, fetchStats]);

    const reset = useCallback(() => {
        setCalledToken(null);
        setError(null);
        setErrorCode(null);
        setLoading(false);
        setServeLoading(false);
        setSkipLoading(false);
        setServeError(null);
        setSkipError(null);
        setServeRetryable(false);
        setSkipRetryable(false);
        setActionOutcome(null);
        setReassignLoading(false);
        setReassignError(null);
        setDashboard(null);
        setWaitingTokens([]);
        setStats({ servedCount: 0, skippedCount: 0, averageServiceTimeSeconds: 0 });
        setDashboardLoading(false);
        setStatsLoading(false);
        setDashboardLastUpdatedAt(null);
    }, []);

    return {
        calledToken,
        loading,
        error,
        errorCode,
        callNext,
        serveToken,
        skipToken,
        serveLoading,
        skipLoading,
        serveError,
        skipError,
        serveRetryable,
        skipRetryable,
        actionOutcome,
        clearActionOutcome,
        reset,
        availableCounters,
        reassignLoading,
        reassignError,
        reassignToken,
        dashboard,
        waitingTokens,
        stats,
        dashboardLoading,
        statsLoading,
        dashboardLastUpdatedAt,
        fetchDashboard,
        fetchStats,
    };
}
