// frontend/src/components/admin/CreateCounterModal.tsx

import { useEffect, useMemo, useState } from "react";
import type { AdminUser } from "../../types/user";
import type { ServiceCenter } from "../../types/serviceCenter";
import type { CreateCounterRequest } from "../../types/counter";

interface CreateCounterModalProps {
  centers: ServiceCenter[];
  officers: AdminUser[];
  loading: boolean;
  error: string | null;
  onConfirm: (request: CreateCounterRequest) => void;
  onCancel: () => void;
}

interface ValidationErrors {
  name?: string;
  centerId?: string;
  assignedOfficerUserId?: string;
}

export default function CreateCounterModal({
  centers,
  officers,
  loading,
  error,
  onConfirm,
  onCancel,
}: CreateCounterModalProps) {
  const [name, setName] = useState("");
  const [centerId, setCenterId] = useState<number>(centers[0]?.centerId ?? 0);
  const [assignedOfficerUserId, setAssignedOfficerUserId] = useState<number | "">("");
  const [errors, setErrors] = useState<ValidationErrors>({});

  const officerOptions = useMemo(
    () => officers.filter((user) => user.role === "officer"),
    [officers]
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loading, onCancel]);

  const validate = () => {
    const nextErrors: ValidationErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Counter name is required.";
    } else if (name.trim().length > 100) {
      nextErrors.name = "Counter name cannot exceed 100 characters.";
    }

    if (!centerId || centerId <= 0) {
      nextErrors.centerId = "Please select a center.";
    }

    if (assignedOfficerUserId !== "" && Number(assignedOfficerUserId) <= 0) {
      nextErrors.assignedOfficerUserId = "Please select a valid officer.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) {
      return;
    }

    onConfirm({
      name: name.trim(),
      centerId,
      assignedOfficerUserId:
        assignedOfficerUserId === "" ? undefined : Number(assignedOfficerUserId),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => {
          if (!loading) onCancel();
        }}
      />

      <div className="relative w-full max-w-lg bg-[#1a1c23] rounded-[2rem] shadow-xl text-white p-6">
        <h2 className="text-2xl font-extrabold tracking-tight mb-5">Create Counter</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">Counter Name</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              placeholder="e.g. Counter 1"
              className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#78d64b]/40"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">Center</label>
            <select
              value={centerId || ""}
              onChange={(event) => setCenterId(Number(event.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#78d64b]/40"
            >
              {centers.length === 0 && (
                <option value="" className="bg-[#1a1c23]">
                  No centers available
                </option>
              )}
              {centers.map((center) => (
                <option key={center.centerId} value={center.centerId} className="bg-[#1a1c23]">
                  {center.name}
                </option>
              ))}
            </select>
            {errors.centerId && <p className="text-red-400 text-xs mt-1.5">{errors.centerId}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">Assign Officer (Optional)</label>
            <select
              value={assignedOfficerUserId}
              onChange={(event) =>
                setAssignedOfficerUserId(event.target.value ? Number(event.target.value) : "")
              }
              className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#78d64b]/40"
            >
              <option value="" className="bg-[#1a1c23]">Unassigned</option>
              {officerOptions.length === 0 && (
                <option value="" className="bg-[#1a1c23]">
                  No officers available
                </option>
              )}
              {officerOptions.map((officer) => (
                <option key={officer.userId} value={officer.userId} className="bg-[#1a1c23]">
                  {officer.username}
                </option>
              ))}
            </select>
            {errors.assignedOfficerUserId && (
              <p className="text-red-400 text-xs mt-1.5">{errors.assignedOfficerUserId}</p>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
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
            onClick={handleConfirm}
            disabled={loading}
            className="h-11 px-6 rounded-[2rem] bg-[#78d64b] text-black font-bold shadow-xl hover:brightness-95 transition-all disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 rounded-full border-2 border-black/20 border-t-[#78d64b] animate-spin" />
            ) : null}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
