import { describe, expect, it } from "vitest";
import { summarize, validateTransaction } from "./calc";
import type { Transaction } from "./types";

let counter = 0;
function tx(partial: Partial<Transaction> & { type: Transaction["type"] }): Transaction {
  counter += 1;
  return {
    id: `tx-${counter}`,
    accountId: "saxo",
    date: `2026-01-${String(counter).padStart(2, "0")}`,
    createdAt: new Date(2026, 0, counter).toISOString(),
    ...partial,
  };
}

describe("summarize — acceptance test from the spec", () => {
  it("deposit, buy, sell, withdrawal produce the expected final state", () => {
    const log: Transaction[] = [
      tx({ type: "deposit", amount: 10_000 }),
      tx({ type: "buy", ticker: "NOVO-B", quantity: 1, pricePerShare: 3_000 }),
      tx({ type: "sell", ticker: "NOVO-B", quantity: 1, pricePerShare: 6_000 }),
      tx({ type: "withdrawal", amount: 5_000 }),
    ];

    // Step-by-step expectations
    expect(summarize(log.slice(0, 1)).cashBalance).toBe(10_000);

    const afterBuy = summarize(log.slice(0, 2));
    expect(afterBuy.cashBalance).toBe(7_000);
    expect(afterBuy.holdings).toEqual([
      { ticker: "NOVO-B", quantity: 1, totalCost: 3_000, avgCost: 3_000 },
    ]);

    const afterSell = summarize(log.slice(0, 3));
    expect(afterSell.cashBalance).toBe(13_000);
    expect(afterSell.realizedPnl).toBe(3_000);
    expect(afterSell.holdings).toEqual([]);

    const final = summarize(log);
    expect(final.cashBalance).toBe(8_000);
    expect(final.realizedPnl).toBe(3_000);
    expect(final.totalDeposited).toBe(10_000);
    expect(final.totalWithdrawn).toBe(5_000);
    expect(final.invested).toBe(0);
  });
});

describe("summarize — details", () => {
  it("handles partial sells with average-cost basis", () => {
    const log = [
      tx({ type: "deposit", amount: 10_000 }),
      tx({ type: "buy", ticker: "AAPL", quantity: 10, pricePerShare: 100 }),
      tx({ type: "buy", ticker: "AAPL", quantity: 10, pricePerShare: 200 }),
      // avg cost is now 150
      tx({ type: "sell", ticker: "AAPL", quantity: 5, pricePerShare: 300 }),
    ];
    const s = summarize(log);
    expect(s.realizedPnl).toBe(5 * (300 - 150));
    expect(s.holdings).toEqual([
      { ticker: "AAPL", quantity: 15, totalCost: 15 * 150, avgCost: 150 },
    ]);
    expect(s.cashBalance).toBe(10_000 - 1_000 - 2_000 + 1_500);
    expect(s.invested).toBe(15 * 150);
  });

  it("includes fees in cost basis and totals", () => {
    const log = [
      tx({ type: "deposit", amount: 10_000 }),
      tx({ type: "buy", ticker: "AAPL", quantity: 10, pricePerShare: 100, fee: 20 }),
      tx({ type: "sell", ticker: "AAPL", quantity: 10, pricePerShare: 150, fee: 30 }),
    ];
    const s = summarize(log);
    // cost basis 1020, proceeds 1470 → realized 450
    expect(s.realizedPnl).toBe(450);
    expect(s.totalFees).toBe(50);
    expect(s.cashBalance).toBe(10_000 - 1_020 + 1_470);
    expect(s.holdings).toEqual([]);
  });

  it("tracks dividends and tax", () => {
    const log = [
      tx({ type: "deposit", amount: 1_000 }),
      tx({ type: "dividend", amount: 50 }),
      tx({ type: "tax", amount: 30 }),
    ];
    const s = summarize(log);
    expect(s.cashBalance).toBe(1_020);
    expect(s.totalDividends).toBe(50);
    expect(s.totalTaxPaid).toBe(30);
  });

  it("processes transactions in date order regardless of input order", () => {
    const deposit = tx({ type: "deposit", amount: 5_000, date: "2026-01-01" });
    const buy = tx({
      type: "buy",
      ticker: "AAPL",
      quantity: 2,
      pricePerShare: 1_000,
      date: "2026-01-02",
    });
    const sell = tx({
      type: "sell",
      ticker: "AAPL",
      quantity: 2,
      pricePerShare: 1_500,
      date: "2026-01-03",
    });
    const shuffled = [sell, deposit, buy];
    const s = summarize(shuffled);
    expect(s.cashBalance).toBe(6_000);
    expect(s.realizedPnl).toBe(1_000);
  });
});

describe("validateTransaction", () => {
  it("rejects selling more shares than held", () => {
    const others = [
      tx({ type: "deposit", amount: 10_000, date: "2026-01-01" }),
      tx({ type: "buy", ticker: "AAPL", quantity: 5, pricePerShare: 100, date: "2026-01-02" }),
    ];
    const sell = tx({
      type: "sell",
      ticker: "AAPL",
      quantity: 10,
      pricePerShare: 100,
      date: "2026-01-03",
    });
    expect(validateTransaction(sell, others)).toMatch(/only hold 5 AAPL/);
  });

  it("rejects selling a ticker never bought", () => {
    const sell = tx({
      type: "sell",
      ticker: "TSLA",
      quantity: 1,
      pricePerShare: 100,
    });
    expect(validateTransaction(sell, [])).toMatch(/don't hold any TSLA/);
  });

  it("rejects withdrawing more than the balance", () => {
    const others = [tx({ type: "deposit", amount: 1_000, date: "2026-01-01" })];
    const withdrawal = tx({ type: "withdrawal", amount: 2_000, date: "2026-01-02" });
    expect(validateTransaction(withdrawal, others)).toMatch(/can't withdraw more/);
  });

  it("accepts a valid partial sell", () => {
    const others = [
      tx({ type: "deposit", amount: 10_000, date: "2026-01-01" }),
      tx({ type: "buy", ticker: "AAPL", quantity: 10, pricePerShare: 100, date: "2026-01-02" }),
    ];
    const sell = tx({
      type: "sell",
      ticker: "AAPL",
      quantity: 5,
      pricePerShare: 120,
      date: "2026-01-03",
    });
    expect(validateTransaction(sell, others)).toBeNull();
  });

  it("validates an edit against the ledger excluding the original", () => {
    const buy = tx({ type: "buy", ticker: "AAPL", quantity: 5, pricePerShare: 100, date: "2026-01-02" });
    const others = [tx({ type: "deposit", amount: 10_000, date: "2026-01-01" }), buy];
    const sell = tx({ type: "sell", ticker: "AAPL", quantity: 5, pricePerShare: 100, date: "2026-01-03" });
    // Editing the sell itself: pass others without it, plus the edited version
    const edited = { ...sell, quantity: 6 };
    expect(validateTransaction(edited, others)).toMatch(/only hold 5 AAPL/);
  });

  it("rejects non-positive amounts and quantities", () => {
    expect(validateTransaction(tx({ type: "deposit", amount: 0 }), [])).toMatch(/Amount/);
    expect(
      validateTransaction(tx({ type: "buy", ticker: "AAPL", quantity: 0, pricePerShare: 1 }), []),
    ).toMatch(/Quantity/);
    expect(
      validateTransaction(tx({ type: "buy", ticker: " ", quantity: 1, pricePerShare: 1 }), []),
    ).toMatch(/Ticker/);
  });
});
