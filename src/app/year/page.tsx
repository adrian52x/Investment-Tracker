import { redirect } from "next/navigation";
import YearOverview from "@/components/YearOverview";
import {
  containsPattern,
  currentMonth,
  EXPENSE_COLUMNS,
  isYear,
  MAX_NOTE_LENGTH,
  summarizeYear,
  toExpense,
  type PaymentMethod,
} from "@/lib/expenses";
import { createClient } from "@/lib/supabase/server";

// The API returns at most this many rows per request.
const PAGE_SIZE = 1000;

/** Requests one page after another until a short page shows the rows ran out. */
async function fetchAll<T>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

export default async function YearPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string | string[]; q?: string | string[] }>;
}) {
  const params = await searchParams;
  const today = currentMonth().slice(0, 4);
  const year = isYear(params.year) && params.year < today ? params.year : today;
  const query =
    typeof params.q === "string" ? params.q.trim().slice(0, MAX_NOTE_LENGTH) : "";

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) redirect("/login");

  const start = `${year}-01-01`;
  const end = `${Number(year) + 1}-01-01`;

  const [rows, matches] = await Promise.all([
    fetchAll((from, to) =>
      supabase
        .from("expenses")
        .select("amount, payment_method, spent_on")
        .gte("spent_on", start)
        .lt("spent_on", end)
        .order("id")
        .range(from, to),
    ),
    query
      ? fetchAll((from, to) =>
          supabase
            .from("expenses")
            .select(EXPENSE_COLUMNS)
            .gte("spent_on", start)
            .lt("spent_on", end)
            .ilike("note", containsPattern(query))
            .order("spent_on", { ascending: false })
            .order("created_at", { ascending: false })
            .order("id")
            .range(from, to),
        )
      : [],
  ]);

  const expenses = rows.map((row) => ({
    amount: row.amount,
    paymentMethod: row.payment_method as PaymentMethod,
    spentOn: row.spent_on,
  }));

  return (
    <YearOverview
      year={year}
      months={summarizeYear(year, expenses)}
      query={query}
      matches={matches.map(toExpense)}
    />
  );
}
