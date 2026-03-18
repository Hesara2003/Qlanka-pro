// frontend/src/hooks/useCounter.ts

import { useState, useCallback, useEffect, useRef } from "react";
import { counterApi, CallNextError } from "../api/counterApi";
import type { CalledTokenDto, CallNextErrorCode } from "../api/counterApi";

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
    /** Latest serve/skip outcome to be shown in UI feedback. */
    actionOutcome: TokenActionOutcome | null;
    /** Clears any active action outcome feedback state. */
    clearActionOutcome: () => void;
    /** Resets state back to the idle (no-token-called) state. */
    reset: () => void;
}

/**
 * Custom hook managing the "call next token" action for a counter officer.
 *
 * Usage:
 *   const { calledToken, loading, error, errorCode, callNext, reset } = useCounter(counterId);
 */
export function useCounter(counterId: number | undefined): UseCounterResult {
    const [calledToken, setCalledToken] = useState<CalledTokenDto | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorCode, setErrorCode] = useState<CallNextErrorCode | null>(null);
    const [serveLoading, setServeLoading] = useState(false);
    const [skipLoading, setSkipLoading] = useState(false);
    const [serveError, setServeError] = useState<string | null>(null);
    const [skipError, setSkipError] = useState<string | null>(null);
    const [actionOutcome, setActionOutcome] = useState<TokenActionOutcome | null>(null);

    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const callNext = useCallback(async () => {
        if (counterId === undefined) {
            setError("Counter not configured. Please contact an administrator.");
            setErrorCode("UNKNOWN_ERROR");
            return;
        }

        setLoading(true);
        setError(null);
        setErrorCode(null);
        setServeError(null);
        setSkipError(null);
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
        if (counterId === undefined || !calledToken) {
            setServeError("No token is currently being served.");
            return;
        }

        setServeLoading(true);
        setServeError(null);

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
                setServeError(err instanceof Error ? err.message : "An unexpected error occurred.");
            }
        } finally {
            if (isMountedRef.current) {
                setServeLoading(false);
            }
        }
    }, [calledToken, counterId]);

    const skipToken = useCallback(async () => {
        if (counterId === undefined || !calledToken) {
            setSkipError("No token is currently being served.");
            return;
        }

        setSkipLoading(true);
        setSkipError(null);

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
                setSkipError(err instanceof Error ? err.message : "An unexpected error occurred.");
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

    const reset = useCallback(() => {
        setCalledToken(null);
        setError(null);
        setErrorCode(null);
        setLoading(false);
        setServeLoading(false);
        setSkipLoading(false);
        setServeError(null);
        setSkipError(null);
        setActionOutcome(null);
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
        actionOutcome,
        clearActionOutcome,
        reset,
    };
}
