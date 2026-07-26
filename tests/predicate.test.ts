import { describe, expect, it } from "vitest";
import { testPredicate } from "../src/rules/predicate";

const options = new Set(["self:type:character", "self:category:wizard", "self:level:5"]);

describe("testPredicate", () => {
  it("passes when there is no predicate", () => {
    expect(testPredicate(undefined, options)).toBe(true);
  });

  it("array form requires every option (AND)", () => {
    expect(testPredicate(["self:type:character"], options)).toBe(true);
    expect(testPredicate(["self:type:character", "self:category:wizard"], options)).toBe(true);
    expect(testPredicate(["self:type:npc"], options)).toBe(false);
  });

  it("object form: all / any / not", () => {
    expect(testPredicate({ all: ["self:type:character"] }, options)).toBe(true);
    expect(testPredicate({ any: ["self:type:npc", "self:category:wizard"] }, options)).toBe(true);
    expect(testPredicate({ any: ["self:type:npc"] }, options)).toBe(false);
    expect(testPredicate({ not: ["self:category:wizard"] }, options)).toBe(false);
    expect(
      testPredicate({ all: ["self:type:character"], not: ["self:category:warrior"] }, options),
    ).toBe(true);
  });
});
