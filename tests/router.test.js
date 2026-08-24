import { describe, expect, it } from "vitest";
import router from "../src/app/router";
describe("admin route guard", () => {
  it("redirects protected deep links to sign in when unauthorized", async () => {
    await router.push("/commercial/pricing");
    await router.isReady();
    expect(router.currentRoute.value.name).toBe("sign-in");
    expect(router.currentRoute.value.query.redirect).toBe(
      "/commercial/pricing",
    );
  });
});
