"use client";

import NavLink from "./NavLink";
import YearSelect from "./YearSelect";
import { currentMonth } from "@/lib/expenses";
import { formatMonthName } from "@/lib/format";

/** The home page for a month; the current month is plain "/". */
export function monthHref(month: string): string {
  return month === currentMonth() ? "/" : `/?month=${month}`;
}

/** A year dropdown over all twelve months, so any month is at most two taps away. */
export default function MonthPicker({ month }: { month: string }) {
  const today = currentMonth();
  const year = month.slice(0, 4);
  const months = Array.from(
    { length: 12 },
    (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`,
  );

  // Keeps the same month in the new year, unless it hasn't happened yet.
  function sameMonthIn(target: string) {
    const next = `${target}${month.slice(4)}`;
    return monthHref(next > today ? today : next);
  }

  return (
    <nav aria-label="Month" className="mt-2">
      <YearSelect year={year} href={sameMonthIn} />

      <ul className="mt-1.5 grid grid-cols-6 gap-1.5">
        {months.map((option) => {
          const label = formatMonthName(option, "short");
          return (
            <li key={option}>
              {option > today ? (
                <span
                  aria-disabled
                  className="block rounded-lg border border-transparent py-1 text-center text-sm text-line"
                >
                  {label}
                </span>
              ) : (
                <NavLink
                  href={monthHref(option)}
                  aria-label={formatMonthName(option)}
                  aria-current={option === month ? "page" : undefined}
                  className={`block rounded-lg border py-1 text-center text-sm font-medium ${
                    option === month
                      ? "border-accent bg-accent text-on-accent"
                      : "border-line bg-surface text-fg"
                  }`}
                >
                  {label}
                </NavLink>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
