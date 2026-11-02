"use client";

import Form from "next/form";
import { useFormStatus } from "react-dom";
import ExpenseRow from "./ExpenseRow";
import NavLink from "./NavLink";
import { MAX_NOTE_LENGTH, summarize, type Expense } from "@/lib/expenses";
import { formatMoney } from "@/lib/format";

function SearchButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-xl border border-line bg-surface px-4 text-sm font-medium active:opacity-60"
    >
      Search
      {pending && <span aria-hidden className="nav-progress" />}
    </button>
  );
}

/**
 * Searches the year's comments. It's a GET form, so the query lives in the URL
 * and only pressing Search asks the server, not every keystroke.
 */
export default function YearSearch({
  year,
  query,
  matches,
}: {
  year: string;
  query: string;
  matches: Expense[];
}) {
  return (
    <>
      <Form action="/year" role="search" className="mt-3 flex gap-2">
        <input type="hidden" name="year" value={year} />
        <input
          // Resets the box when the query changes, e.g. after Clear.
          key={query}
          type="search"
          name="q"
          defaultValue={query}
          aria-label="Search comments"
          placeholder={`Search expense in ${year}`}
          maxLength={MAX_NOTE_LENGTH}
          enterKeyHint="search"
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 text-base outline-none focus:border-accent"
        />
        <SearchButton />
      </Form>

      {query && (
        <section className="mt-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-muted">
              {matches.length === 1 ? "1 match" : `${matches.length} matches`}
              {matches.length > 0 && ` · ${formatMoney(summarize(matches).total)}`}
            </h2>
            <NavLink
              href={`/year?year=${year}`}
              className="-mr-2 rounded-lg px-2 py-1 text-sm text-muted active:opacity-60"
            >
              Clear
            </NavLink>
          </div>
          {matches.length === 0 ? (
            <p className="rounded-xl border border-line bg-surface px-4 py-8 text-center text-sm break-words text-muted">
              No comments in {year} contain “{query}”.
            </p>
          ) : (
            <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
              {matches.map((expense) => (
                <li key={expense.id}>
                  <ExpenseRow expense={expense} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
