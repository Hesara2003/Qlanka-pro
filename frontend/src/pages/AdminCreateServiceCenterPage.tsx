import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AxiosError } from "axios";
import { useAuth } from "../context/AuthContext";
import { createServiceCenter } from "../api/serviceCenterApi";
import type { CreateServiceCenterRequest } from "../types/serviceCenter";
import LanguageSelector from "../components/common/LanguageSelector";
import { useTranslation } from "react-i18next";

// ──────────────────────────────────────────────
//  IANA timezones grouped for the selector
// ──────────────────────────────────────────────
const TIMEZONES: { label: string; value: string }[] = [
  { label: "Asia/Colombo (Sri Lanka, UTC+5:30)", value: "Asia/Colombo" },
  { label: "Asia/Kolkata (India, UTC+5:30)", value: "Asia/Kolkata" },
  { label: "Asia/Dhaka (Bangladesh, UTC+6)", value: "Asia/Dhaka" },
  { label: "Asia/Karachi (Pakistan, UTC+5)", value: "Asia/Karachi" },
  { label: "Asia/Kathmandu (Nepal, UTC+5:45)", value: "Asia/Kathmandu" },
  { label: "Asia/Dubai (UAE, UTC+4)", value: "Asia/Dubai" },
  { label: "Asia/Singapore (UTC+8)", value: "Asia/Singapore" },
  { label: "Asia/Kuala_Lumpur (Malaysia, UTC+8)", value: "Asia/Kuala_Lumpur" },
  { label: "Asia/Bangkok (UTC+7)", value: "Asia/Bangkok" },
  { label: "Asia/Tokyo (Japan, UTC+9)", value: "Asia/Tokyo" },
  { label: "Europe/London (UTC+0/+1)", value: "Europe/London" },
  { label: "Europe/Paris (UTC+1/+2)", value: "Europe/Paris" },
  { label: "America/New_York (UTC-5/-4)", value: "America/New_York" },
  { label: "America/Los_Angeles (UTC-8/-7)", value: "America/Los_Angeles" },
  { label: "UTC", value: "UTC" },
];

// ──────────────────────────────────────────────
//  Validation helpers
// ──────────────────────────────────────────────
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

type TFn = (key: string, opts?: Record<string, unknown>) => string;

function validate(form: CreateServiceCenterRequest, t: TFn): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) {
    errors.name = t("adminCreateCenter.errors.nameRequired");
  } else if (form.name.trim().length < 2 || form.name.trim().length > 100) {
    errors.name = t("adminCreateCenter.errors.nameLength");
  }

  if (!form.address.trim()) {
    errors.address = t("adminCreateCenter.errors.addressRequired");
  } else if (form.address.trim().length < 5 || form.address.trim().length > 255) {
    errors.address = t("adminCreateCenter.errors.addressLength");
  }

  if (form.phone && !/^[+\d\s\-().]{0,20}$/.test(form.phone)) {
    errors.phone = t("adminCreateCenter.errors.phoneInvalid");
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = t("adminCreateCenter.errors.emailInvalid");
  }

  if (form.description && form.description.length > 1000) {
    errors.description = t("adminCreateCenter.errors.descriptionLength");
  }

  if (isNaN(form.capacity) || form.capacity < 1 || form.capacity > 10000) {
    errors.capacity = t("adminCreateCenter.errors.capacityRange");
  }

  if (isNaN(form.averageServiceTimeMinutes) || form.averageServiceTimeMinutes < 1 || form.averageServiceTimeMinutes > 480) {
    errors.averageServiceTimeMinutes = t("adminCreateCenter.errors.avgTimeRange");
  }

  const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!form.openingTime || !timeRe.test(form.openingTime)) {
    errors.openingTime = t("adminCreateCenter.errors.openingTimeInvalid");
  }
  if (!form.closingTime || !timeRe.test(form.closingTime)) {
    errors.closingTime = t("adminCreateCenter.errors.closingTimeInvalid");
  }
  if (
    !errors.openingTime &&
    !errors.closingTime &&
    form.closingTime <= form.openingTime
  ) {
    errors.closingTime = t("adminCreateCenter.errors.closingBeforeOpening");
  }

  return errors;
}

// ──────────────────────────────────────────────
//  Initial form state
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
//  Reusable field-level error hint
// ──────────────────────────────────────────────
function FieldError({ msg, id }: { msg?: string; id?: string }) {
  if (!msg) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-red-600">
      {msg}
    </p>
  );
}

// ──────────────────────────────────────────────
//  Page component
// ──────────────────────────────────────────────
export default function AdminCreateServiceCenterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Role guard — only admins may access this page
  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (user.role !== "admin") {
      navigate("/service-centers");
    }
  }, [user, navigate]);

  const [form, setForm] = useState<CreateServiceCenterRequest>(INITIAL);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormErrors, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdName, setCreatedName] = useState<string | null>(null);
  const formTopRef = useRef<HTMLDivElement>(null);

  // ── Handlers ──────────────────────────────────────────
  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, type } = e.target;
    const value =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;

    const newForm = { ...form, [name]: value } as CreateServiceCenterRequest;
    setForm(newForm);
    // Re-validate immediately if the field (or form) was already touched
    if (touched[name as keyof FormErrors] || submitAttempted) {
      setFieldErrors(validate(newForm, t));
    }
    setSubmitError(null);
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name } = e.target;
    const numeric = e.target.valueAsNumber; // NaN when input is cleared
    const newForm = { ...form, [name]: numeric } as CreateServiceCenterRequest;
    setForm(newForm);
    if (touched[name as keyof FormErrors] || submitAttempted) {
      setFieldErrors(validate(newForm, t));
    }
    setSubmitError(null);
  }

  function handleBlur(field: keyof FormErrors) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors(validate(form, t));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errors = validate(form, t);
    // Mark every errored field as touched so all messages surface
    const allTouched = (Object.keys(errors) as (keyof FormErrors)[]).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {} as Partial<Record<keyof FormErrors, boolean>>
    );
    setTouched((prev) => ({ ...prev, ...allTouched }));
    setSubmitAttempted(true);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
        const code: string = data?.code ?? "";
        if (code === "DUPLICATE_SERVICE_CENTER") {
          setSubmitError(t("adminCreateCenter.errors.duplicate"));
        } else if (code === "VALIDATION_ERROR" && Array.isArray(data.validationErrors)) {
          // Map backend field-level errors back to the form
          const BACKEND_FIELD_MAP: Record<string, keyof FormErrors> = {
            Name: "name",
            Address: "address",
            Phone: "phone",
            Email: "email",
            Description: "description",
            Capacity: "capacity",
            AverageServiceTimeMinutes: "averageServiceTimeMinutes",
            OpeningTime: "openingTime",
            ClosingTime: "closingTime",
          };
          const backendErrors: FormErrors = {};
          for (const ve of data.validationErrors as { field: string; message: string }[]) {
            const frontendKey = BACKEND_FIELD_MAP[ve.field];
            if (frontendKey && !backendErrors[frontendKey]) {
              backendErrors[frontendKey] = ve.message;
            }
          }
          if (Object.keys(backendErrors).length > 0) {
            setFieldErrors(backendErrors);
            setSubmitAttempted(true);
            formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          } else {
            setSubmitError(data.message ?? t("adminCreateCenter.errors.serverError"));
          }
        } else {
          setSubmitError(data?.message ?? t("adminCreateCenter.errors.serverError"));
        }
      } else {
        setSubmitError(t("adminCreateCenter.errors.networkError"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ── Derived helpers ───────────────────────────────────
  /** Show a field error only if it was touched or a submit was attempted */
  const showError = (field: keyof FormErrors) =>
    !!(fieldErrors[field] && (touched[field] || submitAttempted));

  /** Section-level error indicators (only after a submit attempt) */
  const sec1HasError = submitAttempted &&
    !!(fieldErrors.name || fieldErrors.description || fieldErrors.phone || fieldErrors.email);
  const sec2HasError = submitAttempted && !!fieldErrors.address;
  const sec3HasError = submitAttempted &&
    !!(fieldErrors.openingTime || fieldErrors.closingTime);
  const sec4HasError = submitAttempted &&
    !!(fieldErrors.capacity || fieldErrors.averageServiceTimeMinutes);

  const totalErrorCount = Object.values(fieldErrors).filter(Boolean).length;

  // ── Success screen ─────────────────────────────────────
  if (createdName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t("adminCreateCenter.success.title")}
          </h2>
          <p className="text-gray-600 mb-6">
            {t("adminCreateCenter.success.message", { name: createdName })}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                setForm(INITIAL);
                setCreatedName(null);
                setFieldErrors({});
                setTouched({});
                setSubmitAttempted(false);
                setSubmitError(null);
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              {t("adminCreateCenter.success.createAnother")}
            </button>
            <Link
              to="/service-centers"
              className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors text-center"
            >
              {t("adminCreateCenter.success.viewAll")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* ── Navigation ── */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">{t("common.appName")}</span>
            </div>
            {user && (
              <div className="flex items-center gap-4">
                <LanguageSelector />
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{user.username}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  {t("common.signOut")}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Content ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Scroll anchor — scrolled to when validation fails on submit */}
        <div ref={formTopRef} />
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/service-centers" className="hover:text-blue-600 transition-colors">
            {t("serviceCenters.title")}
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">{t("adminCreateCenter.breadcrumb")}</span>
        </nav>

        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {t("adminCreateCenter.title")}
          </h1>
          <p className="text-gray-600">{t("adminCreateCenter.subtitle")}</p>
        </div>

        {/* Validation summary — shown after a failed submit attempt */}
        {submitAttempted && totalErrorCount > 0 && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
          >
            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 text-sm font-medium">
              {t("adminCreateCenter.errors.validationSummary", { count: totalErrorCount })}
            </p>
          </div>
        )}

        {/* Server / network error banner */}
        {submitError && (
          <div
            role="alert"
            className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
          >
            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 text-sm font-medium">{submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* ─── Section 1: Basic Information ─── */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold">1</div>
              {t("adminCreateCenter.sections.basicInfo")}
            </h2>
            <div className="grid grid-cols-1 gap-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("adminCreateCenter.fields.name")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder={t("adminCreateCenter.placeholders.name")}
                  className={`block w-full px-4 py-2.5 border rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.name ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                />
                <FieldError msg={fieldErrors.name} />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("adminCreateCenter.fields.description")}
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  maxLength={1000}
                  rows={3}
                  placeholder={t("adminCreateCenter.placeholders.description")}
                  className={`block w-full px-4 py-2.5 border rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${fieldErrors.description ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                />
                <div className="flex justify-between mt-0.5">
                  <FieldError msg={fieldErrors.description} />
                  <span className="text-xs text-gray-400 ml-auto">{(form.description ?? "").length}/1000</span>
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {t("adminCreateCenter.fields.phone")}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    maxLength={20}
                    placeholder="+94 11 234 5678"
                    className={`block w-full px-4 py-2.5 border rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.phone ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                  />
                  <FieldError msg={fieldErrors.phone} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {t("adminCreateCenter.fields.email")}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    maxLength={100}
                    placeholder="center@example.com"
                    className={`block w-full px-4 py-2.5 border rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.email ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                  />
                  <FieldError msg={fieldErrors.email} />
                </div>
              </div>
            </div>
          </section>

          {/* ─── Section 2: Location ─── */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-xs font-bold">2</div>
              {t("adminCreateCenter.sections.location")}
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              {t("adminCreateCenter.sections.locationHint")}
            </p>
            <div className="grid grid-cols-1 gap-5">
              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("adminCreateCenter.fields.address")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    maxLength={255}
                    placeholder={t("adminCreateCenter.placeholders.address")}
                    className={`block w-full pl-9 pr-4 py-2.5 border rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.address ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                  />
                </div>
                <FieldError msg={fieldErrors.address} />
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("adminCreateCenter.fields.timezone")} <span className="text-red-500">*</span>
                </label>
                <select
                  name="timezone"
                  value={form.timezone}
                  onChange={handleChange}
                  className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  {t("adminCreateCenter.fields.timezoneHint")}
                </p>
              </div>
            </div>
          </section>

          {/* ─── Section 3: Operating Hours ─── */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 text-xs font-bold">3</div>
              {t("adminCreateCenter.sections.hours")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("adminCreateCenter.fields.openingTime")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="openingTime"
                  value={form.openingTime}
                  onChange={handleChange}
                  className={`block w-full px-4 py-2.5 border rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.openingTime ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                />
                <FieldError msg={fieldErrors.openingTime} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("adminCreateCenter.fields.closingTime")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="closingTime"
                  value={form.closingTime}
                  onChange={handleChange}
                  className={`block w-full px-4 py-2.5 border rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.closingTime ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                />
                <FieldError msg={fieldErrors.closingTime} />
              </div>
            </div>
          </section>

          {/* ─── Section 4: Capacity ─── */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 text-xs font-bold">4</div>
              {t("adminCreateCenter.sections.capacity")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("adminCreateCenter.fields.capacity")}
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={form.capacity}
                  onChange={handleNumberChange}
                  min={1}
                  max={10000}
                  className={`block w-full px-4 py-2.5 border rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.capacity ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                />
                <p className="mt-1 text-xs text-gray-400">{t("adminCreateCenter.fields.capacityHint")}</p>
                <FieldError msg={fieldErrors.capacity} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("adminCreateCenter.fields.avgServiceTime")}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="averageServiceTimeMinutes"
                    value={form.averageServiceTimeMinutes}
                    onChange={handleNumberChange}
                    min={1}
                    max={480}
                    className={`block w-full px-4 py-2.5 pr-16 border rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.averageServiceTimeMinutes ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 text-sm pointer-events-none">
                    {t("serviceCenterCard.minutes")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">{t("adminCreateCenter.fields.avgServiceTimeHint")}</p>
                <FieldError msg={fieldErrors.averageServiceTimeMinutes} />
              </div>
            </div>
          </section>

          {/* ─── Section 5: Settings ─── */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold">5</div>
              {t("adminCreateCenter.sections.settings")}
            </h2>
            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div
                  className={`w-12 h-6 rounded-full transition-colors duration-200 ${form.isActive ? "bg-blue-600" : "bg-gray-300"}`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.isActive ? "translate-x-6" : "translate-x-0"}`}
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {t("adminCreateCenter.fields.isActive")}
                </p>
                <p className="text-xs text-gray-500">
                  {form.isActive
                    ? t("adminCreateCenter.fields.isActiveOn")
                    : t("adminCreateCenter.fields.isActiveOff")}
                </p>
              </div>
            </label>
          </section>

          {/* ─── Actions ─── */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pb-8">
            <Link
              to="/service-centers"
              className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-center"
            >
              {t("adminCreateCenter.actions.cancel")}
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {t("adminCreateCenter.actions.creating")}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t("adminCreateCenter.actions.create")}
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
