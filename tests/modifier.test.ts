import { describe, expect, it } from "vitest";
import { stackBreakdown, stackTotal, type Modifier } from "../src/rules/modifier";

function mod(value: number, type: Modifier["type"] = "untyped", enabled = true): Modifier {
  return { target: "attack", value, type, enabled };
}

describe("stackTotal", () => {
  it("adds every untyped modifier", () => {
    expect(stackTotal([mod(5), mod(3), mod(-2)])).toBe(6);
  });

  it("keeps only the best bonus per named type", () => {
    expect(stackTotal([mod(5, "magic"), mod(3, "magic")])).toBe(5);
  });

  it("keeps only the worst penalty per named type", () => {
    expect(stackTotal([mod(-5, "status"), mod(-10, "status")])).toBe(-10);
  });

  it("resolves bonuses and penalties of the same type independently", () => {
    expect(stackTotal([mod(5, "magic"), mod(-3, "magic")])).toBe(2);
  });

  it("different named types stack with each other", () => {
    expect(stackTotal([mod(5, "magic"), mod(3, "item"), mod(2)])).toBe(10);
  });

  it("ignores disabled modifiers", () => {
    expect(stackTotal([mod(5, "magic", false), mod(3)])).toBe(3);
  });

  it("returns 0 for an empty list", () => {
    expect(stackTotal([])).toBe(0);
  });
});

describe("stackBreakdown", () => {
  it("reports exactly the entries that contributed", () => {
    const kept = mod(5, "magic");
    const dropped = mod(3, "magic");
    const untyped = mod(2);
    const { total, applied } = stackBreakdown([kept, dropped, untyped]);
    expect(total).toBe(7);
    expect(applied).toContain(kept);
    expect(applied).toContain(untyped);
    expect(applied).not.toContain(dropped);
  });
});
