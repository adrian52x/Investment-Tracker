import { redirect } from "next/navigation";
import YearOverview from "@/components/YearOverview";
import {
  currentMonth,
  isYear,
  summarizeYear,
  type PaymentMethod,
  type YearExpense,
} from "@/lib/expenses";
import { createClient } from "@/lib/supabase/server";

// The API returns at most this many rows per request.
const PAGE_SIZE = 1000;

export default async function YearPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string | string[] }>;
}) {
  const params = await searchParams;
  const today = currentMonth().slice(0, 4);
  const year = isYear(params.year) && params.year < today ? params.year : today;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) redirect("/login");

  const expenses: YearExpense[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("expenses")
      .select("amount, payment_method, spent_on")
      .gte("spent_on", `${year}-01-01`)
      .lt("spent_on", `${Number(year) + 1}-01-01`)
      .order("id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);

    for (const row of data) {
      expenses.push({
        amount: row.amount,
        paymentMethod: row.payment_method as PaymentMethod,
        spentOn: row.spent_on,
      });
    }
    if (data.length < PAGE_SIZE) break;
  }

  return <YearOverview year={year} months={summarizeYear(year, expenses)} />;
}
