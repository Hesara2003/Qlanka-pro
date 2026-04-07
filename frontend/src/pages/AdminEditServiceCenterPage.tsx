import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getServiceCenterById,
  getServiceCenterLocation,
  upsertServiceCenterLocation,
  updateServiceCenterStatus,
} from "../api/serviceCenterApi";
import type { UpsertLocationRequest } from "../types/serviceCenter";

const INITIAL_LOCATION: UpsertLocationRequest = {
  streetAddress: "",
  city: "",
  district: "",
  province: "",
  postalCode: "",
  country: "Sri Lanka",
  latitude: undefined,
  longitude: undefined,
  googleMapsUrl: "",
  landmark: "",
};

export default function AdminEditServiceCenterPage() {
  const { centerId } = useParams<{ centerId: string }>();
  const navigate = useNavigate();

  const numericId = Number(centerId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [centerName, setCenterName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [location, setLocation] = useState<UpsertLocationRequest>(INITIAL_LOCATION);

  useEffect(() => {
    async function load() {
      if (!Number.isFinite(numericId) || numericId <= 0) {
        setError("Invalid center ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const center = await getServiceCenterById(numericId);
        setCenterName(center.name);
        setIsActive(center.isActive);

        try {
          const existingLocation = await getServiceCenterLocation(numericId);
          setLocation({
            streetAddress: existingLocation.streetAddress ?? "",
            city: existingLocation.city ?? "",
            district: existingLocation.district ?? "",
            province: existingLocation.province ?? "",
            postalCode: existingLocation.postalCode ?? "",
            country: existingLocation.country ?? "Sri Lanka",
            latitude: existingLocation.latitude,
            longitude: existingLocation.longitude,
            googleMapsUrl: existingLocation.googleMapsUrl ?? "",
            landmark: existingLocation.landmark ?? "",
          });
        } catch {
          setLocation((prev) => ({ ...prev, country: prev.country || "Sri Lanka" }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load center details.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [numericId]);

  function updateField<K extends keyof UpsertLocationRequest>(field: K, value: UpsertLocationRequest[K]) {
    setLocation((prev) => ({ ...prev, [field]: value }));
  }

  async function onSave() {
    if (!location.streetAddress.trim() || !location.city.trim() || !location.district.trim() || !location.province.trim()) {
      setError("Street address, city, district, and province are required.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateServiceCenterStatus(numericId, isActive);
      await upsertServiceCenterLocation(numericId, {
        ...location,
        streetAddress: location.streetAddress.trim(),
        city: location.city.trim(),
        district: location.district.trim(),
        province: location.province.trim(),
        postalCode: location.postalCode?.trim() || undefined,
        country: (location.country || "Sri Lanka").trim(),
        googleMapsUrl: location.googleMapsUrl?.trim() || undefined,
        landmark: location.landmark?.trim() || undefined,
      });
      setSuccess("Service center updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update service center.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="px-10 py-8">
        <p className="text-sm text-gray-600">Loading center details...</p>
      </div>
    );
  }

  return (
    <div className="px-10 py-8 max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Service Center</h1>
          <p className="text-sm text-gray-500 mt-1">{centerName} (ID: {numericId})</p>
        </div>
        <Link
          to="/admin/service-centers"
          className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          Back
        </Link>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Center Status</p>
            <p className="text-xs text-gray-500">Enable or disable booking availability for this center.</p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4"
            />
            Active
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm text-gray-700">
            Street Address
            <input
              value={location.streetAddress}
              onChange={(e) => updateField("streetAddress", e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-gray-700">
            City
            <input
              value={location.city}
              onChange={(e) => updateField("city", e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-gray-700">
            District
            <input
              value={location.district}
              onChange={(e) => updateField("district", e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-gray-700">
            Province
            <input
              value={location.province}
              onChange={(e) => updateField("province", e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-gray-700">
            Postal Code
            <input
              value={location.postalCode ?? ""}
              onChange={(e) => updateField("postalCode", e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-gray-700">
            Country
            <input
              value={location.country}
              onChange={(e) => updateField("country", e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={() => navigate("/admin/service-centers")}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
