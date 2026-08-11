export type AccountId = "saxo" | "revolut";

export interface Account {
  id: AccountId;
  name: string;
  subtitle?: string;
  currency: "DKK" | "USD";
  locale: string;
  supportsTax: boolean;
}

export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "buy"
  | "sell"
  | "dividend"
  | "tax";

export interface Transaction {
  id: string;
  accountId: AccountId;
  type: TransactionType;
  date: string; // ISO date, when it happened
  createdAt: string; // ISO timestamp, when recorded
  note?: string;

  // deposit | withdrawal | dividend | tax
  amount?: number;

  // buy | sell
  ticker?: string;
  quantity?: number;
  pricePerShare?: number;
  fee?: number;
}

export interface Holding {
  ticker: string;
  quantity: number;
  totalCost: number;
  avgCost: number;
}

export interface AccountSummary {
  cashBalance: number;
  invested: number;
  totalDeposited: number;
  totalWithdrawn: number;
  realizedPnl: number;
  totalDividends: number;
  totalFees: number;
  totalTaxPaid: number;
  holdings: Holding[];
}

export const CASH_TYPES: readonly TransactionType[] = [
  "deposit",
  "withdrawal",
  "dividend",
  "tax",
];

export const TRADE_TYPES: readonly TransactionType[] = ["buy", "sell"];

export function isCashType(type: TransactionType): boolean {
  return CASH_TYPES.includes(type);
}

export function isTradeType(type: TransactionType): boolean {
  return TRADE_TYPES.includes(type);
}
