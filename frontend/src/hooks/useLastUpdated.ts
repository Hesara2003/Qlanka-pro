// frontend/src/hooks/useLastUpdated.ts

import { useEffect, useMemo, useState } from "react";

export function useLastUpdated(lastUpdatedAt: Date | null) {
    const [, setTick] = useState(0);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setTick((prev) => prev + 1);
        }, 1000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, []);

    const lastUpdatedText = useMemo(() => {
        if (!lastUpdatedAt) {
            return "--";
        }

        const deltaMs = Date.now() - lastUpdatedAt.getTime();
        if (deltaMs < 2000) {
            return "Just now";
        }

        const deltaSeconds = Math.floor(deltaMs / 1000);
        if (deltaSeconds < 60) {
            return `${deltaSeconds}s ago`;
        }

        const deltaMinutes = Math.floor(deltaSeconds / 60);
        return `${deltaMinutes}m ago`;
    }, [lastUpdatedAt]);

    return { lastUpdatedText };
}
