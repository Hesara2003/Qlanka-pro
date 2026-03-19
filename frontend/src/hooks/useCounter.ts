// frontend/src/hooks/useCounter.ts

import { useState, useCallback, useEffect, useRef } from "react";
import { counterApi, CallNextError, UpdateTokenStatusError, ReassignTokenError } from "../api/counterApi";
import type { CalledTokenDto, CallNextErrorCode, AvailableCounterDto } from "../api/counterApi";

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
}

/**
 * Custom hook managing the "call next token" action for a counter officer.
 *
 * Usage:
 *   const { calledToken, loading, error, errorCode, callNext, reset } = useCounter(counterId);
 */
export function useCounter(counterId: number | undefined | null, centerId?: number | null): UseCounterResult {
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

    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
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
    }, [counterId]);

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
    }, [calledToken, counterId]);

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
    }, [calledToken, counterId]);

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
    }, [counterId]);

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
    };
}
