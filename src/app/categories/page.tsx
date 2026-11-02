import { redirect } from "next/navigation";
import CategoryManager from "@/components/CategoryManager";
import { createClient } from "@/lib/supabase/server";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) redirect("/login");

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, icon")
    .order("name");
  if (error) throw new Error(error.message);

  return <CategoryManager categories={data} />;
}
