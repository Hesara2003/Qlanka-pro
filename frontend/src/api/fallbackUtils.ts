import { AxiosError } from "axios";

export function shouldUseSupabaseFallback(error: unknown): boolean {
  if (error instanceof AxiosError) {
    if (error.code === "ERR_FORCE_SUPABASE") return true;
  } else {
    return false;
  }

  if (!error.response) {
    return true;
  }

  const status = error.response.status;
  return status === 404 || status >= 500;
}
