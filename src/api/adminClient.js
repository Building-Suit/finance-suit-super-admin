import { invokeAdmin } from "../supabase";

const inflight = new Map();

export const errorMessages = {
  missing_access_token: "Your session has expired. Please sign in again.",
  invalid_access_token: "Your session has expired. Please sign in again.",
  super_admin_required: "Super Admin access is required.",
  reason_required: "Enter an administrative reason of at least 6 characters.",
  invalid_request: "Review the submitted values and try again.",
  invalid_config: "The configuration is invalid.",
  conflict: "The operation conflicts with the current server state.",
  provider_not_synced:
    "Google Play verification is required before publishing.",
  network_error:
    "The service could not be reached. Check your connection and retry.",
  admin_operation_failed:
    "The operation failed safely. No change was confirmed.",
};

export function normalizeAdminError(error) {
  const code = error?.code || error?.message || "admin_operation_failed";
  return {
    code,
    status: error?.status,
    message: errorMessages[code] || errorMessages.admin_operation_failed,
  };
}

export async function adminRequest(action, payload = {}, options = {}) {
  const functionName = options.functionName || "commercial-admin";
  const key =
    options.dedupe === false
      ? null
      : `${functionName}:${action}:${JSON.stringify(payload)}`;
  if (key && inflight.has(key)) return inflight.get(key);
  const request = invokeAdmin(action, payload, functionName).finally(
    () => key && inflight.delete(key),
  );
  if (key) inflight.set(key, request);
  return request;
}
