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