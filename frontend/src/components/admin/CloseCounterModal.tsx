// frontend/src/components/admin/CloseCounterModal.tsx

import { useEffect, useState } from "react";
import type { Counter } from "../../types/counter";

interface CloseCounterModalProps {
  counter: Counter;
  waitingTokenCount: number;
  loading: boolean;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}

export default function CloseCounterModal({
  counter,
  waitingTokenCount,
  loading,
  onConfirm,
  onCancel,
}: CloseCounterModalProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loading, onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => {
          if (!loading) onCancel();
        }}
      />

      <div className="relative w-full max-w-lg bg-[#1a1c23] rounded-[2rem] shadow-xl text-white p-6">
        <h2 className="text-2xl font-extrabold tracking-tight mb-2">Close Counter</h2>
        <p className="text-white/70 mb-5">
          You are about to close <span className="font-bold text-white">{counter.name}</span>.
        </p>

        {waitingTokenCount > 0 && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-300 text-sm">
            This counter has {waitingTokenCount} waiting token(s). Closing is allowed, but customers may be affected.
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-1.5">Reason for closing (optional)</label>
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. lunch break"
            className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-red-400/40"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-11 px-6 rounded-[2rem] border border-white/20 text-white font-bold hover:bg-white/5 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason.trim() || undefined)}
            disabled={loading}
            className="h-11 px-6 rounded-[2rem] bg-red-500 text-white font-bold shadow-xl hover:bg-red-600 transition-all disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 rounded-full border-2 border-white/20 border-t-[#78d64b] animate-spin" />
            ) : null}
            Confirm Close
          </button>
        </div>
      </div>
    </div>
  );
}
