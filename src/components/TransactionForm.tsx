"use client";

import { useMemo, useState } from "react";
import Sheet from "./Sheet";
import { validateTransaction } from "@/lib/calc";
import { repository } from "@/lib/dexie-repository";
import type { Account, Transaction, TransactionType } from "@/lib/types";
import { isTradeType } from "@/lib/types";

const TYPE_LABELS: Record<TransactionType, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  buy: "Buy",
  sell: "Sell",
  dividend: "Dividend",
  tax: "Tax",
};

const TYPE_ORDER: TransactionType[] = [
  "buy",
  "sell",
  "deposit",
  "withdrawal",
  "dividend",
  "tax",
];

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default function TransactionForm({
  account,
  existing,
  allTransactions,
  onClose,
}: {
  account: Account;
  /** When set, the form edits this transaction instead of creating one. */
  existing?: Transaction;
  allTransactions: Transaction[];
  onClose: () => void;
}) {
  const isEdit = !!existing;
  const [type, setType] = useState<TransactionType>(existing?.type ?? "buy");
  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [note, setNote] = useState(existing?.note ?? "");
  const [amount, setAmount] = useState(existing?.amount?.toString() ?? "");
  const [ticker, setTicker] = useState(existing?.ticker ?? "");
  const [quantity, setQuantity] = useState(existing?.quantity?.toString() ?? "");
  const [price, setPrice] = useState(existing?.pricePerShare?.toString() ?? "");
  const [fee, setFee] = useState(existing?.fee?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const types = useMemo(
    () => TYPE_ORDER.filter((t) => t !== "tax" || account.supportsTax),
    [account.supportsTax],
  );

  const trade = isTradeType(type);

  const parseNum = (s: string): number | undefined => {
    if (s.trim() === "") return undefined;
    const n = Number(s.replace(",", "."));
    return Number.isFinite(n) ? n : undefined;
  };

  async function handleSave() {
    const tx: Transaction = {
      id: existing?.id ?? crypto.randomUUID(),
      accountId: account.id,
      type,
      date,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      note: note.trim() || undefined,
      ...(trade
        ? {
            ticker: ticker.trim().toUpperCase(),
            quantity: parseNum(quantity),
            pricePerShare: parseNum(price),
            fee: parseNum(fee) ?? 0,
          }
        : { amount: parseNum(amount) }),
    };

    const others = allTransactions.filter((t) => t.id !== tx.id);
    const validationError = validateTransaction(tx, others);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (isEdit) await repository.update(tx);
    else await repository.add(tx);
    onClose();
  }

  async function handleDelete() {
    if (!existing) return;
    await repository.remove(existing.id);
    onClose();
  }

  const inputCls =
    "w-full rounded-xl border border-line bg-bg px-4 py-3 text-base tnum outline-none focus:border-accent";
  const labelCls = "mb-1.5 block text-xs font-medium text-muted";

  return (
    <Sheet title={isEdit ? "Edit transaction" : "New transaction"} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {/* Type picker */}
        <div className="grid grid-cols-3 gap-2">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => {
                setType(t);
                setError(null);
              }}
              className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                type === t
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line text-muted active:bg-line/40"
              }`}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {trade ? (
          <>
            <div>
              <label className={labelCls}>Ticker</label>
              <input
                className={inputCls}
                placeholder="e.g. AAPL, NOVO-B"
                autoCapitalize="characters"
                autoCorrect="off"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Quantity</label>
                <input
                  className={inputCls}
                  inputMode="decimal"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>
                  Price / share ({account.currency})
                </label>
                <input
                  className={inputCls}
                  inputMode="decimal"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Fee ({account.currency}) — optional</label>
              <input
                className={inputCls}
                inputMode="decimal"
                placeholder="0.00"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            </div>
          </>
        ) : (
          <div>
            <label className={labelCls}>Amount ({account.currency})</label>
            <input
              className={inputCls}
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Date</label>
            <input
              type="date"
              className={inputCls}
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Note — optional</label>
            <input
              className={inputCls}
              placeholder="Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-neg/10 px-4 py-3 text-sm text-neg">{error}</p>
        )}

        <button
          onClick={handleSave}
          className="mt-1 rounded-xl bg-accent py-3.5 text-base font-semibold text-white active:opacity-80"
        >
          {isEdit ? "Save changes" : "Add transaction"}
        </button>

        {isEdit &&
          (confirmDelete ? (
            <button
              onClick={handleDelete}
              className="rounded-xl border border-neg py-3 text-base font-semibold text-neg active:bg-neg/10"
            >
              Confirm delete
            </button>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="py-1 text-sm font-medium text-neg active:opacity-70"
            >
              Delete transaction
            </button>
          ))}
      </div>
    </Sheet>
  );
}
