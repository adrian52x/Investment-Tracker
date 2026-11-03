import { describe, expect, it } from "vitest";
import { isCurrency, userCurrency, type Currency } from "./currency";
import { currencySymbol, formatMoney, moneyParts } from "./format";

describe("isCurrency", () => {
  it("accepts the four currencies and nothing else", () => {
    expect(isCurrency("EUR")).toBe(true);
    expect(isCurrency("MDL")).toBe(true);
    expect(isCurrency("eur")).toBe(false);
    expect(isCurrency("GBP")).toBe(false);
    expect(isCurrency(undefined)).toBe(false);
  });
});

describe("userCurrency", () => {
  it("reads the currency from app_metadata", () => {
    expect(userCurrency({ currency: "USD" })).toBe("USD");
  });

  it("falls back to DKK for accounts without one", () => {
    expect(userCurrency(undefined)).toBe("DKK");
    expect(userCurrency({})).toBe("DKK");
    expect(userCurrency({ currency: "GBP" })).toBe("DKK");
  });
});

describe("formatMoney", () => {
  // Intl separates the symbol with a no-break space.
  const money = (value: number, currency: Currency) =>
    formatMoney(value, currency).replace(/\u00a0/g, " ");

  it("shows whole amounts in the given currency", () => {
    expect(money(4250.5, "DKK")).toBe("4.251 kr.");
    expect(money(4250, "EUR")).toBe("4.250 €");
    expect(money(4250, "USD")).toBe("4.250 $");
    expect(money(4250, "MDL")).toBe("4.250 MDL");
  });
});

describe("currencySymbol", () => {
  it("is the symbol formatMoney puts after the amount", () => {
    expect(currencySymbol("DKK")).toBe("kr.");
    expect(currencySymbol("USD")).toBe("$");
  });
});

describe("moneyParts", () => {
  it("splits the number from the symbol", () => {
    expect(moneyParts(2000, "MDL")).toEqual({ amount: "2.000", symbol: "MDL" });
    expect(moneyParts(45.6, "EUR")).toEqual({ amount: "46", symbol: "€" });
  });
});
