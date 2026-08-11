"use client";

import { formatDate, formatMoney, formatQuantity, formatSignedMoney } from "@/lib/format";
import type { Account, Transaction } from "@/lib/types";

const TYPE_LABELS: Record<Transaction["type"], string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  buy: "Buy",
  sell: "Sell",
  dividend: "Dividend",
  tax: "Tax",
};

/** Signed cash effect of a transaction on the account balance. */
export function cashEffect(tx: Transaction): number {
  switch (tx.type) {
    case "deposit":
    case "dividend":
      return tx.amount ?? 0;
    case "withdrawal":
    case "tax":
      return -(tx.amount ?? 0);
    case "buy":
      return -((tx.quantity ?? 0) * (tx.pricePerShare ?? 0) + (tx.fee ?? 0));
    case "sell":
      return (tx.quantity ?? 0) * (tx.pricePerShare ?? 0) - (tx.fee ?? 0);
  }
}

export default function TransactionRow({
  account,
  tx,
  onClick,
}: {
  account: Account;
  tx: Transaction;
  onClick?: () => void;
}) {
  const effect = cashEffect(tx);
  const isTrade = tx.type === "buy" || tx.type === "sell";

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-1 py-3 text-left active:bg-line/30"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {isTrade ? (
            <>
              {TYPE_LABELS[tx.type]} {tx.ticker}
            </>
          ) : (
            TYPE_LABELS[tx.type]
          )}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted">
          {formatDate(account, tx.date)}
          {isTrade && (
            <>
              {" · "}
              <span className="tnum">
                {formatQuantity(account, tx.quantity ?? 0)} ×{" "}
                {formatMoney(account, tx.pricePerShare ?? 0)}
              </span>
            </>
          )}
          {tx.note && <> · {tx.note}</>}
        </p>
      </div>
      <p className={`tnum text-sm font-semibold ${effect >= 0 ? "" : "text-fg"}`}>
        {formatSignedMoney(account, effect)}
      </p>
    </button>
  );
}
