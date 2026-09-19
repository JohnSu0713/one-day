import { describe, expect, it } from "vitest";
import { netWorth, projection, type Account } from "./model";

describe("FIRE projection", () => {
  it("returns zero when the target is already reached", () => expect(projection(1_000_000, 0, .05, 900_000)).toBe(0));
  it("applies growth before the annual contribution", () => expect(projection(100, 10, .10, 120)).toBe(1));
  it("returns null for a target outside the planning horizon", () => expect(projection(0, 0, 0, 1_000_000)).toBeNull());
});

describe("net worth", () => {
  it("subtracts debts and adds assets", () => {
    const base = { source: "manual" as const, updatedAt: "2026-01-01" };
    const accounts: Account[] = [
      { ...base, id: "1", name: "Brokerage", kind: "investment", balance: 500_000 },
      { ...base, id: "2", name: "Mortgage", kind: "loan", balance: 320_000 },
      { ...base, id: "3", name: "Card", kind: "credit", balance: 3_000 },
    ];
    expect(netWorth(accounts)).toBe(177_000);
  });
});
