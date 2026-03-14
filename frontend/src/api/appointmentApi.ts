import axiosInstance from "./axiosInstance";

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface BookAppointmentRequestDto {
    centerId: number;
    appointmentDate: string; // ISO string 'YYYY-MM-DDT00:00:00Z'
    appointmentTime: string; // Format 'HH:mm:ss'
}

export interface AppointmentResponseDto {
    appointmentId: number;
    centerId: number;
    userId: number;
    tokenId?: number | null;
    tokenNumber: string;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
    createdAt: string;
}

export const bookToken = async (data: BookAppointmentRequestDto): Promise<AppointmentResponseDto> => {
    const response = await axiosInstance.post<ApiResponse<AppointmentResponseDto>>('/api/Appointment/book', data);
    return response.data.data;
};

export const getMyAppointments = async (): Promise<AppointmentResponseDto[]> => {
    const response = await axiosInstance.get<ApiResponse<AppointmentResponseDto[]>>('/api/Appointment/my-bookings');
    return response.data.data;
};
