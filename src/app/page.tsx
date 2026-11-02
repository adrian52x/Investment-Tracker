import { redirect } from "next/navigation";
import Overview from "@/components/Overview";
import {
  currentMonth,
  isMonth,
  shiftMonth,
  type Expense,
  type PaymentMethod,
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
      .select("id, amount, payment_method, category_id, spent_on, categories(name, icon)")
      .gte("spent_on", `${month}-01`)
      .lt("spent_on", `${shiftMonth(month, 1)}-01`)
      .order("spent_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name, icon").order("name"),
  ]);

  if (expensesResult.error) throw new Error(expensesResult.error.message);
  if (categoriesResult.error) throw new Error(categoriesResult.error.message);

  const expenses: Expense[] = expensesResult.data.map((row) => {
    const category = row.categories as unknown as {
      name: string;
      icon: string | null;
    };
    return {
      id: row.id,
      amount: row.amount,
      paymentMethod: row.payment_method as PaymentMethod,
      categoryId: row.category_id,
      categoryName: category.name,
      categoryIcon: category.icon,
      spentOn: row.spent_on,
    };
  });

  const username = auth.claims.user_metadata?.username;

  return (
    <Overview
      username={typeof username === "string" ? username : ""}
      month={month}
      expenses={expenses}
      categories={categoriesResult.data}
    />
  );
}
