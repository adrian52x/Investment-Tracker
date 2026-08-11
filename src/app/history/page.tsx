"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import TransactionForm from "@/components/TransactionForm";
import TransactionRow from "@/components/TransactionRow";
import type { Transaction, TransactionType } from "@/lib/types";
import { useAccount } from "@/lib/use-account";
import { useTransactions } from "@/lib/use-transactions";

const FILTERS: { label: string; value: TransactionType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Buys", value: "buy" },
  { label: "Sells", value: "sell" },
  { label: "Deposits", value: "deposit" },
  { label: "Withdrawals", value: "withdrawal" },
  { label: "Dividends", value: "dividend" },
  { label: "Tax", value: "tax" },
];

export default function HistoryPage() {
  const { account, accountId, ready } = useAccount();
  const { transactions } = useTransactions(accountId);
  const [filter, setFilter] = useState<TransactionType | "all">("all");
  const [editing, setEditing] = useState<Transaction | undefined>();

  const filters = FILTERS.filter(
    (f) => f.value !== "tax" || account.supportsTax,
  );

  const filtered = useMemo(
    () =>
      transactions?.filter((tx) => filter === "all" || tx.type === filter) ?? [],
    [transactions, filter],
  );

  const loaded = ready && transactions !== undefined;

  return (
    <main className="mx-auto max-w-lg px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),2rem)]">
      <header className="flex items-center gap-3 py-3">
        <Link
          href="/"
          aria-label="Back"
          className="-ml-2 rounded-full p-2 text-muted active:bg-line/60"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M11.5 3.5L6 9l5.5 5.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold">
          History <span className="font-normal text-muted">· {account.name}</span>
        </h1>
      </header>

      {/* Filter chips */}
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 py-2 [scrollbar-width:none]">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f.value
                ? "border-accent bg-accent-soft text-accent"
                : "border-line text-muted active:bg-line/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!loaded ? (
        <div className="mt-10 text-center text-sm text-muted">Loading…</div>
      ) : filtered.length === 0 ? (
        <p className="mt-6 rounded-xl border border-line bg-surface px-4 py-8 text-center text-sm text-muted">
          No transactions
        </p>
      ) : (
        <div className="mt-3 divide-y divide-line rounded-xl border border-line bg-surface px-3">
          {filtered.map((tx) => (
            <TransactionRow
              key={tx.id}
              account={account}
              tx={tx}
              onClick={() => setEditing(tx)}
            />
          ))}
        </div>
      )}

      {editing && (
        <TransactionForm
          account={account}
          existing={editing}
          allTransactions={transactions ?? []}
          onClose={() => setEditing(undefined)}
        />
      )}
    </main>
  );
}
