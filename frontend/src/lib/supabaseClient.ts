import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
  ?? (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined);

const configuredClient =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

const unconfiguredClient = new Proxy(
  {},
  {
    get() {
      throw new Error(
        "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
      );
    },
  }
);

export const supabase = (configuredClient ?? unconfiguredClient) as any;
