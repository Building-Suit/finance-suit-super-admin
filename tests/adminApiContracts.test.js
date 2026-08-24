import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/api/adminClient", () => ({
  adminRequest: vi.fn().mockResolvedValue({}),
}));

import { adminRequest } from "../src/api/adminClient";
import { catalogAdmin } from "../src/api/catalogAdmin";
import { commercialAdmin } from "../src/api/commercialAdmin";
import { operationsAdmin } from "../src/api/operationsAdmin";

describe("admin API contracts", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    [() => catalogAdmin.overview(), "overview", {}, "catalog-admin"],
    [() => catalogAdmin.configuration(), "configuration", {}, "catalog-admin"],
    [() => catalogAdmin.products({ page: 2 }), "products", { page: 2 }, "catalog-admin"],
    [() => catalogAdmin.productDetail("p1"), "product_detail", { productId: "p1" }, "catalog-admin"],
    [() => catalogAdmin.queue({ page: 1 }), "queue", { page: 1 }, "catalog-admin"],
    [() => catalogAdmin.runs({ page: 3 }), "runs", { page: 3 }, "catalog-admin"],
    [() => catalogAdmin.enqueue({ productId: "p1" }), "enqueue", { productId: "p1" }, "catalog-admin"],
    [() => catalogAdmin.enqueueDue("routine test"), "enqueue_due", { reason: "routine test" }, "catalog-admin"],
    [() => catalogAdmin.requeue("q1", "retry test"), "requeue", { queueItemId: "q1", reason: "retry test" }, "catalog-admin"],
    [() => catalogAdmin.updateConfig({ enabled: true }, "config test"), "update_config", { value: { enabled: true }, reason: "config test" }, "catalog-admin"],
    [() => operationsAdmin.health(), "health", {}, "operations-admin"],
    [() => operationsAdmin.sendTestNotification("delivery test"), "send_test_notification", { reason: "delivery test" }, "operations-admin"],
  ])("routes the request to its narrow Edge Function", async (invoke, action, payload, functionName) => {
    await invoke();
    expect(adminRequest).toHaveBeenCalledWith(
      action,
      payload,
      expect.objectContaining({ functionName }),
    );
  });

  it("keeps the complete commercial action list stable", () => {
    expect(Object.keys(commercialAdmin)).toEqual([
      "accessCheck", "overview", "users", "userDetail", "grantPro",
      "endGrant", "setBillingTestAccess", "commercialCatalog",
      "updateEntitlement", "savePrice", "publishPrice", "archivePrice",
      "updateCampaign", "updateMonetizationDuration", "startMonetization",
      "transitionPaidLive", "billingEvents", "operations", "updateConfig",
      "saveAnnouncement", "platformAdmins", "updatePlatformAdmin", "auditLog",
    ]);
  });
});
