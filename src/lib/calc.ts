import type { AccountSummary, Holding, Transaction } from "./types";

const EPSILON = 1e-9;

/**
 * Sort transactions chronologically: by date, then by createdAt as a
 * tie-breaker so same-day entries replay in the order they were recorded.
 */
export function sortChronologically(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

/**
 * Pure reducer: derive an account's full summary from its transaction log.
 * Average-cost basis; holdings with zero quantity are dropped.
 */
export function summarize(transactions: Transaction[]): AccountSummary {
  let cash = 0;
  let totalDeposited = 0;
  let totalWithdrawn = 0;
  let realizedPnl = 0;
  let totalDividends = 0;
  let totalFees = 0;
  let totalTaxPaid = 0;
  const positions = new Map<string, { quantity: number; totalCost: number }>();

  for (const tx of sortChronologically(transactions)) {
    switch (tx.type) {
      case "deposit": {
        const amount = tx.amount ?? 0;
        cash += amount;
        totalDeposited += amount;
        break;
      }
      case "withdrawal": {
        const amount = tx.amount ?? 0;
        cash -= amount;
        totalWithdrawn += amount;
        break;
      }
      case "dividend": {
        const amount = tx.amount ?? 0;
        cash += amount;
        totalDividends += amount;
        break;
      }
      case "tax": {
        const amount = tx.amount ?? 0;
        cash -= amount;
        totalTaxPaid += amount;
        break;
      }
      case "buy": {
        const quantity = tx.quantity ?? 0;
        const price = tx.pricePerShare ?? 0;
        const fee = tx.fee ?? 0;
        const cost = quantity * price + fee;
        cash -= cost;
        totalFees += fee;
        const ticker = tx.ticker ?? "";
        const pos = positions.get(ticker) ?? { quantity: 0, totalCost: 0 };
        pos.quantity += quantity;
        pos.totalCost += cost;
        positions.set(ticker, pos);
        break;
      }
      case "sell": {
        const quantity = tx.quantity ?? 0;
        const price = tx.pricePerShare ?? 0;
        const fee = tx.fee ?? 0;
        const proceeds = quantity * price - fee;
        cash += proceeds;
        totalFees += fee;
        const ticker = tx.ticker ?? "";
        const pos = positions.get(ticker) ?? { quantity: 0, totalCost: 0 };
        const avgCost = pos.quantity > EPSILON ? pos.totalCost / pos.quantity : 0;
        const costOfSold = avgCost * quantity;
        realizedPnl += proceeds - costOfSold;
        pos.quantity -= quantity;
        pos.totalCost -= costOfSold;
        if (pos.quantity <= EPSILON) {
          positions.delete(ticker);
        } else {
          positions.set(ticker, pos);
        }
        break;
      }
    }
  }

  const holdings: Holding[] = [...positions.entries()]
    .map(([ticker, pos]) => ({
      ticker,
      quantity: pos.quantity,
      totalCost: pos.totalCost,
      avgCost: pos.quantity > EPSILON ? pos.totalCost / pos.quantity : 0,
    }))
    .sort((a, b) => a.ticker.localeCompare(b.ticker));

  const invested = holdings.reduce((sum, h) => sum + h.totalCost, 0);

  return {
    cashBalance: cash,
    invested,
    totalDeposited,
    totalWithdrawn,
    realizedPnl,
    totalDividends,
    totalFees,
    totalTaxPaid,
    holdings,
  };
}

/**
 * Validate a new or edited transaction against the rest of the ledger.
 * Returns a friendly error message, or null if the transaction is valid.
 *
 * `others` must exclude the transaction being edited (by id).
 */
export function validateTransaction(
  tx: Transaction,
  others: Transaction[],
): string | null {
  if (tx.type === "buy" || tx.type === "sell") {
    if (!tx.ticker?.trim()) return "Ticker is required.";
    if (!tx.quantity || tx.quantity <= 0) return "Quantity must be greater than 0.";
    if (tx.pricePerShare == null || tx.pricePerShare < 0)
      return "Price per share can't be negative.";
    if ((tx.fee ?? 0) < 0) return "Fee can't be negative.";
  } else {
    if (!tx.amount || tx.amount <= 0) return "Amount must be greater than 0.";
  }
  if (!tx.date) return "Date is required.";

  const ledger = sortChronologically([...others, tx]);

  // Replay the ledger; make sure no sell exceeds held shares and no
  // withdrawal exceeds the cash balance at that point in time.
  let cash = 0;
  const positions = new Map<string, { quantity: number; totalCost: number }>();

  for (const t of ledger) {
    switch (t.type) {
      case "deposit":
      case "dividend":
        cash += t.amount ?? 0;
        break;
      case "tax":
        cash -= t.amount ?? 0;
        break;
      case "withdrawal": {
        cash -= t.amount ?? 0;
        if (t.id === tx.id && cash < -EPSILON) {
          return "You can't withdraw more than the cash balance at that date.";
        }
        break;
      }
      case "buy": {
        const cost = (t.quantity ?? 0) * (t.pricePerShare ?? 0) + (t.fee ?? 0);
        cash -= cost;
        const pos = positions.get(t.ticker ?? "") ?? { quantity: 0, totalCost: 0 };
        pos.quantity += t.quantity ?? 0;
        pos.totalCost += cost;
        positions.set(t.ticker ?? "", pos);
        break;
      }
      case "sell": {
        const pos = positions.get(t.ticker ?? "") ?? { quantity: 0, totalCost: 0 };
        const qty = t.quantity ?? 0;
        if (t.id === tx.id && qty > pos.quantity + EPSILON) {
          return pos.quantity > EPSILON
            ? `You only hold ${trimNumber(pos.quantity)} ${t.ticker} at that date.`
            : `You don't hold any ${t.ticker} at that date.`;
        }
        const avgCost = pos.quantity > EPSILON ? pos.totalCost / pos.quantity : 0;
        cash += qty * (t.pricePerShare ?? 0) - (t.fee ?? 0);
        pos.quantity -= qty;
        pos.totalCost -= avgCost * qty;
        if (pos.quantity <= EPSILON) positions.delete(t.ticker ?? "");
        else positions.set(t.ticker ?? "", pos);
        break;
      }
    }
  }

  return null;
}

function trimNumber(n: number): string {
  return Number(n.toFixed(6)).toString();
}
