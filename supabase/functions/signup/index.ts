// Creates a username/password account. Supabase Auth needs an email, so each
// username maps to a placeholder address that is confirmed up front and never
// mailed. Keep the rules in sync with src/lib/credentials.ts.
import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;
const MIN_PASSWORD_LENGTH = 6;
const EMAIL_DOMAIN = "expenses.invalid";

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const body = await req.json().catch(() => null);
  const username =
    typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!USERNAME_PATTERN.test(username)) {
    return json(400, { error: "invalid_username" });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return json(400, { error: "weak_password" });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { error } = await admin.auth.admin.createUser({
    email: `${username}@${EMAIL_DOMAIN}`,
    password,
    email_confirm: true,
    user_metadata: { username },
  });

  if (error) {
    if (error.code === "email_exists") {
      return json(409, { error: "username_taken" });
    }
    console.error("createUser failed", error.code, error.message);
    return json(500, { error: "signup_failed" });
  }

  return json(201, { ok: true });
});
