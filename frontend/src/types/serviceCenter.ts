export interface ServiceCenter {
  centerId: number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  description?: string;
  timezone: string;
  capacity: number;
  openingTime: string;
  closingTime: string;
  isAvailable: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface ServiceCenterListResponse {
  serviceCenters: ServiceCenter[];
}
