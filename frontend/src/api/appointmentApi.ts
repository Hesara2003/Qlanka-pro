import axiosInstance from "./axiosInstance";
import { supabase } from "../lib/supabaseClient";
import { requireSessionUser } from "../lib/authSession";
import { shouldUseSupabaseFallback } from "./fallbackUtils";

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

function normalizeDate(value: string): string {
    return value.slice(0, 10);
}

function toTokenNumber(sequence: number): string {
    return `T${String(sequence).padStart(2, "0")}`;
}

export const bookToken = async (data: BookAppointmentRequestDto): Promise<AppointmentResponseDto> => {
    try {
        const response = await axiosInstance.post<ApiResponse<AppointmentResponseDto>>('/api/appointment/book', data);
        return response.data.data;
    } catch (error) {
        if (!shouldUseSupabaseFallback(error)) {
            throw error;
        }

        const session = requireSessionUser();
        const appointmentDate = normalizeDate(data.appointmentDate);

        const { count, error: countError } = await supabase
            .from("tokens")
            .select("token_id", { count: "exact", head: true })
            .eq("center_id", data.centerId)
            .eq("issued_date", appointmentDate);

        if (countError) {
            throw new Error(countError.message);
        }

        const sequence = (count ?? 0) + 1;
        const tokenNumber = toTokenNumber(sequence);
        const nowIso = new Date().toISOString();

        const { data: appointment, error: appointmentError } = await supabase
            .from("appointments")
            .insert({
                center_id: data.centerId,
                user_id: session.userId,
                appointment_date: appointmentDate,
                appointment_time: data.appointmentTime,
                status: "Booked",
                token_number: tokenNumber,
            })
            .select("appointment_id, center_id, user_id, appointment_date, appointment_time, status, created_at")
            .single();

        if (appointmentError) {
            throw new Error(appointmentError.message);
        }

        const { data: token, error: tokenError } = await supabase
            .from("tokens")
            .insert({
                center_id: data.centerId,
                user_id: session.userId,
                appointment_id: appointment.appointment_id,
                token_number: tokenNumber,
                issued_date: appointmentDate,
                issued_time: nowIso,
                status: "Waiting",
                queue_position: sequence,
            })
            .select("token_id")
            .single();

        if (tokenError) {
            throw new Error(tokenError.message);
        }

        await supabase
            .from("appointments")
            .update({ token_id: token.token_id })
            .eq("appointment_id", appointment.appointment_id);

        return {
            appointmentId: appointment.appointment_id,
            centerId: appointment.center_id,
            userId: appointment.user_id,
            tokenId: token.token_id,
            tokenNumber,
            appointmentDate: appointment.appointment_date,
            appointmentTime: appointment.appointment_time,
            status: appointment.status,
            createdAt: appointment.created_at,
        };
    }
};

export const getMyAppointments = async (): Promise<AppointmentResponseDto[]> => {
    try {
        const response = await axiosInstance.get<ApiResponse<AppointmentResponseDto[]>>('/api/appointment/my-bookings');
        return response.data.data;
    } catch (error) {
        if (!shouldUseSupabaseFallback(error)) {
            throw error;
        }

        const session = requireSessionUser();
        const { data, error: dbError } = await supabase
            .from("appointments")
            .select("appointment_id, center_id, user_id, token_id, token_number, appointment_date, appointment_time, status, created_at")
            .eq("user_id", session.userId)
            .order("appointment_id", { ascending: false });

        if (dbError) {
            throw new Error(dbError.message);
        }

        return (data ?? []).map((item: any) => ({
            appointmentId: item.appointment_id,
            centerId: item.center_id,
            userId: item.user_id,
            tokenId: item.token_id,
            tokenNumber: item.token_number,
            appointmentDate: item.appointment_date,
            appointmentTime: item.appointment_time,
            status: item.status,
            createdAt: item.created_at,
        }));
    }
};
