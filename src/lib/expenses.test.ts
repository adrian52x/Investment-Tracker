import { describe, expect, it } from "vitest";
import {
  amountToKeypad,
  currentMonth,
  isMonth,
  parseAmount,
  pressKey,
  shiftMonth,
  summarize,
  type Expense,
} from "./expenses";

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: "1",
    amount: 10,
    paymentMethod: "card",
    categoryId: "food",
    categoryName: "Food",
    spentOn: "2026-11-02",
    ...overrides,
  };
}

describe("parseAmount", () => {
  it("accepts whole numbers and both decimal separators", () => {
    expect(parseAmount("125")).toBe(125);
    expect(parseAmount("125,50")).toBe(125.5);
    expect(parseAmount("125.5")).toBe(125.5);
  });

  it("rejects zero, garbage and thousand separators", () => {
    for (const input of ["", "0", "0,00", "-5", "abc", "1.250", "1,2,3"]) {
      expect(parseAmount(input)).toBeNull();
    }
  });
});

describe("pressKey", () => {
  const type = (keys: string[]) => keys.reduce(pressKey, "");

  it("builds an amount", () => {
    expect(type(["1", "2", ",", "5"])).toBe("12,5");
  });

  it("allows one comma and two decimals", () => {
    expect(type(["1", ",", ",", "2", "5", "9"])).toBe("1,25");
  });

  it("starts a leading comma at zero and replaces a lone zero", () => {
    expect(type([",", "5"])).toBe("0,5");
    expect(type(["0", "7"])).toBe("7");
  });

  it("deletes the last character", () => {
    expect(pressKey("12,5", "backspace")).toBe("12,");
    expect(pressKey("", "backspace")).toBe("");
  });
});

describe("amountToKeypad", () => {
  it("round-trips through parseAmount", () => {
    expect(amountToKeypad(125)).toBe("125");
    expect(amountToKeypad(125.5)).toBe("125,50");
    expect(parseAmount(amountToKeypad(125.5))).toBe(125.5);
  });
});

describe("months", () => {
  it("uses Copenhagen time at the month boundary", () => {
    // 23:30 UTC on Oct 31 is already November in Copenhagen (UTC+1).
    expect(currentMonth(new Date("2026-10-31T23:30:00Z"))).toBe("2026-11");
  });

  it("shifts across year boundaries", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });

  it("validates month params", () => {
    expect(isMonth("2026-11")).toBe(true);
    expect(isMonth("2026-13")).toBe(false);
    expect(isMonth(["2026-11"])).toBe(false);
  });
});

describe("summarize", () => {
  it("splits totals by method and ranks categories", () => {
    const summary = summarize([
      expense({ id: "1", amount: 100 }),
      expense({ id: "2", amount: 50, paymentMethod: "cash" }),
      expense({
        id: "3",
        amount: 200,
        categoryId: "rent",
        categoryName: "Rent",
      }),
    ]);

    expect(summary).toMatchObject({ total: 350, card: 300, cash: 50 });
    expect(summary.categories.map((c) => [c.name, c.total])).toEqual([
      ["Rent", 200],
      ["Food", 150],
    ]);
  });

  it("does not accumulate floating point error", () => {
    const rows = [0.1, 0.2, 0.7].map((amount, i) =>
      expense({ id: String(i), amount }),
    );
    expect(summarize(rows).total).toBe(1);
  });

  it("handles an empty month", () => {
    expect(summarize([])).toEqual({ total: 0, card: 0, cash: 0, categories: [] });
  });
});
