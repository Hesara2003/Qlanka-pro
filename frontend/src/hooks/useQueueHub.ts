// frontend/src/hooks/useQueueHub.ts

import { useEffect, useMemo, useState } from "react";
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";

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
    userId: number | null;
    tokenNumber: string;
    issuedDate: string;
    issuedTime: string;
    calledAt: string | null;
    servedAt: string | null;
    status: string;
}

interface UseQueueHubResult {
    latestCalledToken: TokenCalledPayload | null;
    latestStatusUpdatedToken: TokenStatusUpdatedPayload | null;
    connectionStatus: QueueHubConnectionStatus;
}

const getHubUrl = () => {
    const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? window.location.origin).replace(/\/+$/, "");
    return `${baseUrl}/hubs/queue`;
};

const mapStateToStatus = (state: HubConnectionState): QueueHubConnectionStatus => {
    if (state === HubConnectionState.Connected) return "connected";
    if (state === HubConnectionState.Reconnecting) return "reconnecting";
    return "disconnected";
};

export function useQueueHub(centerId: number | undefined): UseQueueHubResult {
    const [latestCalledToken, setLatestCalledToken] = useState<TokenCalledPayload | null>(null);
    const [latestStatusUpdatedToken, setLatestStatusUpdatedToken] = useState<TokenStatusUpdatedPayload | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<QueueHubConnectionStatus>("disconnected");

    const hubUrl = useMemo(() => getHubUrl(), []);

    useEffect(() => {
        if (!centerId || Number.isNaN(centerId)) {
            setConnectionStatus("disconnected");
            return;
        }

        let isActive = true;
        const connection: HubConnection = new HubConnectionBuilder()
            .withUrl(hubUrl)
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Warning)
            .build();

        const joinGroup = async () => {
            await connection.invoke("JoinCenterGroup", centerId);
        };

        connection.on("TokenCalled", (calledToken: TokenCalledPayload) => {
            if (!isActive) return;
            setLatestCalledToken(calledToken);
        });

        connection.on("TokenStatusUpdated", (updatedToken: TokenStatusUpdatedPayload) => {
            if (!isActive) return;
            setLatestStatusUpdatedToken(updatedToken);
        });

        connection.onreconnecting(() => {
            if (!isActive) return;
            setConnectionStatus("reconnecting");
        });

        connection.onreconnected(async () => {
            if (!isActive) return;
            setConnectionStatus("connected");
            try {
                await joinGroup();
            } catch {
                setConnectionStatus("reconnecting");
            }
        });

        connection.onclose(() => {
            if (!isActive) return;
            setConnectionStatus("disconnected");
        });

        const start = async () => {
            try {
                await connection.start();
                if (!isActive) return;
                await joinGroup();
                setConnectionStatus("connected");
            } catch {
                if (!isActive) return;
                setConnectionStatus(mapStateToStatus(connection.state));
            }
        };

        start();

        return () => {
            isActive = false;

            const stop = async () => {
                if (connection.state === HubConnectionState.Connected) {
                    try {
                        await connection.invoke("LeaveCenterGroup", centerId);
                    } catch {
                    }
                }

                try {
                    await connection.stop();
                } finally {
                    setConnectionStatus("disconnected");
                }
            };

            void stop();
        };
    }, [centerId, hubUrl]);

    return { latestCalledToken, latestStatusUpdatedToken, connectionStatus };
}
