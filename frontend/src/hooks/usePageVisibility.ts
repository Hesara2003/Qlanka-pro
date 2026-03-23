// frontend/src/hooks/usePageVisibility.ts

import { useEffect, useState } from "react";

export function usePageVisibility() {
    const [isVisible, setIsVisible] = useState<boolean>(document.visibilityState === "visible");

    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsVisible(document.visibilityState === "visible");
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    return isVisible;
}
