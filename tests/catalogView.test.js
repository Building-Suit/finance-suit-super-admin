import { fireEvent, render, waitFor } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CatalogView from "../src/views/catalog/CatalogView.vue";
import { catalogAdmin } from "../src/api/catalogAdmin";

vi.mock("../src/api/catalogAdmin", () => ({
  catalogAdmin: {
    overview: vi.fn(),
    configuration: vi.fn(),
    products: vi.fn(),
    productDetail: vi.fn(),
    queue: vi.fn(),
    runs: vi.fn(),
    enqueueDue: vi.fn(),
    requeue: vi.fn(),
    updateConfig: vi.fn(),
  },
}));

const routerLink = {
  props: ["to"],
  template: '<a :href="to"><slot /></a>',
};

describe("catalog routes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads products without coupling the route to overview", async () => {
    catalogAdmin.products.mockResolvedValue({ products: [], count: 0 });
    render(CatalogView, {
      props: { section: "products" },
      global: { stubs: { RouterLink: routerLink } },
    });

    await waitFor(() => expect(catalogAdmin.products).toHaveBeenCalledOnce());
    expect(catalogAdmin.overview).not.toHaveBeenCalled();
  });

  it("loads settings through the narrow configuration action", async () => {
    catalogAdmin.configuration.mockResolvedValue({
      configuration: {
        freshness_window: "45 days",
        curator_batch_size: 10,
        lease_duration: "00:20:00",
        max_attempts: 4,
        enqueue_rate_limit_per_hour: 30,
      },
    });
    const view = render(CatalogView, {
      props: { section: "settings" },
      global: { stubs: { RouterLink: routerLink } },
    });

    await waitFor(() =>
      expect(catalogAdmin.configuration).toHaveBeenCalledOnce(),
    );
    expect((await view.findByLabelText("Freshness window (days)")).value).toBe(
      "45",
    );
    expect(catalogAdmin.overview).not.toHaveBeenCalled();
  });

  it("paginates product results through bounded server requests", async () => {
    catalogAdmin.products.mockResolvedValue({ products: [], count: 26 });
    const view = render(CatalogView, {
      props: { section: "products" },
      global: { stubs: { RouterLink: routerLink } },
    });
    await waitFor(() => expect(catalogAdmin.products).toHaveBeenCalledOnce());

    await fireEvent.click(await view.findByRole("button", { name: "Next" }));
    await waitFor(() => expect(catalogAdmin.products).toHaveBeenCalledTimes(2));
    expect(catalogAdmin.products.mock.calls[1][0].page).toBe(1);
  });
});
