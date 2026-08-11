"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { summarize, sortChronologically } from "./calc";
import { repository } from "./dexie-repository";
import type { AccountId, AccountSummary, Transaction } from "./types";

/**
 * Live view of one account's ledger and its derived summary.
 * Reads go through the repository; useLiveQuery re-runs on any change.
 */
export function useTransactions(accountId: AccountId): {
  transactions: Transaction[] | undefined;
  summary: AccountSummary | undefined;
} {
  const transactions = useLiveQuery(
    () => repository.list(accountId),
    [accountId],
  );

  const sorted = useMemo(
    () => (transactions ? sortChronologically(transactions).reverse() : undefined),
    [transactions],
  );

  const summary = useMemo(
    () => (transactions ? summarize(transactions) : undefined),
    [transactions],
  );

  return { transactions: sorted, summary };
}
