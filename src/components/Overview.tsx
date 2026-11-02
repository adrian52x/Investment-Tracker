"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import Chevron from "./Chevron";
import ExpenseForm from "./ExpenseForm";
import NavLink from "./NavLink";
import { logout } from "@/lib/actions";
import {
  currentMonth,
  shiftMonth,
  summarize,
  type Category,
  type Expense,
} from "@/lib/expenses";
import {
  formatCategory,
  formatDate,
  formatMoney,
  formatMonth,
} from "@/lib/format";

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

export default function Overview({
  username,
  month,
  expenses,
  categories,
}: {
  username: string;
  month: string;
  expenses: Expense[];
  categories: Category[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(null);

  const summary = summarize(expenses);
  const isCurrentMonth = month === currentMonth();
  const largestCategory = summary.categories[0]?.total ?? 0;

  function handleSaved() {
    // New expenses are dated today, so bring the user back to where it landed.
    if (!form?.expense && !isCurrentMonth) router.push("/");
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

      <nav
        aria-label="Month"
        className="mt-2 flex items-center justify-between"
      >
        <NavLink
          href={`/?month=${shiftMonth(month, -1)}`}
          aria-label="Previous month"
          className="-ml-2 rounded-full p-2.5 text-muted active:bg-line/60"
        >
          <Chevron direction="left" />
        </NavLink>
        <p className="text-sm font-medium">{formatMonth(month)}</p>
        {isCurrentMonth ? (
          <span className="-mr-2 p-2.5 text-line" aria-hidden>
            <Chevron direction="right" />
          </span>
        ) : (
          <NavLink
            href={`/?month=${shiftMonth(month, 1)}`}
            aria-label="Next month"
            className="-mr-2 rounded-full p-2.5 text-muted active:bg-line/60"
          >
            <Chevron direction="right" />
          </NavLink>
        )}
      </nav>

      <section className="pt-4 pb-6 text-center">
        <p className="text-sm text-muted">Total spent</p>
        <p className="tnum mt-1 text-[2.75rem] leading-tight font-bold tracking-tight">
          {formatMoney(summary.total)}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-2">
        {[
          { label: "Card", value: summary.card },
          { label: "Cash", value: summary.cash },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-line bg-surface px-4 py-3"
          >
            <p className="text-sm text-muted">{label}</p>
            <p className="tnum mt-0.5 text-base font-semibold">
              {formatMoney(value)}
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
                    {formatMoney(category.total)}
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
        {expenses.length === 0 ? (
          <p className="rounded-xl border border-line bg-surface px-4 py-8 text-center text-sm text-muted">
            {isCurrentMonth
              ? "Nothing yet. Tap Add expense to log your first."
              : "No expenses this month."}
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {expenses.map((expense) => (
              <li key={expense.id}>
                <button
                  onClick={() => setForm({ expense })}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-line/40"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-medium">
                      {formatCategory(expense.categoryName, expense.categoryIcon)}
                    </span>
                    <span className="block text-sm text-muted">
                      {formatDate(expense.spentOn)} ·{" "}
                      {expense.paymentMethod === "card" ? "Card" : "Cash"}
                    </span>
                  </span>
                  <span className="tnum shrink-0 text-base font-semibold">
                    {formatMoney(expense.amount)}
                  </span>
                </button>
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
          existing={form.expense}
          onClose={() => setForm(null)}
          onSaved={handleSaved}
        />
      )}
    </main>
  );
}
