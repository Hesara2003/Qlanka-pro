// Service Center Types - SCRUM-25

export interface ServiceCenter {
  centerId: number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  description?: string;
  timezone: string;
  capacity: number;
  averageServiceTimeMinutes: number;
  openingTime: string;
  closingTime: string;
  isAvailable: boolean;
  isActive: boolean;
  createdAt: string;
}

/** Wrapper shape returned by all backend ApiResponse<T> endpoints */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  metadata?: {
    totalCount?: number;
    correlationId?: string;
    timestamp?: string;
  };
}

/** Request payload for POST /api/service-centers (admin only) — SCRUM-67 */
export interface CreateServiceCenterRequest {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  description?: string;
  timezone: string;
  capacity: number;
  averageServiceTimeMinutes: number;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
}

export interface ServiceCenterFilters {
  isAvailable?: boolean;
  isActive?: boolean;
  searchQuery?: string;
}

export interface ServiceCenterApiError {
  code: string;
  message: string;
}

export interface ServiceCenterListResponse {
  serviceCenters: ServiceCenter[];
}

export interface CenterLocation {
  centerId: number;
  streetAddress: string;
  city: string;
  district: string;
  province: string;
  postalCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  landmark?: string;
}

export interface UpsertLocationRequest {
  streetAddress: string;
  city: string;
  district: string;
  province: string;
  postalCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  landmark?: string;
}