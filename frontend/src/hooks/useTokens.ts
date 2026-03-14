// Custom React Hook for User Token Data — SCRUM-58 / SCRUM-63
import { useState, useEffect, useCallback, useRef } from "react";
import { tokenApi } from "../api/tokenApi";
import { CancelTokenError } from "../api/tokenApi";
import type { UserToken } from "../api/tokenApi";

interface UseTokensOptions {
    /** How often (ms) to silently re-fetch in the background. 0 = disabled. Default: 30 000 */
    pollInterval?: number;
}

interface UseTokensResult {
    tokens: UserToken[];
    /** True only during the initial blocking fetch — background polls do not set this. */
    loading: boolean;
    error: string | null;
    lastUpdated: Date | null;
    /** Manually trigger a full (visible) refresh. */
    refresh: () => void;
    /**
     * Cancel a Waiting token by id.
     *
     * Applies an optimistic update immediately so the UI reacts at once, then
     * calls the API.  If the API rejects, the previous state is restored and
     * the error is re-thrown so the caller (UserTokenCard) can surface it.
     * On success a silent background re-fetch syncs the updated queue positions
     * of all remaining Waiting tokens.
     */
    cancelToken: (tokenId: number) => Promise<void>;
}

export function useTokens(options: UseTokensOptions = {}): UseTokensResult {
    const { pollInterval = 30_000 } = options;

    const [tokens, setTokens] = useState<UserToken[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isMountedRef = useRef(true);

    // ── Core fetch ──────────────────────────────────────────────────────────
    // silent=true  → background poll: no loading spinner, errors are swallowed
    //                (temporary network hiccup should not wipe the visible list)
    // silent=false → user-triggered or initial load: spinner shown, error shown
    const fetchTokens = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await tokenApi.getMyTokens();
            if (isMountedRef.current) {
                setTokens(data);
                setError(null);
                setLastUpdated(new Date());
            }
        } catch (err) {
            if (isMountedRef.current && !silent) {
                setError(err instanceof Error ? err.message : "Failed to fetch tokens.");
            }
        } finally {
            if (isMountedRef.current && !silent) {
                setLoading(false);
            }
        }
    }, []);

    // ── Initial load ─────────────────────────────────────────────────────────
    useEffect(() => {
        isMountedRef.current = true;
        fetchTokens();
        return () => {
            isMountedRef.current = false;
        };
    }, [fetchTokens]);

    // ── Background polling ────────────────────────────────────────────────────
    useEffect(() => {
        if (pollInterval <= 0) return;
        intervalRef.current = setInterval(() => fetchTokens(true), pollInterval);
        return () => {
            if (intervalRef.current !== null) clearInterval(intervalRef.current);
        };
    }, [fetchTokens, pollInterval]);

    // ── Optimistic cancel ─────────────────────────────────────────────────────
    const cancelToken = useCallback(
        async (tokenId: number) => {
            // Snapshot for rollback
            const snapshot = tokens;

            // Optimistic update: immediately mark the token as Cancelled and
            // clear its queue position so the card flips to the cancelled view.
            setTokens((prev) =>
                prev.map((t) =>
                    t.tokenId === tokenId
                        ? {
                              ...t,
                              status: "Cancelled",
                              cancelledAt: new Date().toISOString(),
                              queuePosition: null,
                              eta: null,
                          }
                        : t
                )
            );

            try {
                await tokenApi.cancelToken(tokenId);
                // Silent re-fetch so the updated queue positions of the remaining
                // Waiting tokens (shifted by the stored procedure) come through.
                fetchTokens(true);
            } catch (err) {
                // Special case: the token was ALREADY cancelled on the server
                // (e.g. cancelled from another session / device).
                // The optimistic state (status=Cancelled) already reflects reality —
                // do NOT roll back, just let a silent re-fetch confirm the server state.
                if (err instanceof CancelTokenError && err.code === "TOKEN_ALREADY_CANCELLED") {
                    fetchTokens(true);
                    throw err; // still throw so the card can show the contextual message
                }

                // For every other failure (not found, not cancellable, network, auth)
                // the optimistic Cancelled state is wrong — restore the snapshot.
                if (isMountedRef.current) setTokens(snapshot);
                throw err;
            }
        },
        [tokens, fetchTokens]
    );

    return {
        tokens,
        loading,
        error,
        lastUpdated,
        refresh: () => fetchTokens(false),
        cancelToken,
    };
}
