import type { Currency } from "@/lib/currency";
import { moneyParts } from "@/lib/format";

/**
 * An amount with a smaller, muted currency symbol, so the number stands out.
 * On the big totals the symbol matches the one in ExpenseForm; on small
 * amounts it stops at 12px to stay readable.
 */
export default function Money({ value, currency }: { value: number; currency: Currency }) {
  const { amount, symbol } = moneyParts(value, currency);
  // da-DK puts every one of the currencies after the number.
  return (
    <>
      {amount}
      <span className="text-[length:max(0.45em,0.75rem)] text-muted">
        {" "}
        {symbol}
      </span>
    </>
  );
}
