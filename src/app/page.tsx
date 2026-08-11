"use client";

import Link from "next/link";
import { useState } from "react";
import BackupSheet from "@/components/BackupSheet";
import SegmentedControl from "@/components/SegmentedControl";
import TransactionForm from "@/components/TransactionForm";
import TransactionRow from "@/components/TransactionRow";
import { formatMoney, formatQuantity, formatSignedMoney } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { useAccount } from "@/lib/use-account";
import { useTransactions } from "@/lib/use-transactions";

export default function OverviewPage() {
  const { account, accountId, setAccountId, ready } = useAccount();
  const { transactions, summary } = useTransactions(accountId);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | undefined>();
  const [showBackup, setShowBackup] = useState(false);

  const loaded = ready && transactions !== undefined && summary !== undefined;
  const recent = transactions?.slice(0, 5) ?? [];

  const chips: { label: string; value: number; signed?: boolean }[] = summary
    ? [
        { label: "Deposited", value: summary.totalDeposited },
        { label: "Withdrawn", value: summary.totalWithdrawn },
        { label: "Realized P/L", value: summary.realizedPnl, signed: true },
        { label: "Dividends", value: summary.totalDividends },
        { label: "Fees", value: summary.totalFees },
        ...(account.supportsTax
          ? [{ label: "Tax paid", value: summary.totalTaxPaid }]
          : []),
      ]
    : [];

  return (
    <main className="mx-auto max-w-lg px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-32">
      <header className="flex items-center justify-between py-3">
        <h1 className="text-lg font-semibold">Invest</h1>
        <button
          onClick={() => setShowBackup(true)}
          aria-label="Backup"
          className="-mr-2 rounded-full p-2 text-muted active:bg-line/60"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M9 2v9m0 0L5.5 7.5M9 11l3.5-3.5M3 13v1.5A1.5 1.5 0 0 0 4.5 16h9a1.5 1.5 0 0 0 1.5-1.5V13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </header>

      <SegmentedControl value={accountId} onChange={setAccountId} />

      {!loaded ? (
        <div className="mt-10 text-center text-sm text-muted">Loading…</div>
      ) : (
        <>
          {/* Hero */}
          <section className="pt-8 pb-6 text-center">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">
              {account.name}
              {account.subtitle ? ` · ${account.subtitle}` : ""} — Cash balance
            </p>
            <p className="tnum mt-2 text-[2.75rem] leading-tight font-bold tracking-tight">
              {formatMoney(account, summary.cashBalance)}
            </p>
            <p className="tnum mt-1 text-sm text-muted">
              Invested {formatMoney(account, summary.invested)} · Total{" "}
              {formatMoney(account, summary.cashBalance + summary.invested)}
            </p>
          </section>

          {/* Stat chips */}
          <section className="grid grid-cols-2 gap-2">
            {chips.map((chip) => (
              <div
                key={chip.label}
                className="rounded-xl border border-line bg-surface px-4 py-3"
              >
                <p className="text-xs text-muted">{chip.label}</p>
                <p
                  className={`tnum mt-0.5 text-sm font-semibold ${
                    chip.signed
                      ? chip.value > 0
                        ? "text-pos"
                        : chip.value < 0
                          ? "text-neg"
                          : ""
                      : ""
                  }`}
                >
                  {chip.signed
                    ? formatSignedMoney(account, chip.value)
                    : formatMoney(account, chip.value)}
                </p>
              </div>
            ))}
          </section>

          {/* Holdings */}
          <section className="mt-8">
            <h2 className="mb-2 text-sm font-semibold text-muted">Holdings</h2>
            {summary.holdings.length === 0 ? (
              <p className="rounded-xl border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
                No current holdings
              </p>
            ) : (
              <div className="divide-y divide-line rounded-xl border border-line bg-surface px-4">
                {summary.holdings.map((h) => (
                  <div key={h.ticker} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{h.ticker}</p>
                      <p className="tnum mt-0.5 text-xs text-muted">
                        {formatQuantity(account, h.quantity)} shares · avg{" "}
                        {formatMoney(account, h.avgCost)}
                      </p>
                    </div>
                    <p className="tnum text-sm font-semibold">
                      {formatMoney(account, h.totalCost)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent transactions */}
          <section className="mt-8">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-muted">Recent</h2>
              <Link
                href="/history"
                className="text-sm font-medium text-accent active:opacity-70"
              >
                See all
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="rounded-xl border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
                No transactions yet — tap + to add your first
              </p>
            ) : (
              <div className="divide-y divide-line rounded-xl border border-line bg-surface px-3">
                {recent.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    account={account}
                    tx={tx}
                    onClick={() => {
                      setEditing(tx);
                      setShowForm(true);
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Floating add button */}
      <button
        onClick={() => {
          setEditing(undefined);
          setShowForm(true);
        }}
        aria-label="Add transaction"
        className="fixed right-5 bottom-[max(env(safe-area-inset-bottom),1.25rem)] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg active:scale-95"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path
            d="M11 4v14M4 11h14"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {showForm && (
        <TransactionForm
          account={account}
          existing={editing}
          allTransactions={transactions ?? []}
          onClose={() => setShowForm(false)}
        />
      )}
      {showBackup && <BackupSheet onClose={() => setShowBackup(false)} />}
    </main>
  );
}
