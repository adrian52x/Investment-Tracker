"use client";

import { useEffect, useState, useTransition } from "react";
import { addCategory, deleteExpense, saveExpense } from "@/lib/actions";
import {
  amountToKeypad,
  parseAmount,
  pressKey,
  type Category,
  type Expense,
  type PaymentMethod,
} from "@/lib/expenses";
import { formatKeypadAmount } from "@/lib/format";

const METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "card", label: "Card" },
  { id: "cash", label: "Cash" },
];

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "backspace"];

/**
 * Full-screen entry form. It uses its own keypad rather than the system
 * keyboard, which would cover the category list and the save button.
 */
export default function ExpenseForm({
  categories,
  existing,
  onClose,
  onSaved,
}: {
  categories: Category[];
  /** When set, the form edits this expense instead of creating one. */
  existing?: Expense;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState(
    existing ? amountToKeypad(existing.amount) : "",
  );
  const [method, setMethod] = useState<PaymentMethod>(
    existing?.paymentMethod ?? "card",
  );
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? "");
  const [addingCategory, setAddingCategory] = useState(categories.length === 0);
  const [newCategory, setNewCategory] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const canSave = parseAmount(amount) !== null && categoryId !== "" && !pending;

  function handleAddCategory() {
    if (!newCategory.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await addCategory(newCategory);
      if (result.category) {
        setCategoryId(result.category.id);
        setNewCategory("");
        setAddingCategory(false);
      } else {
        setError(result.error ?? "Couldn't add the category.");
      }
    });
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveExpense({
        id: existing?.id,
        amount,
        paymentMethod: method,
        categoryId,
      });
      if (result.error) setError(result.error);
      else onSaved();
    });
  }

  function handleDelete() {
    if (!existing) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteExpense(existing.id);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={existing ? "Edit expense" : "Add expense"}
      className="sheet-in fixed inset-0 z-50 mx-auto flex h-dvh max-w-lg flex-col bg-bg pt-[max(env(safe-area-inset-top),0.5rem)] pb-[max(env(safe-area-inset-bottom),0.75rem)]"
    >
      <header className="flex shrink-0 items-center justify-between px-3 py-1">
        <button
          onClick={onClose}
          className="rounded-lg px-2 py-2 text-base text-muted active:opacity-60"
        >
          Cancel
        </button>
        {existing &&
          (confirmDelete ? (
            <button
              onClick={handleDelete}
              disabled={pending}
              className="rounded-lg px-2 py-2 text-base font-semibold text-neg active:opacity-60"
            >
              Confirm delete
            </button>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded-lg px-2 py-2 text-base text-neg active:opacity-60"
            >
              Delete
            </button>
          ))}
      </header>

      <output
        aria-label="Amount"
        className="tnum block shrink-0 px-5 py-2 text-center text-[2.75rem] leading-tight font-bold tracking-tight"
      >
        <span className={amount ? "" : "text-muted"}>
          {formatKeypadAmount(amount)}
        </span>{" "}
        <span className="text-xl font-semibold text-muted">kr.</span>
      </output>

      <div className="mx-5 mt-2 flex shrink-0 rounded-xl bg-line/60 p-1">
        {METHODS.map(({ id, label }) => (
          <button
            key={id}
            aria-pressed={method === id}
            onClick={() => setMethod(id)}
            className={`flex-1 rounded-lg py-2.5 text-base font-medium transition-colors ${
              method === id ? "bg-accent text-on-accent" : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <section
        aria-label="Category"
        className="mt-3 min-h-0 flex-1 overflow-y-auto px-5"
      >
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              aria-pressed={categoryId === category.id}
              onClick={() => setCategoryId(category.id)}
              className={`max-w-full truncate rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                categoryId === category.id
                  ? "border-accent bg-accent text-on-accent"
                  : "border-line bg-surface text-fg"
              }`}
            >
              {category.name}
            </button>
          ))}
          {!addingCategory && (
            <button
              onClick={() => setAddingCategory(true)}
              className="rounded-full border border-dashed border-muted px-4 py-2 text-sm font-medium text-muted"
            >
              + New category
            </button>
          )}
        </div>

        {addingCategory && (
          <form
            className="mt-2 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              handleAddCategory();
            }}
          >
            <input
              aria-label="New category name"
              placeholder="Category name"
              className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 text-base outline-none focus:border-accent"
              maxLength={40}
              enterKeyHint="done"
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
            />
            <button
              type="submit"
              disabled={pending || !newCategory.trim()}
              className="rounded-xl bg-accent px-4 text-sm font-semibold text-on-accent active:opacity-80 disabled:opacity-40"
            >
              Add
            </button>
          </form>
        )}
      </section>

      {error && (
        <p
          role="alert"
          className="mx-5 mt-2 shrink-0 rounded-xl bg-neg/10 px-4 py-2 text-sm text-neg"
        >
          {error}
        </p>
      )}

      <div className="mt-2 grid shrink-0 grid-cols-3 gap-1 px-5">
        {KEYS.map((key) => (
          <button
            key={key}
            aria-label={key === "backspace" ? "Delete digit" : key}
            onClick={() => setAmount((current) => pressKey(current, key))}
            className="tnum flex h-13 items-center justify-center rounded-xl text-2xl font-medium active:bg-line/60"
          >
            {key === "backspace" ? (
              <svg width="26" height="20" viewBox="0 0 26 20" fill="none">
                <path
                  d="M8.5 2H22a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8.5L2 10l6.5-8ZM12 7l6 6m0-6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              key
            )}
          </button>
        ))}
      </div>

      <div className="mt-2 shrink-0 px-5">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full rounded-xl bg-accent py-3.5 text-base font-semibold text-on-accent active:opacity-80 disabled:opacity-40"
        >
          {pending ? "Saving…" : existing ? "Save changes" : "Save expense"}
        </button>
      </div>
    </div>
  );
}
