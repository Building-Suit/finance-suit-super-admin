import { adminRequest } from "./adminClient";

const call = (action, payload = {}, options = {}) =>
  adminRequest(action, payload, {
    functionName: "operations-admin",
    ...options,
  });
export const operationsAdmin = {
  health: () => call("health", {}, { dedupe: false }),
  sendTestNotification: (reason) =>
    call("send_test_notification", { reason }, { dedupe: false }),
};
