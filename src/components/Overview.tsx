"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import ExpenseForm from "./ExpenseForm";
import ExpenseRow from "./ExpenseRow";
import Money from "./Money";
import MonthPicker, { monthHref } from "./MonthPicker";
import NavLink from "./NavLink";
import PaymentIcon from "./PaymentIcon";
import { logout } from "@/lib/actions";
import type { Currency } from "@/lib/currency";
import {
  currentMonth,
  summarize,
  type Category,
  type Expense,
} from "@/lib/expenses";
import { formatCategory } from "@/lib/format";

type FormState = { expense?: Expense } | null;

function LogoutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg px-2 py-2 text-sm text-muted active:opacity-60"
    >
      Log out
      {pending && <span aria-hidden className="nav-progress" />}
    </button>
  );
}

function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={selected}
      onClick={onClick}
      className={`max-w-full truncate rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        selected
          ? "border-accent bg-accent text-on-accent"
          : "border-line bg-surface text-fg"
      }`}
    >
      {label}
    </button>
  );
}

export default function Overview({
  username,
  currency,
  month,
  expenses,
  categories,
}: {
  username: string;
  currency: Currency;
  month: string;
  expenses: Expense[];
  categories: Category[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(null);
  const [filterId, setFilterId] = useState<string | null>(null);

  const summary = summarize(expenses);
  const isCurrentMonth = month === currentMonth();
  const largestCategory = summary.categories[0]?.total ?? 0;
  // Falls back to All when the chosen category has no expenses in this month.
  const filter = summary.categories.find(({ id }) => id === filterId);
  const visibleExpenses = filter
    ? expenses.filter(({ categoryId }) => categoryId === filter.id)
    : expenses;

  function handleSaved(spentOn: string) {
    // Follow the expense if its date puts it in another month.
    const savedMonth = spentOn.slice(0, 7);
    if (savedMonth !== month) {
      router.push(monthHref(savedMonth));
    }
    setForm(null);
  }

  return (
    <main className="mx-auto max-w-lg px-5 pt-[max(env(safe-area-inset-top),0.5rem)] pb-32">
      <header className="flex items-center justify-between py-2">
        <h1 className="min-w-0 truncate text-base font-semibold">{username}</h1>
        <div className="-mr-2 flex shrink-0 items-center">
          <NavLink
            href="/year"
            className="rounded-lg px-2 py-2 text-sm text-muted active:opacity-60"
          >
            Year
          </NavLink>
          <NavLink
            href="/categories"
            className="rounded-lg px-2 py-2 text-sm text-muted active:opacity-60"
          >
            Categories
          </NavLink>
          <form action={logout}>
            <LogoutButton />
          </form>
        </div>
      </header>

      <MonthPicker month={month} />

      <section className="pt-4 pb-6 text-center">
        <p className="text-sm text-muted">Total spent</p>
        <p className="tnum mt-1 text-[2.75rem] leading-tight font-bold tracking-tight">
          <Money value={summary.total} currency={currency} />
        </p>
      </section>

      <section className="grid grid-cols-2 gap-2">
        {[
          { method: "card" as const, label: "Card", value: summary.card },
          { method: "cash" as const, label: "Cash", value: summary.cash },
        ].map(({ method, label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-line bg-surface px-4 py-3"
          >
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <PaymentIcon method={method} />
              {label}
            </p>
            <p className="tnum mt-0.5 text-base font-semibold">
              <Money value={value} currency={currency} />
            </p>
          </div>
        ))}
      </section>

      {summary.categories.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-muted">By category</h2>
          <ul className="flex flex-col gap-3 rounded-xl border border-line bg-surface px-4 py-4">
            {summary.categories.map((category) => (
              <li key={category.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-sm">
                    {formatCategory(category.name, category.icon)}
                  </span>
                  <span className="tnum shrink-0 text-sm font-semibold">
                    <Money value={category.total} currency={currency} />
                  </span>
                </div>
                <div
                  aria-hidden
                  className="mt-1.5 h-1.5 rounded-r bg-accent"
                  style={{ width: `${(category.total / largestCategory) * 100}%` }}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold text-muted">Expenses</h2>
        {summary.categories.length > 1 && (
          <div
            role="group"
            aria-label="Filter by category"
            className="mb-2 flex flex-wrap gap-2"
          >
            <FilterChip
              label="All"
              selected={!filter}
              onClick={() => setFilterId(null)}
            />
            {summary.categories.map((category) => (
              <FilterChip
                key={category.id}
                label={formatCategory(category.name, category.icon)}
                selected={category.id === filter?.id}
                onClick={() => setFilterId(category.id)}
              />
            ))}
          </div>
        )}
        {expenses.length === 0 ? (
          <p className="rounded-xl border border-line bg-surface px-4 py-8 text-center text-sm text-muted">
            {isCurrentMonth
              ? "Nothing yet. Tap Add expense to log your first."
              : "No expenses this month."}
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {visibleExpenses.map((expense) => (
              <li key={expense.id}>
                <ExpenseRow
                  expense={expense}
                  currency={currency}
                  onClick={() => setForm({ expense })}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg bg-linear-to-t from-bg via-bg to-transparent px-5 pt-6 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <button
          onClick={() => setForm({})}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-lg font-semibold text-on-accent shadow-lg active:scale-[0.98]"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M10 3.5v13M3.5 10h13"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
          Add expense
        </button>
      </div>

      {form && (
        <ExpenseForm
          categories={categories}
          currency={currency}
          existing={form.expense}
          onClose={() => setForm(null)}
          onSaved={handleSaved}
        />
      )}
    </main>
  );
}
