export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: "citizen" | "officer" | "admin";
  centerId?: number;
}

export interface RegisterResponse {
  userId: number;
  username: string;
  role: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  role: string;
  /** Populated for officer-role users — their assigned counter ID. */
  counterId?: number;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface AuthUser {
  username: string;
  role: string;
  token: string;
  /** Populated for officer-role users — their assigned counter ID. */
  counterId?: number;
  centerId?: number;
}
