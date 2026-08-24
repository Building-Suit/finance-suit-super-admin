import { render, waitFor } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OperationsView from "../src/views/operations/OperationsView.vue";
import { commercialAdmin } from "../src/api/commercialAdmin";
import { operationsAdmin } from "../src/api/operationsAdmin";

vi.mock("../src/api/commercialAdmin", () => ({
  commercialAdmin: {
    operations: vi.fn(),
  },
}));

vi.mock("../src/api/operationsAdmin", () => ({
  operationsAdmin: {
    health: vi.fn(),
    sendTestNotification: vi.fn(),
  },
}));

const routerLink = {
  props: ["to"],
  template: '<a :href="to"><slot /></a>',
};

describe("operations routes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads notification health without coupling it to commercial operations", async () => {
    operationsAdmin.health.mockResolvedValue({ outbox: {}, devices: {} });
    render(OperationsView, {
      props: { section: "notifications" },
      global: { stubs: { RouterLink: routerLink } },
    });

    await waitFor(() => expect(operationsAdmin.health).toHaveBeenCalledOnce());
    expect(commercialAdmin.operations).not.toHaveBeenCalled();
  });

  it("loads commercial operations for configuration", async () => {
    commercialAdmin.operations.mockResolvedValue({ config: [] });
    render(OperationsView, {
      props: { section: "config" },
      global: { stubs: { RouterLink: routerLink } },
    });

    await waitFor(() =>
      expect(commercialAdmin.operations).toHaveBeenCalledOnce(),
    );
    expect(operationsAdmin.health).not.toHaveBeenCalled();
  });
});
