import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AxiosError } from "axios";
import { useAuth } from "../context/AuthContext";
import { createServiceCenter } from "../api/serviceCenterApi";
import type { CreateServiceCenterRequest } from "../types/serviceCenter";
// ─────────────────────────────────────────────────────────────────────────────
//  Timezones
// ─────────────────────────────────────────────────────────────────────────────
const TIMEZONES = [
  { label: "Asia/Colombo (Sri Lanka, UTC+5:30)", value: "Asia/Colombo" },
  { label: "Asia/Kolkata (India, UTC+5:30)", value: "Asia/Kolkata" },
  { label: "Asia/Dhaka (Bangladesh, UTC+6)", value: "Asia/Dhaka" },
  { label: "Asia/Karachi (Pakistan, UTC+5)", value: "Asia/Karachi" },
  { label: "Asia/Kathmandu (Nepal, UTC+5:45)", value: "Asia/Kathmandu" },
  { label: "Asia/Dubai (UAE, UTC+4)", value: "Asia/Dubai" },
  { label: "Asia/Singapore (UTC+8)", value: "Asia/Singapore" },
  { label: "Asia/Tokyo (Japan, UTC+9)", value: "Asia/Tokyo" },
  { label: "Europe/London (UTC+0/+1)", value: "Europe/London" },
  { label: "America/New_York (UTC-5/-4)", value: "America/New_York" },
  { label: "UTC", value: "UTC" },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Steps definition
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = [
  { label: "Basic Info" },
  { label: "Location" },
  { label: "Operating Hours" },
  { label: "Capacity" },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────
interface FormErrors {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  capacity?: string;
  averageServiceTimeMinutes?: string;
  openingTime?: string;
  closingTime?: string;
}

const INITIAL: CreateServiceCenterRequest = {
  name: "",
  address: "",
  phone: "",
  email: "",
  description: "",
  timezone: "Asia/Colombo",
  capacity: 50,
  averageServiceTimeMinutes: 15,
  openingTime: "08:00",
  closingTime: "17:00",
  isActive: true,
};

// ─────────────────────────────────────────────────────────────────────────────
//  Per-step validation
// ─────────────────────────────────────────────────────────────────────────────
function validateStep(step: number, form: CreateServiceCenterRequest): FormErrors {
  const e: FormErrors = {};
  if (step === 0) {
    if (!form.name.trim()) e.name = "Center name is required.";
    else if (form.name.trim().length < 2 || form.name.trim().length > 100) e.name = "Name must be 2–100 characters.";
    if (form.phone && !/^[+\d\s\-().]{0,20}$/.test(form.phone)) e.phone = "Invalid phone number format.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email address.";
    if (form.description && form.description.length > 1000) e.description = "Description max 1000 characters.";
  }
  if (step === 1) {
    if (!form.address.trim()) e.address = "Address is required.";
    else if (form.address.trim().length < 5 || form.address.trim().length > 255) e.address = "Address must be 5–255 characters.";
  }
  if (step === 2) {
    const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!form.openingTime || !timeRe.test(form.openingTime)) e.openingTime = "Enter a valid opening time.";
    if (!form.closingTime || !timeRe.test(form.closingTime)) e.closingTime = "Enter a valid closing time.";
    if (!e.openingTime && !e.closingTime && form.closingTime <= form.openingTime)
      e.closingTime = "Closing time must be after opening time.";
  }
  if (step === 3) {
    if (isNaN(form.capacity) || form.capacity < 1 || form.capacity > 10000)
      e.capacity = "Capacity must be between 1 and 10,000.";
    if (isNaN(form.averageServiceTimeMinutes) || form.averageServiceTimeMinutes < 1 || form.averageServiceTimeMinutes > 480)
      e.averageServiceTimeMinutes = "Service time must be between 1 and 480 minutes.";
  }
  return e;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Small helpers
// ─────────────────────────────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {msg}
    </p>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

const INPUT_BASE =
  "block w-full px-4 py-2.5 border rounded-xl text-sm text-gray-900 placeholder-gray-400 " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";

const inputCls = (error?: string) =>
  `${INPUT_BASE} ${error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}`;

// ─────────────────────────────────────────────────────────────────────────────
//  Page
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminCreateServiceCenterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) navigate("/login");
    else if (user.role !== "admin") navigate("/service-centers");
  }, [user, navigate]);

  // ── State ─────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CreateServiceCenterRequest>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormErrors, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdName, setCreatedName] = useState<string | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function change(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, type } = e.target;
    const value = type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    const next = { ...form, [name]: value } as CreateServiceCenterRequest;
    setForm(next);
    if (touched[name as keyof FormErrors]) setErrors(validateStep(step, next));
    setSubmitError(null);
  }

  function changeNum(e: React.ChangeEvent<HTMLInputElement>) {
    const next = { ...form, [e.target.name]: e.target.valueAsNumber } as CreateServiceCenterRequest;
    setForm(next);
    if (touched[e.target.name as keyof FormErrors]) setErrors(validateStep(step, next));
    setSubmitError(null);
  }

  function blur(field: keyof FormErrors) {
    setTouched(p => ({ ...p, [field]: true }));
    setErrors(validateStep(step, form));
  }

  function showErr(field: keyof FormErrors) {
    return touched[field] ? errors[field] : undefined;
  }

  // ── Step navigation ───────────────────────────────────────────────────────
  function next() {
    const e = validateStep(step, form);
    if (Object.keys(e).length) {
      const allTouched = Object.keys(e).reduce<Partial<Record<keyof FormErrors, boolean>>>(
        (a, k) => ({ ...a, [k]: true }), {}
      );
      setTouched(p => ({ ...p, ...allTouched }));
      setErrors(e);
      return;
    }
    setErrors({});
    setTouched({});
    setStep(s => s + 1);
  }

  function back() {
    setErrors({});
    setTouched({});
    setStep(s => s - 1);
    setSubmitError(null);
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function submit() {
    const e = validateStep(step, form);
    if (Object.keys(e).length) {
      const allTouched = Object.keys(e).reduce<Partial<Record<keyof FormErrors, boolean>>>(
        (a, k) => ({ ...a, [k]: true }), {}
      );
      setTouched(p => ({ ...p, ...allTouched }));
      setErrors(e);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload: CreateServiceCenterRequest = {
        ...form,
        name: form.name.trim(),
        address: form.address.trim(),
        phone: form.phone?.trim() || undefined,
        email: form.email?.trim() || undefined,
        description: form.description?.trim() || undefined,
      };
      await createServiceCenter(payload);
      setCreatedName(payload.name);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data) {
        const data = err.response.data;
        if (data?.code === "DUPLICATE_SERVICE_CENTER") {
          setSubmitError("A service center with this name and address already exists.");
        } else {
          setSubmitError(data?.message ?? "Server error. Please try again.");
        }
      } else {
        setSubmitError("Network error. Please check your connection.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (createdName) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-lg p-10 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Center Created!</h2>
            <p className="text-gray-500 text-sm mb-6">
              <span className="font-semibold text-gray-700">"{createdName}"</span> has been registered successfully.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { setForm(INITIAL); setCreatedName(null); setStep(0); }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Create Another
              </button>
              <Link
                to="/service-centers"
                className="px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold rounded-xl transition-colors text-center"
              >
                View All Centers
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">

      {/* ── Progress rail ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-3 flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between relative">
            {/* background connector */}
            <div className="absolute left-0 right-0 top-[18px] h-px bg-gray-200 z-0" />
            {/* filled connector */}
            <div
              className="absolute left-0 top-[18px] h-px bg-blue-500 z-0 transition-all duration-300"
              style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
            />
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div key={i} className="relative z-10 flex flex-col items-center gap-1">
                  <div className={[
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors",
                    done ? "bg-blue-600 border-blue-600 text-white" :
                      active ? "bg-white border-blue-600 text-blue-600" :
                        "bg-white border-gray-300 text-gray-400",
                  ].join(" ")}>
                    {done ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : String(i + 1)}
                  </div>
                  <span className={[
                    "text-xs font-medium hidden sm:block",
                    active ? "text-blue-600" : done ? "text-gray-600" : "text-gray-400",
                  ].join(" ")}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Scrollable step content ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

          {/* Step heading */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-0.5">
              Step {step + 1} of {STEPS.length}
            </p>
            <h1 className="text-2xl font-bold text-gray-900">{STEPS[step].label}</h1>
          </div>

          {/* Global error banner */}
          {submitError && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────── */}
          {/* Step 1 – Basic Info                                              */}
          {/* ──────────────────────────────────────────────────────────────── */}
          {step === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              {/* Name */}
              <div>
                <Label required>Center Name</Label>
                <input
                  type="text" name="name" value={form.name}
                  onChange={change} onBlur={() => blur("name")} maxLength={100}
                  placeholder="e.g. Colombo Municipal Service Center"
                  className={inputCls(showErr("name"))}
                />
                <FieldError msg={showErr("name")} />
              </div>

              {/* Description */}
              <div>
                <Label>Description <span className="text-gray-400 font-normal">(optional)</span></Label>
                <textarea
                  name="description" value={form.description} rows={3}
                  onChange={change} onBlur={() => blur("description")} maxLength={1000}
                  placeholder="Brief description of services offered…"
                  className={`${inputCls(showErr("description"))} resize-none`}
                />
                <div className="flex justify-between mt-0.5">
                  <FieldError msg={showErr("description")} />
                  <span className="text-xs text-gray-400 ml-auto">
                    {(form.description ?? "").length}/1000
                  </span>
                </div>
              </div>

              {/* Phone + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Phone <span className="text-gray-400 font-normal">(optional)</span></Label>
                  <input
                    type="tel" name="phone" value={form.phone}
                    onChange={change} onBlur={() => blur("phone")} maxLength={20}
                    placeholder="+94 11 234 5678"
                    className={inputCls(showErr("phone"))}
                  />
                  <FieldError msg={showErr("phone")} />
                </div>
                <div>
                  <Label>Email <span className="text-gray-400 font-normal">(optional)</span></Label>
                  <input
                    type="email" name="email" value={form.email}
                    onChange={change} onBlur={() => blur("email")} maxLength={100}
                    placeholder="center@example.com"
                    className={inputCls(showErr("email"))}
                  />
                  <FieldError msg={showErr("email")} />
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────── */}
          {/* Step 2 – Location                                                */}
          {/* ──────────────────────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              {/* Address */}
              <div>
                <Label required>Full Address</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <input
                    type="text" name="address" value={form.address}
                    onChange={change} onBlur={() => blur("address")} maxLength={255}
                    placeholder="Street, City, District"
                    className={`${inputCls(showErr("address"))} pl-10`}
                  />
                </div>
                <FieldError msg={showErr("address")} />
              </div>

              {/* Timezone */}
              <div>
                <Label required>Timezone</Label>
                <select
                  name="timezone" value={form.timezone} onChange={change}
                  className={inputCls()}
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-gray-400">
                  Used to calculate service-queue ETAs correctly.
                </p>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────── */}
          {/* Step 3 – Operating Hours                                         */}
          {/* ──────────────────────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <p className="text-sm text-gray-500">
                Set the default opening and closing times. Per-day overrides can be configured after creation.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label required>Opening Time</Label>
                  <input
                    type="time" name="openingTime" value={form.openingTime}
                    onChange={change} onBlur={() => blur("openingTime")}
                    className={inputCls(showErr("openingTime"))}
                  />
                  <FieldError msg={showErr("openingTime")} />
                </div>
                <div>
                  <Label required>Closing Time</Label>
                  <input
                    type="time" name="closingTime" value={form.closingTime}
                    onChange={change} onBlur={() => blur("closingTime")}
                    className={inputCls(showErr("closingTime"))}
                  />
                  <FieldError msg={showErr("closingTime")} />
                </div>
              </div>

              {/* Live duration preview */}
              {!errors.openingTime && !errors.closingTime &&
                form.openingTime && form.closingTime &&
                form.closingTime > form.openingTime && (
                  <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {(() => {
                      const [oh, om] = form.openingTime.split(":").map(Number);
                      const [ch, cm] = form.closingTime.split(":").map(Number);
                      const mins = (ch * 60 + cm) - (oh * 60 + om);
                      const h = Math.floor(mins / 60), m = mins % 60;
                      return `Operating ${h}h${m > 0 ? ` ${m}m` : ""} per day`;
                    })()}
                  </div>
                )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────── */}
          {/* Step 4 – Capacity & Settings + Summary                           */}
          {/* ──────────────────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">

              {/* Capacity fields */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label required>Daily Capacity</Label>
                    <input
                      type="number" name="capacity"
                      value={isNaN(form.capacity) ? "" : form.capacity}
                      onChange={changeNum} onBlur={() => blur("capacity")} min={1} max={10000}
                      className={inputCls(showErr("capacity"))}
                    />
                    <p className="mt-1.5 text-xs text-gray-400">Max tokens per day (1–10,000)</p>
                    <FieldError msg={showErr("capacity")} />
                  </div>
                  <div>
                    <Label required>Avg. Service Time</Label>
                    <div className="relative">
                      <input
                        type="number" name="averageServiceTimeMinutes"
                        value={isNaN(form.averageServiceTimeMinutes) ? "" : form.averageServiceTimeMinutes}
                        onChange={changeNum} onBlur={() => blur("averageServiceTimeMinutes")} min={1} max={480}
                        className={`${inputCls(showErr("averageServiceTimeMinutes"))} pr-14`}
                      />
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 text-xs pointer-events-none">
                        min
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-gray-400">Used for ETA calculation (1–480)</p>
                    <FieldError msg={showErr("averageServiceTimeMinutes")} />
                  </div>
                </div>

                {/* Active toggle */}
                <div className="border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Activate immediately</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {form.isActive
                        ? "Citizens can book tokens right away."
                        : "Center will be created but hidden from bookings."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${form.isActive ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    role="switch"
                    aria-checked={form.isActive}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.isActive ? "translate-x-6" : "translate-x-0"
                      }`} />
                  </button>
                </div>
              </div>

              {/* Summary card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Review before submitting</p>
                <div className="space-y-2.5">
                  {([
                    ["Name", form.name],
                    ["Address", form.address],
                    ["Phone", form.phone || "—"],
                    ["Email", form.email || "—"],
                    ["Timezone", form.timezone],
                    ["Hours", `${form.openingTime} – ${form.closingTime}`],
                    ["Daily capacity", `${form.capacity} tokens`],
                    ["Avg. time", `${form.averageServiceTimeMinutes} min`],
                    ["Status", form.isActive ? "Active" : "Inactive"],
                  ] as [string, string][]).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                      <span className="text-gray-500 font-medium">{k}</span>
                      <span className={`text-right ml-4 font-medium truncate max-w-[220px] ${k === "Status" ? (form.isActive ? "text-emerald-600" : "text-gray-400") : "text-gray-800"
                        }`}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>{/* /max-w-2xl */}
      </div>{/* /overflow-y-auto */}

      {/* ── Fixed action bar ──────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 sm:px-8 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">

          {/* Left: Cancel / Back */}
          {step === 0 ? (
            <Link
              to="/admin"
              className="px-5 py-2.5 border border-gray-300 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
          ) : (
            <button
              type="button"
              onClick={back}
              className="px-5 py-2.5 border border-gray-300 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}

          {/* Right: Next / Create */}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Create Center
                </>
              )}
            </button>
          )}

        </div>
      </div>

    </div>
  );
}
