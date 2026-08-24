import { describe, expect, it, vi } from "vitest";
describe("appearance and locale", () => {
  it("persists appearance and resolves system mode", async () => {
    window.matchMedia = vi
      .fn()
      .mockReturnValue({ matches: true, addEventListener: vi.fn() });
    const { initializeAppearance, useAppearance } = await import(
      "../src/app/composables/useAppearance"
    );
    initializeAppearance();
    useAppearance().setAppearance("light");
    expect(localStorage.getItem("fs-admin-appearance")).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });
  it("sets Arabic language and RTL direction", async () => {
    const { initializeLocale, useLocale } = await import(
      "../src/app/composables/useLocale"
    );
    initializeLocale();
    useLocale().setLocale("ar");
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
  });
});
