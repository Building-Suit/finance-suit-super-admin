import { describe, expect, it } from "vitest";
import { normalizeFunctionError } from "../src/supabase";
import { normalizeAdminError } from "../src/api/adminClient";

describe("Edge Function errors", () => {
  it("reads the structured code and request id from a failed response", async () => {
    const error = await normalizeFunctionError({
      message: "Edge Function returned a non-2xx status code",
      context: new Response(
        JSON.stringify({ code: "reason_required", requestId: "request-123" }),
        { status: 400, headers: { "content-type": "application/json" } },
      ),
    });

    expect(error.code).toBe("reason_required");
    expect(error.status).toBe(400);
    expect(error.requestId).toBe("request-123");
    expect(normalizeAdminError(error).message).toContain(
      "administrative reason",
    );
  });

  it("falls back safely when the response body is not JSON", async () => {
    const error = await normalizeFunctionError({
      message: "network_error",
      context: new Response("unavailable", { status: 503 }),
    });

    expect(error.code).toBe("network_error");
    expect(error.status).toBe(503);
  });
});
