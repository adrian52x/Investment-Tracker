"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Chevron from "./Chevron";
import { currentMonth, FIRST_YEAR } from "@/lib/expenses";

/** A dropdown of the years from FIRST_YEAR to this one; picking one opens href(year). */
export default function YearSelect({
  year,
  href,
}: {
  year: string;
  href: (year: string) => string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const thisYear = Number(currentMonth().slice(0, 4));
  // An expense dated before FIRST_YEAR can still lead here, so list its year too.
  const firstYear = Math.min(FIRST_YEAR, Number(year));
  const years = Array.from(
    { length: thisYear - firstYear + 1 },
    (_, index) => String(thisYear - index),
  );

  return (
    <div className="relative -ml-2 inline-flex items-center">
      <select
        // Resets the shown year when navigation changes it, e.g. on Back.
        key={year}
        aria-label="Year"
        defaultValue={year}
        onChange={(event) => {
          const target = event.target.value;
          startTransition(() => router.push(href(target)));
        }}
        className="appearance-none rounded-lg bg-transparent py-1 pr-8 pl-2 text-base font-semibold active:bg-line/60"
      >
        {years.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-2 text-muted">
        <Chevron direction="down" />
      </span>
      {pending && <span aria-hidden className="nav-progress" />}
    </div>
  );
}
