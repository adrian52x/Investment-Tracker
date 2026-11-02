export type PaymentMethod = "card" | "cash";

export interface Category {
  id: string;
  name: string;
  icon: string | null;
}

export interface Expense {
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  note: string | null;
  /** Calendar date, YYYY-MM-DD. */
  spentOn: string;
}

export interface CategoryTotal {
  id: string;
  name: string;
  icon: string | null;
  total: number;
}

export interface Summary {
  total: number;
  card: number;
  cash: number;
  categories: CategoryTotal[];
}

export interface MonthTotal {
  /** Calendar month, YYYY-MM. */
  month: string;
  card: number;
  cash: number;
}

export type YearExpense = Pick<Expense, "amount" | "paymentMethod" | "spentOn">;

const TIME_ZONE = "Europe/Copenhagen";
const MAX_AMOUNT = 9_999_999_999.99;
export const MAX_NOTE_LENGTH = 200;
/** The year the app started; year dropdowns begin here. */
export const FIRST_YEAR = 2026;
const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20E3/u;

/** The columns toExpense reads, with the category's name and icon joined in. */
export const EXPENSE_COLUMNS =
  "id, amount, payment_method, category_id, note, spent_on, categories(name, icon)";

export function toExpense(row: {
  id: string;
  amount: number;
  payment_method: string;
  category_id: string;
  note: string | null;
  spent_on: string;
  categories: unknown;
}): Expense {
  // An expense has one category, but the untyped client can't know that.
  const category = row.categories as { name: string; icon: string | null };
  return {
    id: row.id,
    amount: row.amount,
    paymentMethod: row.payment_method as PaymentMethod,
    categoryId: row.category_id,
    categoryName: category.name,
    categoryIcon: category.icon,
    note: row.note,
    spentOn: row.spent_on,
  };
}

/** An ilike pattern for "contains", with any % or _ in the query taken literally. */
export function containsPattern(query: string): string {
  return `%${query.replace(/[\\%_]/g, "\\$&")}%`;
}

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

/**
 * The last emoji in the input, or "" if there is none. An emoji can span several
 * code points, so this splits by what the user sees as one character.
 */
export function lastEmoji(input: string): string {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const characters = Array.from(segmenter.segment(input), (s) => s.segment);
  return characters.findLast((character) => EMOJI.test(character)) ?? "";
}

/** Today as YYYY-MM-DD, in the app's home time zone. */
export function currentDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** The current month as YYYY-MM, in the app's home time zone. */
export function currentMonth(now: Date = new Date()): string {
  return currentDate(now).slice(0, 7);
}

/** A real calendar date as YYYY-MM-DD, so "2026-02-30" is rejected. */
export function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function isMonth(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function isYear(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}$/.test(value);
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
  const byCategory = new Map<
    string,
    { name: string; icon: string | null; total: number }
  >();

  for (const expense of expenses) {
    const ore = Math.round(expense.amount * 100);
    if (expense.paymentMethod === "card") card += ore;
    else cash += ore;

    const entry = byCategory.get(expense.categoryId);
    if (entry) entry.total += ore;
    else {
      byCategory.set(expense.categoryId, {
        name: expense.categoryName,
        icon: expense.categoryIcon,
        total: ore,
      });
    }
  }

  return {
    total: (card + cash) / 100,
    card: card / 100,
    cash: cash / 100,
    categories: [...byCategory]
      .map(([id, entry]) => ({ id, ...entry, total: entry.total / 100 }))
      .sort((a, b) => b.total - a.total),
  };
}

/** One entry per month of the year, including months with no expenses. */
export function summarizeYear(year: string, expenses: YearExpense[]): MonthTotal[] {
  const months = Array.from({ length: 12 }, (_, index) => ({
    month: `${year}-${String(index + 1).padStart(2, "0")}`,
    card: 0,
    cash: 0,
  }));

  // Sum in øre, as summarize does.
  for (const expense of expenses) {
    const month = months[Number(expense.spentOn.slice(5, 7)) - 1];
    month[expense.paymentMethod] += Math.round(expense.amount * 100);
  }

  return months.map(({ month, card, cash }) => ({
    month,
    card: card / 100,
    cash: cash / 100,
  }));
}
