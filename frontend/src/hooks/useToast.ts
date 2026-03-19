// frontend/src/hooks/useToast.ts

import { useCallback, useRef, useState } from "react";

export type ToastType = "success" | "warning" | "error" | "info";

export interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
    visible: boolean;
}

const DEFAULT_DURATION_MS = 4000;
const DISMISS_ANIMATION_MS = 220;
const MAX_VISIBLE_TOASTS = 3;

export function useToast() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const timeoutMapRef = useRef<Map<string, number>>(new Map());

    const clearToastTimeout = useCallback((id: string) => {
        const timeoutId = timeoutMapRef.current.get(id);
        if (timeoutId != null) {
            window.clearTimeout(timeoutId);
            timeoutMapRef.current.delete(id);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.map((toast) => (toast.id === id ? { ...toast, visible: false } : toast)));
        clearToastTimeout(id);

        const timeoutId = window.setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
            timeoutMapRef.current.delete(id);
        }, DISMISS_ANIMATION_MS);

        timeoutMapRef.current.set(id, timeoutId);
    }, [clearToastTimeout]);

    const addToast = useCallback((message: string, type: ToastType, duration = DEFAULT_DURATION_MS) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

        setToasts((prev) => {
            const next = [...prev, { id, message, type, duration, visible: false }];
            if (next.length <= MAX_VISIBLE_TOASTS) {
                return next;
            }

            const [oldest] = next;
            clearToastTimeout(oldest.id);
            return next.slice(1);
        });

        const showTimeoutId = window.setTimeout(() => {
            setToasts((prev) => prev.map((toast) => (toast.id === id ? { ...toast, visible: true } : toast)));
        }, 10);
        window.setTimeout(() => window.clearTimeout(showTimeoutId), 20);

        const autoDismissTimeoutId = window.setTimeout(() => {
            removeToast(id);
        }, Math.max(500, duration));

        timeoutMapRef.current.set(id, autoDismissTimeoutId);
    }, [clearToastTimeout, removeToast]);

    return { toasts, addToast, removeToast };
}
