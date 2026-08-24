import { adminRequest } from "./adminClient";

const call = (action, payload = {}, options = {}) =>
  adminRequest(action, payload, { functionName: "catalog-admin", ...options });
export const catalogAdmin = {
  overview: () => call("overview", {}, { dedupe: false }),
  products: (filters) => call("products", filters),
  productDetail: (productId) => call("product_detail", { productId }),
  queue: (filters) => call("queue", filters),
  runs: (filters) => call("runs", filters),
  enqueue: (payload) => call("enqueue", payload, { dedupe: false }),
  enqueueDue: (reason) => call("enqueue_due", { reason }, { dedupe: false }),
  requeue: (queueItemId, reason) =>
    call("requeue", { queueItemId, reason }, { dedupe: false }),
  updateConfig: (value, reason) =>
    call("update_config", { value, reason }, { dedupe: false }),
};
