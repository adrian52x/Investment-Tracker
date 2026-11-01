// Keep these rules in sync with supabase/functions/signup/index.ts.
const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;
const MIN_PASSWORD_LENGTH = 6;
const EMAIL_DOMAIN = "expenses.invalid";

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${EMAIL_DOMAIN}`;
}

export function validateCredentials(
  username: string,
  password: string,
): string | null {
  if (!USERNAME_PATTERN.test(normalizeUsername(username))) {
    return "Username must be 3–30 characters: letters, numbers, dots, dashes or underscores.";
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}
