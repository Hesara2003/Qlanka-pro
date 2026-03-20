// frontend/src/components/admin/CounterCard.tsx

import type { Counter } from "../../types/counter";

interface CounterCardProps {
  counter: Counter;
  loading: boolean;
  onStatusChange: (counterId: number, isOpen: boolean, reason?: string) => void;
}

export default function CounterCard({ counter, loading, onStatusChange }: CounterCardProps) {
  const isOpen = counter.isOpen;

  return (
    <div className="bg-[#1a1c23] rounded-[2rem] shadow-xl text-white p-6 flex flex-col min-h-[240px]">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-xl font-extrabold tracking-tight">{counter.name}</h3>
          <p className="text-sm text-white/60 mt-1">{counter.centerName}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            isOpen ? "bg-[#78d64b]/20 text-[#78d64b]" : "bg-red-500/20 text-red-400"
          }`}
        >
          {isOpen ? "Open" : "Closed"}
        </span>
      </div>

      <div className="space-y-2 mb-6">
        <p className="text-sm">
          <span className="text-white/50">Assigned Officer:</span>{" "}
          <span className="font-semibold text-white/80">{counter.assignedOfficerName ?? "Unassigned"}</span>
        </p>

        {isOpen && counter.currentTokenNumber != null && (
          <p className="text-sm">
            <span className="text-white/50">Current Token:</span>{" "}
            <span className="font-semibold text-[#78d64b]">#{counter.currentTokenNumber}</span>
          </p>
        )}
      </div>

      <div className="mt-auto flex justify-end">
        {!isOpen ? (
          <button
            type="button"
            onClick={() => onStatusChange(counter.counterId, true)}
            disabled={loading}
            className="min-w-[120px] h-11 px-6 rounded-[2rem] bg-[#78d64b] text-black font-bold shadow-xl hover:brightness-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 rounded-full border-2 border-black/20 border-t-[#78d64b] animate-spin" />
            ) : null}
            Open
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onStatusChange(counter.counterId, false)}
            disabled={loading}
            className="min-w-[120px] h-11 px-6 rounded-[2rem] bg-red-500 text-white font-bold shadow-xl hover:bg-red-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 rounded-full border-2 border-white/20 border-t-[#78d64b] animate-spin" />
            ) : null}
            Close
          </button>
        )}
      </div>
    </div>
  );
}
