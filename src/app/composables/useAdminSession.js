import { computed, readonly, ref } from "vue";
import { commercialAdmin } from "../../api/commercialAdmin";
import { normalizeAdminError } from "../../api/adminClient";
import { hasConfig, supabase } from "../../supabase";

const session = ref(null);
const status = ref("initializing");
const accessError = ref(null);
let initialized;

async function verifyAccess() {
  if (!session.value) {
    status.value = "signed_out";
    return false;
  }
  status.value = "verifying";
  try {
    await commercialAdmin.accessCheck();
    status.value = "authorized";
    accessError.value = null;
    return true;
  } catch (error) {
    accessError.value = normalizeAdminError(error);
    status.value = accessError.value.status === 401 ? "expired" : "forbidden";
    return false;
  }
}

export async function initializeAdminSession() {
  if (initialized) return initialized;
  initialized = (async () => {
    if (!hasConfig) {
      status.value = "missing_config";
      return;
    }
    const { data } = await supabase.auth.getSession();
    session.value = data.session;
    await verifyAccess();
    supabase.auth.onAuthStateChange(async (_event, next) => {
      session.value = next;
      await verifyAccess();
    });
  })();
  return initialized;
}

export function useAdminSession() {
  async function signIn(email, password) {
    status.value = "signing_in";
    accessError.value = null;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      status.value = "signed_out";
      throw error;
    }
    session.value = data.session;
    return verifyAccess();
  }
  async function signOut() {
    await supabase?.auth.signOut();
    session.value = null;
    status.value = "signed_out";
  }
  return {
    session: readonly(session),
    status: readonly(status),
    accessError: readonly(accessError),
    isAuthorized: computed(() => status.value === "authorized"),
    signIn,
    signOut,
    verifyAccess,
  };
}
