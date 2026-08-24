import { adminRequest } from "./adminClient";

export const commercialAdmin = {
  accessCheck: () => adminRequest("access_check"),
  overview: () => adminRequest("overview", {}, { dedupe: false }),
  users: (filters) => adminRequest("users", filters),
  userDetail: (userId) =>
    adminRequest("user_detail", { userId }, { dedupe: false }),
  grantPro: (payload) => adminRequest("grant_pro", payload, { dedupe: false }),
  endGrant: (payload) => adminRequest("end_grant", payload, { dedupe: false }),
  setBillingTestAccess: (payload) =>
    adminRequest("set_billing_test_access", payload, { dedupe: false }),
  commercialCatalog: () =>
    adminRequest("commercial_catalog", {}, { dedupe: false }),
  updateEntitlement: (payload) =>
    adminRequest("update_entitlement", payload, { dedupe: false }),
  savePrice: (payload) =>
    adminRequest("save_price", payload, { dedupe: false }),
  publishPrice: (payload) =>
    adminRequest("publish_price", payload, { dedupe: false }),
  archivePrice: (payload) =>
    adminRequest("archive_price", payload, { dedupe: false }),
  updateCampaign: (payload) =>
    adminRequest("update_campaign", payload, { dedupe: false }),
  updateMonetizationDuration: (payload) =>
    adminRequest("update_monetization_duration", payload, { dedupe: false }),
  startMonetization: (reason) =>
    adminRequest("start_monetization_cycle", { reason }, { dedupe: false }),
  transitionPaidLive: (reason) =>
    adminRequest("transition_paid_live", { reason }, { dedupe: false }),
  billingEvents: (filters) => adminRequest("billing_events", filters),
  operations: () => adminRequest("operations", {}, { dedupe: false }),
  updateConfig: (payload) =>
    adminRequest("update_config", payload, { dedupe: false }),
  saveAnnouncement: (payload) =>
    adminRequest("save_announcement", payload, { dedupe: false }),
  platformAdmins: () => adminRequest("platform_admins", {}, { dedupe: false }),
  updatePlatformAdmin: (payload) =>
    adminRequest("update_platform_admin", payload, { dedupe: false }),
  auditLog: (filters) => adminRequest("audit_log", filters),
};
