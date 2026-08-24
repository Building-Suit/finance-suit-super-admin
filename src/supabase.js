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

export async function normalizeFunctionError(error) {
  const response = error?.context;
  let payload = null;
  if (response && typeof response.clone === "function") {
    try {
      payload = await response.clone().json();
    } catch {
      payload = null;
    }
  }
  const code =
    payload?.code || error?.code || error?.message || "network_error";
  const normalized = new Error(code);
  normalized.code = code;
  normalized.status = response?.status ?? error?.status;
  normalized.requestId = payload?.requestId || null;
  return normalized;
}

export async function invokeAdmin(
  action,
  payload = {},
  functionName = "commercial-admin",
) {
  if (!supabase) throw new Error("Supabase config missing");
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: { action, ...payload },
  });
  if (error) {
    throw await normalizeFunctionError(error);
  }
  if (data?.code) throw new Error(data.code);
  return data;
}
