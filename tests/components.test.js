import { fireEvent, render } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import ReasonConfirmationDialog from "../src/components/ui/ReasonConfirmationDialog.vue";
import AppStatusBadge from "../src/components/ui/AppStatusBadge.vue";
describe("shared admin components", () => {
  it("requires a six-character reason before destructive confirmation", async () => {
    const view = render(ReasonConfirmationDialog, {
      props: {
        open: true,
        title: "End grant",
        consequence: "Recalculates access",
        confirmLabel: "End grant",
        destructive: true,
      },
    });
    const confirm = view.getByRole("button", { name: "End grant" });
    expect(confirm.disabled).toBe(true);
    await fireEvent.update(view.getByRole("textbox"), "audited reason");
    expect(confirm.disabled).toBe(false);
  });
  it("maps status to a label plus semantic class", () => {
    const view = render(AppStatusBadge, {
      props: { status: "verification_failed" },
    });
    const badge = view.getByText("verification failed");
    expect(badge.classList.contains("error")).toBe(true);
    expect(badge.querySelector(".badge-dot")).not.toBeNull();
  });
});
