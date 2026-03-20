// frontend/src/pages/AdminCountersPage.tsx

import { useEffect, useMemo, useState } from "react";
import CounterCard from "../components/admin/CounterCard";
import CreateCounterModal from "../components/admin/CreateCounterModal";
import CloseCounterModal from "../components/admin/CloseCounterModal";
import ToastContainer from "../components/common/ToastContainer";
import { getAdminUsers } from "../api/userApi";
import { useCounterManagement } from "../hooks/useCounterManagement";
import { useServiceCenters } from "../hooks/useServiceCenters";
import { useToast } from "../hooks/useToast";
import type { Counter, CreateCounterRequest } from "../types/counter";
import type { AdminUser } from "../types/user";

export default function AdminCountersPage() {
  const { centers, loading: centersLoading } = useServiceCenters();
  const {
    counters,
    stats,
    loading,
    error,
    fetchCounters,
    createCounter,
    updateCounterStatus,
  } = useCounterManagement();
  const { toasts, addToast, removeToast } = useToast();

  const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [closeTarget, setCloseTarget] = useState<Counter | null>(null);
  const [officers, setOfficers] = useState<AdminUser[]>([]);
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionCounterId, setActionCounterId] = useState<number | null>(null);

  useEffect(() => {
    if (centers.length > 0 && selectedCenterId == null) {
      setSelectedCenterId(centers[0].centerId);
    }
  }, [centers, selectedCenterId]);

  useEffect(() => {
    if (selectedCenterId != null) {
      fetchCounters(selectedCenterId);
    }
  }, [selectedCenterId, fetchCounters]);

  useEffect(() => {
    let isMounted = true;

    async function loadOfficers() {
      try {
        const users = await getAdminUsers();
        if (!isMounted) return;
        setOfficers(users.filter((user) => user.role === "officer"));
      } catch {
        if (!isMounted) return;
        setOfficers([]);
      }
    }

    loadOfficers();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedCenter = useMemo(
    () => centers.find((center) => center.centerId === selectedCenterId) ?? null,
    [centers, selectedCenterId]
  );

  const handleRetry = async () => {
    if (selectedCenterId == null) return;
    await fetchCounters(selectedCenterId);
  };

  const handleCreateCounter = async (request: CreateCounterRequest) => {
    if (selectedCenterId == null) return;

    setModalError(null);

    try {
      const created = await createCounter(selectedCenterId, request);
      setShowCreateModal(false);
      addToast(`Counter ${created.name} created successfully`, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create counter.";
      setModalError(message);
      addToast(message, "error");
    }
  };

  const handleStatusAction = async (counterId: number, isOpen: boolean, reason?: string) => {
    if (selectedCenterId == null) return;

    const counter = counters.find((item) => item.counterId === counterId);
    if (!counter) return;

    if (!isOpen) {
      setCloseTarget(counter);
      return;
    }

    try {
      setActionCounterId(counterId);
      const updated = await updateCounterStatus(selectedCenterId, counterId, true, reason);
      addToast(`Counter ${updated.name} is now open`, "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to update counter status.", "error");
    } finally {
      setActionCounterId(null);
    }
  };

  const handleConfirmClose = async (reason?: string) => {
    if (selectedCenterId == null || closeTarget == null) return;

    try {
      setActionCounterId(closeTarget.counterId);
      const updated = await updateCounterStatus(
        selectedCenterId,
        closeTarget.counterId,
        false,
        reason
      );
      setCloseTarget(null);

      addToast(`Counter ${updated.name} is now closed`, "success");
      if (updated.warningMessage) {
        addToast(updated.warningMessage, "warning");
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to close counter.", "error");
    } finally {
      setActionCounterId(null);
    }
  };

  return (
    <div className="px-10 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-gray-900 tracking-tight mb-2">
            Counter Management
          </h1>
          <p className="text-gray-400 text-[13px] font-bold mt-1 uppercase tracking-widest">
            Manage counters by center
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setModalError(null);
            setShowCreateModal(true);
          }}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-[#78d64b] hover:brightness-95 text-black font-bold rounded-[2rem] shadow-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Counter
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {centers.map((center) => (
          <button
            key={center.centerId}
            type="button"
            onClick={() => setSelectedCenterId(center.centerId)}
            className={`px-4 py-2 rounded-full font-bold text-[13px] transition-colors shadow-sm ${
              selectedCenterId === center.centerId
                ? "bg-black text-white"
                : "bg-white text-gray-500 hover:text-gray-900 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {center.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Counters</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{stats?.totalCount ?? 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Open</p>
          <p className="text-3xl font-extrabold text-[#78d64b] mt-1">{stats?.openCount ?? 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Closed</p>
          <p className="text-3xl font-extrabold text-red-500 mt-1">{stats?.closedCount ?? 0}</p>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-[240px] rounded-[2rem] animate-pulse bg-white/10" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-semibold mb-2">Failed to load counters</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && counters.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center mb-8">
          <p className="text-gray-600 font-semibold mb-2">No counters yet for this center</p>
          <p className="text-gray-500 text-sm mb-4">
            {selectedCenter ? `Center: ${selectedCenter.name}` : "Select a center"}
          </p>
          <button
            type="button"
            onClick={() => {
              setModalError(null);
              setShowCreateModal(true);
            }}
            className="px-5 py-2.5 bg-[#78d64b] hover:brightness-95 text-black font-bold rounded-[2rem] shadow-xl"
          >
            Add Counter
          </button>
        </div>
      )}

      {!loading && !error && counters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {counters.map((counter) => (
            <CounterCard
              key={counter.counterId}
              counter={counter}
              loading={actionCounterId === counter.counterId}
              onStatusChange={handleStatusAction}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateCounterModal
          centers={centers}
          officers={officers}
          loading={loading || centersLoading}
          error={modalError}
          onConfirm={handleCreateCounter}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {closeTarget && (
        <CloseCounterModal
          counter={closeTarget}
          waitingTokenCount={closeTarget.currentTokenNumber != null ? 1 : 0}
          loading={actionCounterId === closeTarget.counterId}
          onConfirm={handleConfirmClose}
          onCancel={() => setCloseTarget(null)}
        />
      )}

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}
