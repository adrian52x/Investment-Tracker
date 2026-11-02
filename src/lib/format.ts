const LOCALE = "da-DK";

const money = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "DKK",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatMoney(value: number): string {
  return money.format(value);
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

export function formatMonth(month: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-01T00:00:00`));
}
