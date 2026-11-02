"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  normalizeUsername,
  usernameToEmail,
  validateCredentials,
} from "./credentials";
import {
  lastEmoji,
  MAX_NOTE_LENGTH,
  parseAmount,
  type Category,
  type PaymentMethod,
} from "./expenses";
import { createClient } from "./supabase/server";

export interface AuthState {
  error?: string;
}

export interface ActionResult {
  error?: string;
}

const SIGNUP_ERRORS: Record<string, string> = {
  username_taken: "That username is taken.",
  invalid_username: "That username isn't allowed.",
  weak_password: "Password must be at least 6 characters.",
};

/** Actions are reachable by direct POST, so each one checks the session itself. */
async function authedClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  return supabase;
}

export async function login(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });
  if (error) {
    return {
      error:
        error.code === "invalid_credentials"
          ? "Wrong username or password."
          : "Couldn't log in. Please try again.",
    };
  }

  redirect("/");
}

export async function signup(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  const invalid = validateCredentials(username, password);
  if (invalid) return { error: invalid };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/signup`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      },
      body: JSON.stringify({ username: normalizeUsername(username), password }),
    },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    return {
      error:
        SIGNUP_ERRORS[body?.error] ??
        "Couldn't create your account. Please try again.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });
  if (error) redirect("/login");

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function parseCategory(name: string, icon: string) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 40) {
    return { error: "Category name must be 1–40 characters." };
  }
  if (icon && lastEmoji(icon) !== icon) {
    return { error: "The icon must be a single emoji." };
  }
  return { row: { name: trimmed, icon: icon || null } };
}

export async function addCategory(
  name: string,
  icon: string,
): Promise<{ category?: Category; error?: string }> {
  const { row, error: invalid } = parseCategory(name, icon);
  if (!row) return { error: invalid };

  const supabase = await authedClient();
  const { data, error } = await supabase
    .from("categories")
    .insert(row)
    .select("id, name, icon")
    .single();
  if (error) {
    return {
      error:
        error.code === "23505"
          ? "You already have that category."
          : "Couldn't add the category.",
    };
  }

  // Both pages show categories, so refresh everything under the root layout.
  revalidatePath("/", "layout");
  return { category: data };
}

export async function updateCategory(
  id: string,
  name: string,
  icon: string,
): Promise<ActionResult> {
  const { row, error: invalid } = parseCategory(name, icon);
  if (!row) return { error: invalid };

  const supabase = await authedClient();
  const { error } = await supabase.from("categories").update(row).eq("id", id);
  if (error) {
    return {
      error:
        error.code === "23505"
          ? "You already have that category."
          : "Couldn't save the category.",
    };
  }

  revalidatePath("/", "layout");
  return {};
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const supabase = await authedClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    return {
      error:
        error.code === "23503"
          ? "This category still has expenses. Move or delete them first."
          : "Couldn't delete the category.",
    };
  }

  revalidatePath("/", "layout");
  return {};
}

export async function saveExpense(input: {
  id?: string;
  amount: string;
  paymentMethod: PaymentMethod;
  categoryId: string;
  note: string;
}): Promise<ActionResult> {
  const amount = parseAmount(input.amount);
  if (amount === null) return { error: "Enter an amount." };
  if (input.paymentMethod !== "card" && input.paymentMethod !== "cash") {
    return { error: "Choose card or cash." };
  }
  if (!input.categoryId) return { error: "Choose a category." };
  const note = input.note.trim();
  if (note.length > MAX_NOTE_LENGTH) {
    return { error: `Keep the comment under ${MAX_NOTE_LENGTH} characters.` };
  }

  const supabase = await authedClient();
  const row = {
    amount,
    payment_method: input.paymentMethod,
    category_id: input.categoryId,
    note: note || null,
  };
  const { error } = input.id
    ? await supabase.from("expenses").update(row).eq("id", input.id)
    : await supabase.from("expenses").insert(row);
  if (error) return { error: "Couldn't save the expense." };

  revalidatePath("/");
  return {};
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const supabase = await authedClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) return { error: "Couldn't delete the expense." };

  revalidatePath("/");
  return {};
}
