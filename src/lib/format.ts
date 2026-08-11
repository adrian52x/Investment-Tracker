import type { Account } from "./types";

export function formatMoney(account: Account, value: number): string {
  return new Intl.NumberFormat(account.locale, {
    style: "currency",
    currency: account.currency,
  }).format(value);
}

/** Format with an explicit sign for P/L figures, e.g. "+3.000,00 kr." */
export function formatSignedMoney(account: Account, value: number): string {
  return new Intl.NumberFormat(account.locale, {
    style: "currency",
    currency: account.currency,
    signDisplay: "exceptZero",
  }).format(value);
}

export function formatQuantity(account: Account, value: number): string {
  return new Intl.NumberFormat(account.locale, {
    maximumFractionDigits: 6,
  }).format(value);
}

export function formatDate(account: Account, isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat(account.locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
