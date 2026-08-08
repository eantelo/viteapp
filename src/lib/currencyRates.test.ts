import { describe, expect, it } from "vitest";
import { findOverlappingRate, getRateStatus } from "./currencyRates";
import type { ExchangeRate } from "@/types/Currency";

const now = Date.parse("2026-08-07T12:00:00.000Z");

function createRate(overrides: Partial<ExchangeRate> = {}): ExchangeRate {
  return {
    id: "rate-1",
    currencyCode: "USD",
    accountingCurrencyCode: "BOB",
    rateToAccounting: 6.96,
    validFrom: "2026-08-07T11:00:00.000Z",
    validTo: "2026-08-07T13:00:00.000Z",
    createdAt: "2026-08-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("currency rate administration rules", () => {
  it.each([
    { label: "current", rate: createRate(), expected: "current" },
    { label: "upcoming", rate: createRate({ validFrom: "2026-08-07T12:00:00.001Z" }), expected: "upcoming" },
    { label: "expired", rate: createRate({ validTo: "2026-08-07T12:00:00.000Z" }), expected: "expired" },
    { label: "cancelled", rate: createRate({ cancelledAt: "2026-08-06T12:00:00.000Z" }), expected: "cancelled" },
  ] as const)("getRateStatus classifies $label rates at validity boundaries", ({ rate, expected }) => {
    expect(getRateStatus(rate, now)).toBe(expected);
  });

  it("findOverlappingRate detects an intersection only for the same currency", () => {
    const usd = createRate();
    const usdt = createRate({ id: "rate-2", currencyCode: "USDT" });

    const result = findOverlappingRate(
      [usdt, usd],
      "USD",
      Date.parse("2026-08-07T12:30:00.000Z"),
      Date.parse("2026-08-07T14:00:00.000Z"),
    );

    expect(result).toBe(usd);
  });

  it("findOverlappingRate allows adjacent windows and ignores cancelled rates", () => {
    const adjacent = createRate({ validTo: "2026-08-07T12:00:00.000Z" });
    const cancelled = createRate({
      id: "rate-2",
      validFrom: "2026-08-07T12:00:00.000Z",
      validTo: "2026-08-07T14:00:00.000Z",
      cancelledAt: "2026-08-06T12:00:00.000Z",
    });

    const result = findOverlappingRate(
      [adjacent, cancelled],
      "USD",
      Date.parse("2026-08-07T12:00:00.000Z"),
      Date.parse("2026-08-07T13:00:00.000Z"),
    );

    expect(result).toBeUndefined();
  });
});
