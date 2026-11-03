"use client";

import { useState } from "react";
import Money from "./Money";
import PaymentIcon from "./PaymentIcon";
import type { Currency } from "@/lib/currency";
import type { MonthTotal } from "@/lib/expenses";
import { formatAxisTick, formatMoney, formatMonthName } from "@/lib/format";

const PLOT_HEIGHT = 208;
const TARGET_TICKS = 4;

const SERIES = [
  { key: "card", label: "Card", color: "bg-series-card" },
  { key: "cash", label: "Cash", color: "bg-series-cash" },
] as const;

/** The smallest 1, 2 or 5 × 10ⁿ step, so that axis ticks land on clean numbers. */
function axisStep(max: number): number {
  const rough = max / TARGET_TICKS;
  const power = 10 ** Math.floor(Math.log10(rough));
  return [1, 2, 5, 10].find((factor) => factor * power >= rough)! * power;
}

export default function YearChart({
  months,
  currency,
}: {
  months: MonthTotal[];
  currency: Currency;
}) {
  // Phones have no hover, so tapping a month is what reveals its amounts.
  const [selected, setSelected] = useState<string | null>(null);
  const active = months.find(({ month }) => month === selected);

  const max = Math.max(...months.flatMap(({ card, cash }) => [card, cash]));
  const step = axisStep(max);
  const stepCount = Math.ceil(max / step);
  const top = step * stepCount;
  const ticks = Array.from({ length: stepCount + 1 }, (_, index) => index * step);
  const toPixels = (value: number) => (value / top) * PLOT_HEIGHT;

  return (
    <figure className="rounded-xl border border-line bg-surface px-4 py-4">
      <div className="flex items-center gap-4">
        {SERIES.map(({ key, label, color }) => (
          <span key={key} className="flex items-center gap-1.5 text-sm">
            <span aria-hidden className={`h-2.5 w-2.5 rounded-sm ${color}`} />
            <PaymentIcon method={key} />
            {label}
          </span>
        ))}
      </div>

      <p
        aria-live="polite"
        className="mt-1 flex min-h-5 flex-wrap items-center gap-x-1 text-sm text-muted"
      >
        {active ? (
          <>
            {formatMonthName(active.month)}:
            <PaymentIcon method="card" />
            Card
            <span className="font-semibold text-fg">
              <Money value={active.card} currency={currency} />
            </span>
            ·
            <PaymentIcon method="cash" />
            Cash
            <span className="font-semibold text-fg">
              <Money value={active.cash} currency={currency} />
            </span>
          </>
        ) : (
          "Tap a month to see its amounts."
        )}
      </p>

      <div className="mt-4 flex" style={{ height: PLOT_HEIGHT }}>
        <div aria-hidden className="relative w-9 shrink-0">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="tnum absolute right-2 translate-y-1/2 text-[10px] leading-none text-muted"
              style={{ bottom: toPixels(tick) }}
            >
              {formatAxisTick(tick, top)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {ticks.map((tick) => (
            <span
              key={tick}
              aria-hidden
              className="absolute inset-x-0 h-px bg-line"
              style={{ bottom: toPixels(tick) }}
            />
          ))}

          <div className="absolute inset-0 flex">
            {months.map(({ month, card, cash }) => (
              <button
                key={month}
                aria-label={`${formatMonthName(month)}: card ${formatMoney(card, currency)}, cash ${formatMoney(cash, currency)}`}
                aria-pressed={month === selected}
                onClick={() => setSelected(month === selected ? null : month)}
                className={`flex min-w-0 flex-1 items-end justify-center gap-0.5 px-px transition-opacity ${
                  selected && month !== selected ? "opacity-40" : ""
                }`}
                style={{ height: PLOT_HEIGHT }}
              >
                {SERIES.map(({ key, color }) => (
                  <span
                    key={key}
                    className={`block max-w-3 flex-1 rounded-t ${color}`}
                    style={{ height: toPixels(key === "card" ? card : cash) }}
                  />
                ))}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div aria-hidden className="mt-1.5 ml-9 flex">
        {months.map(({ month }) => (
          <span
            key={month}
            className="min-w-0 flex-1 text-center text-[10px] leading-none text-muted"
          >
            {formatMonthName(month, "narrow")}
          </span>
        ))}
      </div>
    </figure>
  );
}
