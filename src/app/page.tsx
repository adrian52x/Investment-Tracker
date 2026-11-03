import { redirect } from "next/navigation";
import Overview from "@/components/Overview";
import { userCurrency } from "@/lib/currency";
import {
  currentMonth,
  EXPENSE_COLUMNS,
  isMonth,
  shiftMonth,
  toExpense,
} from "@/lib/expenses";
import { createClient } from "@/lib/supabase/server";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  const params = await searchParams;
  const today = currentMonth();
  const month = isMonth(params.month) && params.month < today ? params.month : today;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) redirect("/login");

  const [expensesResult, categoriesResult] = await Promise.all([
    supabase
      .from("expenses")
      .select(EXPENSE_COLUMNS)
      .gte("spent_on", `${month}-01`)
      .lt("spent_on", `${shiftMonth(month, 1)}-01`)
      .order("spent_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name, icon").order("name"),
  ]);

  if (expensesResult.error) throw new Error(expensesResult.error.message);
  if (categoriesResult.error) throw new Error(categoriesResult.error.message);

  const expenses = expensesResult.data.map(toExpense);

  const username = auth.claims.user_metadata?.username;

  return (
    <Overview
      username={typeof username === "string" ? username : ""}
      currency={userCurrency(auth.claims.app_metadata)}
      month={month}
      expenses={expenses}
      categories={categoriesResult.data}
    />
  );
}
