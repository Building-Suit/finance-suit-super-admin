import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export async function invokeAdmin(action, payload = {}) {
  if (!supabase) throw new Error("Supabase config missing");
  const { data, error } = await supabase.functions.invoke("commercial-admin", {
    body: { action, ...payload },
  });
  if (error) throw error;
  return data;
}
