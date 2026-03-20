// frontend/src/types/counter.ts

import type { ApiResponse } from "./serviceCenter";

export interface Counter {
  counterId: number;
  name: string;
  centerId: number;
  centerName: string;
  isOpen: boolean;
  currentTokenNumber: number | null;
  assignedOfficerUserId: number | null;
  assignedOfficerName: string | null;
  createdAt: string;
  warningMessage?: string | null;
}

export interface CreateCounterRequest {
  name: string;
  centerId: number;
  assignedOfficerUserId?: number;
}

export interface UpdateCounterStatusRequest {
  isOpen: boolean;
  reason?: string;
}

export interface ListCountersResponse {
  counters: Counter[];
  totalCount: number;
  centerId: number;
  openCount: number;
  closedCount: number;
}

export type CreateCounterApiResponse = ApiResponse<Counter>;
export type GetCountersApiResponse = ApiResponse<ListCountersResponse>;
export type GetCounterByIdApiResponse = ApiResponse<Counter>;
export type UpdateCounterStatusApiResponse = ApiResponse<Counter>;
