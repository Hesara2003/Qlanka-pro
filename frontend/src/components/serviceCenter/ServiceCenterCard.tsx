import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { ServiceCenter } from "../../types/serviceCenter";

interface ServiceCenterCardProps {
  center: ServiceCenter;
}

export default function ServiceCenterCard({ center }: ServiceCenterCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      <div className="p-6">
        {/* Header with name and status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {center.name}
            </h3>
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              {center.address}
            </p>
          </div>
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${center.isAvailable && center.isActive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
              }`}
          >
            {center.isAvailable && center.isActive ? t('serviceCenterCard.available') : t('serviceCenterCard.unavailable')}
          </div>
        </div>

        {/* Description */}
        {center.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {center.description}
          </p>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Operating Hours */}
          <div className="flex items-center gap-2 text-sm">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-600"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <div>
              <p className="text-gray-500 text-xs">{t('serviceCenterCard.hours')}</p>
              <p className="font-semibold text-gray-900">
                {center.openingTime} - {center.closingTime}
              </p>
            </div>
          </div>

          {/* Capacity */}
          <div className="flex items-center gap-2 text-sm">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-purple-600"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <div>
              <p className="text-gray-500 text-xs">{t('serviceCenterCard.capacity')}</p>
              <p className="font-semibold text-gray-900">{center.capacity}</p>
            </div>
          </div>

          {/* Average Service Time */}
          <div className="flex items-center gap-2 text-sm">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-500"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 14 14"></polyline>
            </svg>
            <div>
              <p className="text-gray-500 text-xs">{t('serviceCenterCard.avgServiceTime')}</p>
              <p className="font-semibold text-gray-900">
                {center.averageServiceTimeMinutes} {t('serviceCenterCard.minutes')}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        {(center.phone || center.email) && (
          <div className="pt-4 border-t border-gray-100 space-y-2">
            {center.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>{center.phone}</span>
              </div>
            )}
            {center.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect>
                  <polyline points="3 7 12 13 21 7"></polyline>
                </svg>
                <span>{center.email}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => navigate(`/book/${center.centerId}`)}
          disabled={!center.isAvailable || !center.isActive}
          className={`w-full mt-4 px-4 py-2.5 font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 ${center.isAvailable && center.isActive
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
            }`}
        >
          <span>{t('serviceCenterCard.bookAppointment')}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </div>
  );
}
