import PaymentIcon from "./PaymentIcon";
import type { Expense } from "@/lib/expenses";
import { formatCategory, formatDate, formatMoney } from "@/lib/format";

const ROW = "flex w-full items-center gap-3 px-4 py-3 text-left";

/** One line of an expense list: comment, category, date, payment and amount. */
export default function ExpenseRow({
  expense,
  onClick,
}: {
  expense: Expense;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          {expense.note && (
            <span className="min-w-0 truncate text-base font-medium">
              {expense.note}
            </span>
          )}
          <span className="max-w-full shrink-0 truncate rounded-full border border-line bg-bg px-2 py-0.5 text-xs font-medium">
            {formatCategory(expense.categoryName, expense.categoryIcon)}
          </span>
        </span>
        <span className="mt-0.5 flex items-center gap-1 text-sm text-muted">
          {formatDate(expense.spentOn)} ·
          <PaymentIcon method={expense.paymentMethod} />
          {expense.paymentMethod === "card" ? "Card" : "Cash"}
        </span>
      </span>
      <span className="tnum shrink-0 text-base font-semibold">
        {formatMoney(expense.amount)}
      </span>
    </>
  );

  return onClick ? (
    <button onClick={onClick} className={`${ROW} active:bg-line/40`}>
      {content}
    </button>
  ) : (
    <div className={ROW}>{content}</div>
  );
}
