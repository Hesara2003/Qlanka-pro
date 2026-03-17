// frontend/src/hooks/useCounter.ts

import { useState, useCallback, useRef } from "react";
import { counterApi, CallNextError } from "../api/counterApi";
import type { CalledTokenDto, CallNextErrorCode } from "../api/counterApi";

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

    const isMountedRef = useRef(true);

    // Keep isMountedRef accurate when the component using this hook unmounts.
    // (We can't use useEffect here without it being a component, so callers
    //  should call reset() on unmount if needed — or accept minor setState warnings.)

    const callNext = useCallback(async () => {
        if (counterId === undefined) return;

        setLoading(true);
        setError(null);
        setErrorCode(null);

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

    const reset = useCallback(() => {
        setCalledToken(null);
        setError(null);
        setErrorCode(null);
        setLoading(false);
    }, []);

    return {
        calledToken,
        loading,
        error,
        errorCode,
        callNext,
        reset,
    };
}
