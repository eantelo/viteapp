import { describe, expect, it } from "vitest";
import {
  convertAccountingPrice,
  convertSalePriceToAccounting,
  isCurrencyQuoteStale,
} from "./saleCurrency";

describe("sale currency helpers", () => {
  it("converts an accounting price using the selected currency precision", () => {
    expect(convertAccountingPrice(100, 1 / 6.96, 2)).toBe(14.37);
    expect(convertAccountingPrice(100, 1, 2)).toBe(100);
  });

  it("preserves a manually edited accounting value across currency changes", () => {
    const editedAccountingPrice = convertSalePriceToAccounting(20, 1 / 6.96);

    expect(convertAccountingPrice(editedAccountingPrice, 1, 2)).toBe(139.2);
    expect(convertAccountingPrice(editedAccountingPrice, 1 / 6.96, 2)).toBe(20);
  });

  it("rejects invalid rates instead of producing a stale or non-finite price", () => {
    expect(convertAccountingPrice(100, 0, 2)).toBe(0);
    expect(convertSalePriceToAccounting(100, Number.NaN)).toBe(0);
  });

  it("recognizes only the stale currency quote problem", () => {
    expect(isCurrencyQuoteStale({ status: 409, details: { code: "currency_quote_stale" } })).toBe(true);
    expect(isCurrencyQuoteStale({ status: 422, details: { code: "currency_rate_unavailable" } })).toBe(false);
  });
});
