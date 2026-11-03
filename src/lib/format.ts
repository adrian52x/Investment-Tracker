import { CURRENCIES, type Currency } from "./currency";

const LOCALE = "da-DK";

const money = Object.fromEntries(
  CURRENCIES.map((currency) => [
    currency,
    new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency,
      // "$" rather than "US$".
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }),
  ]),
) as Record<Currency, Intl.NumberFormat>;

export function formatMoney(value: number, currency: Currency): string {
  return money[currency].format(value);
}

/** The number and the symbol apart, e.g. "2.000" and "MDL", to style them apart. */
export function moneyParts(
  value: number,
  currency: Currency,
): { amount: string; symbol: string } {
  const parts = money[currency].formatToParts(value);
  return {
    amount: parts
      // "literal" is the space between number and symbol.
      .filter(({ type }) => type !== "currency" && type !== "literal")
      .map(({ value }) => value)
      .join(""),
    symbol: parts.find(({ type }) => type === "currency")!.value,
  };
}

/** The symbol alone, e.g. "kr." or "€", to label the amount being typed. */
export function currencySymbol(currency: Currency): string {
  return moneyParts(0, currency).symbol;
}

/** Groups the whole part of a keypad amount, e.g. "1250,5" → "1.250,5". */
export function formatKeypadAmount(input: string): string {
  const [whole, decimals] = (input || "0").split(",");
  const grouped = new Intl.NumberFormat(LOCALE).format(Number(whole));
  return decimals === undefined ? grouped : `${grouped},${decimals}`;
}

/** A category's name, led by its emoji if it has one. */
export function formatCategory(name: string, icon: string | null): string {
  return icon ? `${icon} ${name}` : name;
}

export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${isoDate}T00:00:00`));
}

/** The month alone, without its year; "narrow" gives a single letter. */
export function formatMonthName(
  month: string,
  style: "long" | "short" | "narrow" = "long",
): string {
  return new Intl.DateTimeFormat("en-GB", { month: style }).format(
    new Date(`${month}-01T00:00:00`),
  );
}

/** An axis tick: in full below 10.000, compact on an axis that reaches it. */
export function formatAxisTick(value: number, top: number): string {
  return top >= 10_000 && value > 0
    ? `${value / 1000}k`
    : new Intl.NumberFormat(LOCALE).format(value);
}
