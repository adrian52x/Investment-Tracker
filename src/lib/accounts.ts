import type { Account, AccountId } from "./types";

export const ACCOUNTS: Record<AccountId, Account> = {
  saxo: {
    id: "saxo",
    name: "SaxoBank",
    subtitle: "Aktiesparekonto",
    currency: "DKK",
    locale: "da-DK",
    supportsTax: true,
  },
  revolut: {
    id: "revolut",
    name: "Revolut",
    currency: "USD",
    locale: "en-US",
    supportsTax: false,
  },
};

export const ACCOUNT_IDS: AccountId[] = ["saxo", "revolut"];
