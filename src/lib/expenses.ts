export type PaymentMethod = "card" | "cash";

export interface Category {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
  categoryId: string;
  categoryName: string;
  /** Calendar date, YYYY-MM-DD. */
  spentOn: string;
}

export interface CategoryTotal {
  id: string;
  name: string;
  total: number;
}

export interface Summary {
  total: number;
  card: number;
  cash: number;
  categories: CategoryTotal[];
}

const TIME_ZONE = "Europe/Copenhagen";
const MAX_AMOUNT = 9_999_999_999.99;

/** Parses "125", "125,50" or "125.50" into a number; null if it isn't a valid amount. */
export function parseAmount(input: string): number | null {
  const value = input.trim();
  if (!/^\d+([.,]\d{1,2})?$/.test(value)) return null;
  const amount = Number(value.replace(",", "."));
  return amount > 0 && amount <= MAX_AMOUNT ? amount : null;
}

/** Applies one keypad press to the amount typed so far, in Danish notation. */
export function pressKey(current: string, key: string): string {
  if (key === "backspace") return current.slice(0, -1);
  if (key === ",") {
    if (current.includes(",")) return current;
    return `${current || "0"},`;
  }
  const next = current === "0" ? key : current + key;
  return /^\d{1,10}(,\d{0,2})?$/.test(next) ? next : current;
}

/** Inverse of parseAmount, for loading a saved amount onto the keypad. */
export function amountToKeypad(amount: number): string {
  return amount.toFixed(2).replace(/\.00$/, "").replace(".", ",");
}

/** The current month as YYYY-MM, in the app's home time zone. */
export function currentMonth(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  })
    .format(now)
    .slice(0, 7);
}

export function isMonth(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

export function summarize(expenses: Expense[]): Summary {
  // Sum in øre so that decimal rounding can't drift across many rows.
  let card = 0;
  let cash = 0;
  const byCategory = new Map<string, { name: string; total: number }>();

  for (const expense of expenses) {
    const ore = Math.round(expense.amount * 100);
    if (expense.paymentMethod === "card") card += ore;
    else cash += ore;

    const entry = byCategory.get(expense.categoryId);
    if (entry) entry.total += ore;
    else {
      byCategory.set(expense.categoryId, {
        name: expense.categoryName,
        total: ore,
      });
    }
  }

  return {
    total: (card + cash) / 100,
    card: card / 100,
    cash: cash / 100,
    categories: [...byCategory]
      .map(([id, { name, total }]) => ({ id, name, total: total / 100 }))
      .sort((a, b) => b.total - a.total),
  };
}
