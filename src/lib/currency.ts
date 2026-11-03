// Keep the list in sync with supabase/functions/signup/index.ts.
export const CURRENCIES = ["EUR", "USD", "DKK", "MDL"] as const;

export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_NAMES: Record<Currency, string> = {
  EUR: "Euro",
  USD: "US dollar",
  DKK: "Danish krone",
  MDL: "Moldovan leu",
};

export function isCurrency(value: unknown): value is Currency {
  return CURRENCIES.includes(value as Currency);
}

/**
 * The currency chosen at signup, from the session's app_metadata. Accounts made
 * before that choice existed have none, and they all used DKK.
 */
export function userCurrency(appMetadata: Record<string, unknown> | undefined): Currency {
  const currency = appMetadata?.currency;
  return isCurrency(currency) ? currency : "DKK";
}
