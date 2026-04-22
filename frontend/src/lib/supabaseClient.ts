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
    get(_, prop) {
      console.warn(`Supabase is not configured. Accessing "${String(prop)}" will return mock data.`);
      
      if (prop === "from") {
        return (table: string) => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: { message: `Supabase unconfigured (table: ${table})` } }),
              order: () => ({
                limit: () => ({
                  maybeSingle: async () => ({ data: null, error: { message: `Supabase unconfigured (table: ${table})` } }),
                }),
              }),
            }),
            order: async () => ({ data: [], error: { message: `Supabase unconfigured (table: ${table})` } }),
          }),
          insert: () => ({
            select: () => ({
              single: async () => ({ data: null, error: { message: `Supabase unconfigured (table: ${table})` } }),
            }),
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                maybeSingle: async () => ({ data: null, error: { message: `Supabase unconfigured (table: ${table})` } }),
              }),
            }),
          }),
        });
      }
      
      return () => {
        throw new Error(`Supabase is not configured. Tried to call "${String(prop)}".`);
      };
    },
  }
);

export const supabase = (configuredClient ?? unconfiguredClient) as any;
