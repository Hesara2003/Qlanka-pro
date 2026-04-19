import { AxiosError } from "axios";

export function shouldUseSupabaseFallback(error: unknown): boolean {
  if (!(error instanceof AxiosError)) {
    return false;
  }

  if (!error.response) {
    return true;
  }

  const status = error.response.status;
  return status === 404 || status >= 500;
}
