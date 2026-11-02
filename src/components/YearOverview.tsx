"use client";

import Link from "next/link";
import Chevron from "./Chevron";
import YearChart from "./YearChart";
import { currentMonth, type MonthTotal } from "@/lib/expenses";
import { formatMoney, formatMonthName } from "@/lib/format";

export default function YearOverview({
  year,
  months,
}: {
  year: string;
  months: MonthTotal[];
}) {
  const isCurrentYear = year === currentMonth().slice(0, 4);
  const card = months.reduce((sum, month) => sum + month.card, 0);
  const cash = months.reduce((sum, month) => sum + month.cash, 0);
  const activeMonths = months.filter((month) => month.card + month.cash > 0);

  return (
    <main className="mx-auto max-w-lg px-5 pt-[max(env(safe-area-inset-top),0.5rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]">
      <header className="flex items-center gap-1 py-2">
        <Link
          href="/"
          aria-label="Back to overview"
          className="-ml-2 rounded-full p-2.5 text-muted active:bg-line/60"
        >
          <Chevron direction="left" />
        </Link>
        <h1 className="text-base font-semibold">Year overview</h1>
      </header>

      <nav aria-label="Year" className="mt-2 flex items-center justify-between">
        <Link
          href={`/year?year=${Number(year) - 1}`}
          aria-label="Previous year"
          className="-ml-2 rounded-full p-2.5 text-muted active:bg-line/60"
        >
          <Chevron direction="left" />
        </Link>
        <p className="text-sm font-medium">{year}</p>
        {isCurrentYear ? (
          <span className="-mr-2 p-2.5 text-line" aria-hidden>
            <Chevron direction="right" />
          </span>
        ) : (
          <Link
            href={`/year?year=${Number(year) + 1}`}
            aria-label="Next year"
            className="-mr-2 rounded-full p-2.5 text-muted active:bg-line/60"
          >
            <Chevron direction="right" />
          </Link>
        )}
      </nav>

      <section className="pt-4 pb-6 text-center">
        <p className="text-sm text-muted">Total spent</p>
        <p className="mt-1 text-[2.75rem] leading-tight font-bold tracking-tight">
          {formatMoney(card + cash)}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-2">
        {[
          { label: "Card", value: card },
          { label: "Cash", value: cash },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-line bg-surface px-4 py-3"
          >
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-0.5 text-base font-semibold">{formatMoney(value)}</p>
          </div>
        ))}
      </section>

      {activeMonths.length === 0 ? (
        <p className="mt-8 rounded-xl border border-line bg-surface px-4 py-8 text-center text-sm text-muted">
          No expenses in {year}.
        </p>
      ) : (
        <>
          <section className="mt-8">
            <h2 className="mb-2 text-sm font-semibold text-muted">By month</h2>
            <YearChart months={months} />
          </section>

          <section className="mt-3 rounded-xl border border-line bg-surface px-4 py-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted">
                  <th scope="col" className="py-1.5 text-left font-medium">
                    Month
                  </th>
                  <th scope="col" className="py-1.5 text-right font-medium">
                    Card
                  </th>
                  <th scope="col" className="py-1.5 text-right font-medium">
                    Cash
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {activeMonths.map((month) => (
                  <tr key={month.month}>
                    <th scope="row" className="py-1.5 text-left font-normal">
                      {formatMonthName(month.month)}
                    </th>
                    <td className="tnum py-1.5 text-right">
                      {formatMoney(month.card)}
                    </td>
                    <td className="tnum py-1.5 text-right">
                      {formatMoney(month.cash)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  );
}
