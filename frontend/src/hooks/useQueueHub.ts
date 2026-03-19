// frontend/src/hooks/useQueueHub.ts

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    HubConnection,
    HubConnectionBuilder,
    HubConnectionState,
    LogLevel,
} from "@microsoft/signalr";
import type { IRetryPolicy, RetryContext } from "@microsoft/signalr";

export type QueueHubConnectionStatus = "disconnected" | "reconnecting" | "connected";

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
    connectionStatus: QueueHubConnectionStatus;
    reconnect: () => Promise<void>;
}

const getHubUrl = () => {
    const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? window.location.origin).replace(/\/+$/, "");
    const baseUrl = rawBaseUrl.replace(/\/api$/i, "");
    return `${baseUrl}/hubs/queue`;
};

const mapStateToStatus = (state: HubConnectionState): QueueHubConnectionStatus => {
    if (state === HubConnectionState.Connected) return "connected";
    if (state === HubConnectionState.Reconnecting) return "reconnecting";
    return "disconnected";
};

class ExponentialBackoffRetryPolicy implements IRetryPolicy {
    nextRetryDelayInMilliseconds(retryContext: RetryContext): number | null {
        const delay = Math.min(1000 * (2 ** retryContext.previousRetryCount), 30000);
        return delay;
    }
}

const createEventDedupKey = {
    called: (payload: TokenCalledPayload) => `called:${payload.tokenId}:${payload.calledAt}`,
    status: (payload: TokenStatusUpdatedPayload) => `status:${payload.tokenId}:${payload.newStatus}:${payload.servedAt ?? ""}:${payload.skippedAt ?? ""}`,
    reassigned: (payload: TokenReassignedPayload) => `reassigned:${payload.tokenId}:${payload.reassignedAt}:${payload.sourceCounterId}:${payload.targetCounterId}`,
    cancelled: (payload: TokenCancelledPayload) => `cancelled:${payload.tokenId}:${payload.cancelledAt}`,
    queueUpdated: (payload: QueueUpdatedPayload) => `queue:${payload.counterId}:${payload.timestamp}:${payload.triggerAction}`,
};

export function useQueueHub(options: UseQueueHubOptions): UseQueueHubResult {
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
    const [connectionStatus, setConnectionStatus] = useState<QueueHubConnectionStatus>("disconnected");

    const hubUrl = useMemo(() => getHubUrl(), []);
    const isMountedRef = useRef(true);
    const connectionRef = useRef<HubConnection | null>(null);
    const stopRequestedRef = useRef(false);
    const seenEventsRef = useRef<Map<string, number>>(new Map());

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

        if (centerId && !Number.isNaN(centerId)) {
            await connection.invoke("JoinCenterGroup", centerId);
        }

        if (isOfficer && counterId && !Number.isNaN(counterId)) {
            await connection.invoke("JoinCounterGroup", counterId);
        }
    }, [centerId, counterId, isOfficer]);

    const leaveGroups = useCallback(async (connection: HubConnection) => {
        if (connection.state !== HubConnectionState.Connected) {
            return;
        }

        if (centerId && !Number.isNaN(centerId)) {
            await connection.invoke("LeaveCenterGroup", centerId);
        }

        if (isOfficer && counterId && !Number.isNaN(counterId)) {
            await connection.invoke("LeaveCounterGroup", counterId);
        }
    }, [centerId, counterId, isOfficer]);

    const startConnectionWithRetry = useCallback(async (connection: HubConnection) => {
        let attempt = 0;

        while (!stopRequestedRef.current && isMountedRef.current) {
            try {
                await connection.start();
                if (!isMountedRef.current || stopRequestedRef.current) {
                    return;
                }

                await joinGroups(connection);
                setConnectionStatus("connected");
                return;
            } catch {
                if (!isMountedRef.current || stopRequestedRef.current) {
                    return;
                }

                setConnectionStatus(mapStateToStatus(connection.state));
                const retryDelayMs = Math.min(1000 * (2 ** attempt), 30000);
                attempt += 1;
                await new Promise((resolve) => {
                    window.setTimeout(resolve, retryDelayMs);
                });
            }
        }
    }, [joinGroups]);

    const reconnect = useCallback(async () => {
        const connection = connectionRef.current;
        if (!connection || !isMountedRef.current) {
            return;
        }

        try {
            if (connection.state === HubConnectionState.Connected) {
                await leaveGroups(connection);
                await connection.stop();
            }
        } catch {
        }

        if (isMountedRef.current && !stopRequestedRef.current) {
            setConnectionStatus("reconnecting");
            await startConnectionWithRetry(connection);
        }
    }, [leaveGroups, startConnectionWithRetry]);

    useEffect(() => {
        isMountedRef.current = true;

        if (!enabled || !centerId || Number.isNaN(centerId)) {
            setLatestCalledToken(null);
            setLatestStatusUpdate(null);
            setLatestReassignment(null);
            setLatestCancellation(null);
            setLatestQueueUpdate(null);
            setConnectionStatus("disconnected");
            return;
        }

        stopRequestedRef.current = false;

        const connection: HubConnection = new HubConnectionBuilder()
            .withUrl(hubUrl)
            .withAutomaticReconnect(new ExponentialBackoffRetryPolicy())
            .configureLogging(LogLevel.Warning)
            .build();
        connectionRef.current = connection;

        const onTokenCalled = (calledToken: TokenCalledPayload) => {
            if (!isMountedRef.current || calledToken.centerId !== centerId) return;
            if (!shouldProcessEvent(createEventDedupKey.called(calledToken))) return;
            setLatestCalledToken(calledToken);
        };

        const onTokenStatusUpdated = (updatedToken: TokenStatusUpdatedPayload) => {
            if (!isMountedRef.current || updatedToken.centerId !== centerId) return;
            if (!shouldProcessEvent(createEventDedupKey.status(updatedToken))) return;
            setLatestStatusUpdate(updatedToken);
        };

        const onTokenReassigned = (reassignedToken: TokenReassignedPayload) => {
            if (!isMountedRef.current || reassignedToken.centerId !== centerId) return;
            if (!shouldProcessEvent(createEventDedupKey.reassigned(reassignedToken))) return;
            setLatestReassignment(reassignedToken);
        };

        const onTokenCancelled = (cancelledToken: TokenCancelledPayload) => {
            if (!isMountedRef.current || cancelledToken.centerId !== centerId) return;
            if (!shouldProcessEvent(createEventDedupKey.cancelled(cancelledToken))) return;
            setLatestCancellation(cancelledToken);
        };

        const onQueueUpdated = (queueUpdated: QueueUpdatedPayload) => {
            if (!isMountedRef.current || queueUpdated.centerId !== centerId) return;
            if (isOfficer && counterId && queueUpdated.counterId !== counterId) return;
            if (!shouldProcessEvent(createEventDedupKey.queueUpdated(queueUpdated))) return;
            setLatestQueueUpdate(queueUpdated);
        };

        connection.on("TokenCalled", onTokenCalled);
        connection.on("TokenStatusUpdated", onTokenStatusUpdated);
        connection.on("TokenReassigned", onTokenReassigned);
        connection.on("TokenCancelled", onTokenCancelled);
        connection.on("QueueUpdated", onQueueUpdated);

        connection.onreconnecting(() => {
            if (!isMountedRef.current || stopRequestedRef.current) return;
            setConnectionStatus("reconnecting");
        });

        connection.onreconnected(async () => {
            if (!isMountedRef.current || stopRequestedRef.current) return;
            try {
                await joinGroups(connection);
                if (onReconnected) {
                    await onReconnected();
                }
                setConnectionStatus("connected");
            } catch {
                setConnectionStatus("reconnecting");
            }
        });

        connection.onclose(() => {
            if (!isMountedRef.current || stopRequestedRef.current) return;
            setConnectionStatus("disconnected");
        });

        setConnectionStatus("reconnecting");
        void startConnectionWithRetry(connection);

        return () => {
            stopRequestedRef.current = true;
            isMountedRef.current = false;

            connection.off("TokenCalled", onTokenCalled);
            connection.off("TokenStatusUpdated", onTokenStatusUpdated);
            connection.off("TokenReassigned", onTokenReassigned);
            connection.off("TokenCancelled", onTokenCancelled);
            connection.off("QueueUpdated", onQueueUpdated);

            const stop = async () => {
                if (connection.state === HubConnectionState.Connected) {
                    try {
                        await leaveGroups(connection);
                    } catch {
                    }
                }

                try {
                    await connection.stop();
                } finally {
                    connectionRef.current = null;
                }
            };

            void stop();
        };
    }, [centerId, counterId, enabled, hubUrl, isOfficer, joinGroups, leaveGroups, onReconnected, shouldProcessEvent, startConnectionWithRetry]);

    return {
        latestCalledToken,
        latestStatusUpdate,
        latestReassignment,
        latestCancellation,
        latestQueueUpdate,
        connectionStatus,
        reconnect,
    };
}
