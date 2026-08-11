# Build Prompt — Personal Investment Tracker PWA

Paste everything below into your AI coding agent (Claude Code / Cursor / Copilot) in VS Code.

---

## What I'm building

A **Progressive Web App (PWA)** to track my personal stock investments, installable on my iPhone via Safari's "Add to Home Screen" so it launches full-screen like a native app and works **fully offline**. All data is stored **locally on the device** for now; I want a clean path to swap in a Postgres backend in v2 without rewriting the app.

Keep it **simple, intuitive, and minimalist** — good taste, generous whitespace, number-forward, no clutter.

## Tech stack

- **Next.js (App Router) + TypeScript + React**
- **Tailwind CSS** for styling
- **Dexie.js** (IndexedDB wrapper) for local storage
- **PWA**: manifest + service worker (use `@serwist/next` or `next-pwa`) for installability and offline caching
- Keep dependencies minimal. No auth, no backend in v1.

## Core architecture (important)

**Transactions are the single source of truth. Everything else is derived.**

Do **not** store a mutable `balance` field. Instead, store an append-only log of transactions, and compute cash balance, holdings, and profit/loss by reducing over that log (event sourcing). Editing or deleting a transaction must recompute all derived values automatically.

**Data access goes through a repository interface**, so the IndexedDB implementation can be replaced by a Postgres-backed API in v2 without touching UI or business logic:

```ts
interface TransactionRepository {
  list(accountId: AccountId): Promise<Transaction[]>;
  add(tx: Transaction): Promise<void>;
  update(tx: Transaction): Promise<void>;
  remove(id: string): Promise<void>;
}
```

Implement `DexieTransactionRepository` now. Keep all calculation logic in **pure functions** (no I/O) so it's shared and testable regardless of storage.

## Accounts (the two tabs)

Two fixed accounts, switchable via a segmented control at the top:

```ts
type AccountId = 'saxo' | 'revolut';

interface Account {
  id: AccountId;
  name: string;        // "SaxoBank" | "Revolut"
  subtitle?: string;   // "Aktiesparekonto" for saxo
  currency: 'DKK' | 'USD';
  locale: string;      // 'da-DK' | 'en-US'
  supportsTax: boolean; // true for saxo, false for revolut
}
```

- **SaxoBank**: DKK, aktiesparekonto, `supportsTax: true`.
- **Revolut**: USD, `supportsTax: false`.

Each account is self-contained in its own currency — no currency conversion anywhere. Format all money with `Intl.NumberFormat(account.locale, { style: 'currency', currency: account.currency })`.

## Data model

```ts
type TransactionType =
  | 'deposit'      // add cash to the account
  | 'withdrawal'   // remove cash from the account
  | 'buy'          // buy shares (spends cash)
  | 'sell'         // sell shares (adds cash, realizes P/L)
  | 'dividend'     // cash dividend received
  | 'tax';         // tax paid — SaxoBank only (17% ASK tax), entered manually

interface Transaction {
  id: string;            // uuid
  accountId: AccountId;
  type: TransactionType;
  date: string;          // ISO date, when it happened
  createdAt: string;     // ISO timestamp, when recorded
  note?: string;

  // For deposit | withdrawal | dividend | tax:
  amount?: number;       // positive cash amount

  // For buy | sell:
  ticker?: string;       // e.g. "AAPL", "NOVO-B"
  quantity?: number;     // number of shares
  pricePerShare?: number;
  fee?: number;          // trade fee (optional, default 0)
}
```

Notes:
- For **buy/sell**, the cash total is derived: `quantity * pricePerShare` (± fee). Don't store a separate `amount` for those.
- The `tax` type only appears for SaxoBank. Hide it in the Revolut UI.

## Derived values (pure functions)

Process an account's transactions in **date order**, maintaining a per-ticker running `{ quantity, cost }` map, and produce:

```ts
interface Holding {
  ticker: string;
  quantity: number;   // shares currently held
  totalCost: number;  // remaining average-cost basis of held shares
  avgCost: number;    // totalCost / quantity
}

interface AccountSummary {
  cashBalance: number;    // the primary "balance" number
  invested: number;       // sum of holdings' totalCost (money currently in the market, at cost)
  totalDeposited: number;
  totalWithdrawn: number;
  realizedPnl: number;    // profit/loss from sells
  totalDividends: number;
  totalFees: number;
  totalTaxPaid: number;   // saxo only
  holdings: Holding[];
}
```

**Reducer rules** (average-cost basis):

- `deposit`:    `cash += amount`; `totalDeposited += amount`
- `withdrawal`: `cash -= amount`; `totalWithdrawn += amount`
- `dividend`:   `cash += amount`; `totalDividends += amount`
- `tax`:        `cash -= amount`; `totalTaxPaid += amount`
- `buy`:
  - `cost = quantity * pricePerShare + fee`
  - `cash -= cost`; `totalFees += fee`
  - holding: `quantity += quantity`, `totalCost += cost`
- `sell`:
  - `proceeds = quantity * pricePerShare - fee`
  - `avgCost = holding.totalCost / holding.quantity`
  - `costOfSold = avgCost * quantity`
  - `realizedPnl += proceeds - costOfSold`
  - `cash += proceeds`; `totalFees += fee`
  - holding: `quantity -= quantity`, `totalCost -= costOfSold`
- Drop holdings whose quantity reaches 0 from the holdings list.

`cashBalance` is the final `cash`. This is the number the user thinks of as "balance."

Support **partial sells** (buy 10, sell 5) via quantity. Validate that you can't sell more shares than held, or withdraw more cash than the balance (show a friendly inline error).

## Screens / UX

Mobile-first (this runs on an iPhone). Respect iOS safe-area insets.

**1. Overview (home, per selected account)**
- Segmented control at top: **SaxoBank ⇄ Revolut**.
- Hero: **Cash balance**, large, in the account's currency.
- Secondary line: Invested (at cost) and Total (cash + invested).
- A compact row/grid of stat chips: Deposited, Withdrawn, Realized P/L, Dividends, Fees — and **Tax paid** only for SaxoBank.
- **Holdings** section: list of current holdings (ticker, quantity, avg cost, total cost).
- **Recent transactions**: last ~5, with a link to full history.
- Floating **"+"** button to add a transaction.

**2. Add / Edit Transaction** (modal or route)
- First pick the **type**; then show only the relevant fields.
- Buy/Sell: ticker, quantity, price per share, fee, date, note.
- Deposit/Withdrawal/Dividend/Tax: amount, date, note.
- Same form handles edit and delete.

**3. Transaction history**
- Full chronological log for the account, filterable by type.
- Tap a row to edit or delete. Deletes/edits recompute the overview automatically.

**Extra (recommended, since data is local-only):**
- **Export / Import JSON** — one-tap backup of all data and restore, so a cleared browser cache doesn't lose everything.

## Design direction

- Minimalist modern-fintech feel (think Mercury / Revolut / Linear): clean, calm, confident.
- Near-white light theme (offer a dark theme too). Neutral greys, **one** accent color.
- Font: Inter or system font. Use `font-variant-numeric: tabular-nums` for all figures so columns align.
- Subtle 1px dividers and softly rounded cards — avoid heavy shadows and gradients.
- **Green** for positive P/L, **red** for negative — and nowhere else.
- Big tap targets, comfortable spacing, no visual noise.

## PWA requirements

- `manifest.json`: name, short_name, 192px + 512px icons, `display: "standalone"`, portrait orientation, theme + background color.
- iOS meta tags for full-screen: `apple-touch-icon`, `apple-mobile-web-app-capable`, status bar style.
- Service worker caches the app shell so it loads and works **offline**. All data is local, so the app is fully functional with no network.

## v2 (build with this in mind, don't implement now)

- Swap `DexieTransactionRepository` for an API-backed repo talking to **Postgres**; keep the pure calculation functions unchanged.
- Optional: live stock prices for **unrealized** P/L and real portfolio value.
- Optional: PIN / biometric lock.

## Acceptance test (must pass)

Given SaxoBank (DKK) with these transactions in order, ignoring fees:

1. Deposit 10,000 → cashBalance **10,000**
2. Buy 1 share @ 3,000 → cashBalance **7,000**, holding {qty 1, cost 3,000}
3. Sell 1 share @ 6,000 → cashBalance **13,000**, realizedPnl **+3,000**, no holdings
4. Withdrawal 5,000 → cashBalance **8,000**

Final state: cashBalance **8,000**, realizedPnl **+3,000**, totalDeposited **10,000**, totalWithdrawn **5,000**. Include this as an automated unit test over the reducer.

---

**Start by**: scaffolding the Next.js + TypeScript + Tailwind project, defining the types and the pure reducer (with the acceptance test), then the Dexie repository, then the UI. Ask me if any business rule is ambiguous before guessing.
