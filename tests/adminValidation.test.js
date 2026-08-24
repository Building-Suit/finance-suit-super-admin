import { describe, expect, it } from "vitest";
import {
  isUuid,
  parseJsonObject,
  toMinorUnits,
} from "../src/utils/adminValidation";
describe("admin input validation", () => {
  it("recognizes exact profile UUID searches", () => {
    expect(isUuid("123e4567-e89b-42d3-a456-426614174000")).toBe(true);
    expect(isUuid("Tareq")).toBe(false);
  });
  it("converts money without floating-point storage", () => {
    expect(toMinorUnits("60")).toBe(6000);
    expect(toMinorUnits("600.25")).toBe(60025);
    expect(() => toMinorUnits("60.005")).toThrow("invalid_money");
  });
  it("accepts config objects but rejects arrays", () => {
    expect(parseJsonObject('{"enabled":true}')).toEqual({ enabled: true });
    expect(() => parseJsonObject("[]")).toThrow("invalid_json_object");
  });
});
