// frontend/src/components/common/ToastContainer.tsx

import type { ToastItem } from "../../hooks/useToast";

interface Props {
    toasts: ToastItem[];
    onRemoveToast: (id: string) => void;
}

const typeClassMap: Record<ToastItem["type"], string> = {
    success: "bg-[#1a1c23] border-l-4 border-[#78d64b] text-white",
    warning: "bg-[#1a1c23] border-l-4 border-amber-500 text-white",
    error: "bg-[#1a1c23] border-l-4 border-red-500 text-white",
    info: "bg-[#1a1c23] border-l-4 border-blue-500 text-white",
};

export default function ToastContainer({ toasts, onRemoveToast }: Props) {
    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`rounded-lg px-4 py-3 shadow-lg transition-all duration-200 ease-out ${typeClassMap[toast.type]} ${
                        toast.visible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
                    }`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium leading-snug">{toast.message}</p>
                        <button
                            type="button"
                            onClick={() => onRemoveToast(toast.id)}
                            className="text-white/70 hover:text-white text-sm"
                            aria-label="Dismiss toast"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
