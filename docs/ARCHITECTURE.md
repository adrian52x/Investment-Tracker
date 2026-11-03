# Architecture notes

A compact map of the app, so that a new session doesn't have to re-read every
file. Keep it in step with the code when something here changes.

## What it is

A phone-first PWA for logging personal expenses in one currency per user (DKK,
EUR, USD or MDL, chosen at signup). Each expense has an
amount, a payment method (card or cash), a category, an optional comment, and a date
(defaults to today in Copenhagen, can be set to any past date from 1 Jan 2026 on, never a future one). Users have a username and
password, their own categories with an optional emoji icon, a monthly overview,
and a yearly chart with a search of that year's comments.

Stack: Next.js 16.3 (App Router, React 19.2), Supabase (Postgres, Auth, one
edge function) through `@supabase/ssr`, Tailwind v4, and Vitest. Deployed on
Vercel.

## Next.js 16 specifics used here

- Middleware is `src/proxy.ts`, which exports `proxy` (not `middleware`).
- `searchParams` is a Promise and must be awaited.
- `useLinkStatus` from `next/link` drives the loading bar in `NavLink`.
- `app/template.tsx` remounts on every navigation, which replays the fade-in.
- Check `node_modules/next/dist/docs/` before using any other Next API.

## File map

```
src/proxy.ts                 Runs updateSession on everything except static assets
src/lib/supabase/proxy.ts    Refreshes the session cookie; sends signed-out users to /login
                             and signed-in users away from /login and /signup
src/lib/supabase/server.ts   createClient() for Server Components and actions
src/lib/actions.ts           All server actions: login, signup, logout,
                             add/update/deleteCategory, saveExpense, deleteExpense
src/lib/expenses.ts          Types and pure logic: parseAmount, pressKey (keypad),
                             amountToKeypad, lastEmoji, currentMonth, shiftMonth,
                             currentDate, isDate, isMonth/isYear, summarize, summarizeYear,
                             EXPENSE_COLUMNS + toExpense (row → Expense), containsPattern
src/lib/expenses.test.ts     Vitest tests for the above
src/lib/format.ts            da-DK money (whole units, in the given currency),
                             moneyParts, currencySymbol, dates, months, axis ticks
src/lib/currency.ts          CURRENCIES, isCurrency, userCurrency (app_metadata → Currency)
src/lib/currency.test.ts     Vitest tests for currency.ts and money formatting
src/lib/credentials.ts       Username/password rules and username → email mapping

src/app/page.tsx             "/" ?month=YYYY-MM. Loads that month's expenses and all
                             categories, renders <Overview>
src/app/year/page.tsx        "/year" ?year=YYYY&q=text. Loads the year in 1000-row pages
                             and, when q is set, the expenses whose comment contains it
                             (ilike). Renders <YearOverview>
src/app/categories/page.tsx  "/categories" renders <CategoryManager>
src/app/login, signup        Both render <AuthForm mode=...> (signup adds a currency select)
src/app/layout.tsx           Metadata, viewport, PWA manifest, <SWRegister>
src/app/globals.css          Colour tokens (light and dark), animations

src/components/Overview.tsx         Home: MonthPicker, total, card/cash tiles, category
                                    bars, filter chips, expense list (comment as the main text,
                                    category as a badge), "Add expense" button
src/components/ExpenseForm.tsx      Full-screen add/edit sheet with a date pill in the header
                                    (an invisible native date input over a label), its own
                                    number keypad, card/cash toggle, comment input, category chips,
                                    inline new category
src/components/CategoryManager.tsx  List of categories with inline editor (name + emoji)
src/components/MonthPicker.tsx      YearSelect over a 6×2 grid of month links, future months
                                    greyed out; monthHref
src/components/YearSelect.tsx       Year dropdown, FIRST_YEAR to this year; navigates to href(year)
src/components/YearOverview.tsx     YearSelect (keeps q), YearSearch, totals, YearChart,
                                    per-month list
src/components/YearSearch.tsx       GET <Form> for q (searches on submit, not while typing),
                                    match count and total, read-only result list
src/components/ExpenseRow.tsx       One expense line; a button when given onClick
src/components/Money.tsx            An amount with a smaller, muted currency symbol
src/components/YearChart.tsx        Hand-drawn grouped bar chart (card vs cash); tap a month
src/components/NavLink.tsx          Link with a progress bar while the next page loads
src/components/EmojiInput.tsx       Single-emoji input (keeps the last emoji typed)
src/components/PaymentIcon.tsx      Card and cash SVG icons
src/components/AuthForm.tsx         Login and signup form (useActionState)
src/components/SWRegister.tsx       Registers public/sw.js in production only

public/sw.js                 Caches /_next/static and /icons only, never pages.
                             On localhost it unregisters itself
supabase/migrations/         Schema (see below)
supabase/functions/signup/   Edge function that creates users with the service role
```

## Data model

```
categories  id, user_id (default auth.uid()), name (1–40, trimmed), icon (emoji, nullable),
            created_at. Unique per user on lower(name)
expenses    id, user_id, category_id, amount numeric(12,2) > 0,
            payment_method 'card' | 'cash', note (comment, 1–200 trimmed, nullable),
            spent_on date (default today in Europe/Copenhagen), created_at
```

- RLS on both tables: each user sees and changes only their own rows.
- `expenses (category_id, user_id)` references `categories (id, user_id)`, so an
  expense can't point at another user's category. Deleting a category that still
  has expenses fails with 23503, and the action turns that into a message.
- `authenticated` may update only `name` and `icon` on categories.
- Both tables are in a Supabase project shared with other apps (which have tables
  such as `rooms` and `visitor_events`), and it holds real data. Only touch
  `categories` and `expenses`. There is no separate dev database.

## Auth

Supabase Auth requires an email, so a username maps to
`<username>@expenses.invalid`. Signup goes through the `signup` edge function,
which creates the user already confirmed with `user_metadata.username` and
`app_metadata.currency`. The action then signs in. The rules live in both
`src/lib/credentials.ts` and the edge function, and the currency list in both
`src/lib/currency.ts` and the edge function, so change them together. There is
no password reset.

The currency is in `app_metadata` because users can't write it: changing it
would relabel every expense they logged, so only an admin (SQL on `auth.users`)
can. Pages read it from the claims with `userCurrency()` and pass it down as a
prop. Accounts from before signup asked for it have none, and count as DKK.
Expenses don't store a currency.

Every page calls `getClaims()` and redirects to `/login` without a session, and
so does every action (through `authedClient()`), because actions can be called
by a direct POST.

## Conventions

- Data loading happens in server page components. Mutations are server actions
  that return `{ error?: string }` and call `revalidatePath` (`"/", "layout"` for
  category changes, because several pages show categories).
- Client components call actions inside `useTransition` and show `error` inline.
- Money is summed in øre (integers) and then divided by 100, to avoid float drift.
  Display has no decimals. The keypad uses Danish notation ("125,50").
- Month and year params are validated, and future values fall back to the current one.
- Times are in Europe/Copenhagen (`currentDate`, `currentMonth`). After saving,
  the overview moves to the month the expense landed in.
- Styling: Tailwind with semantic tokens (`bg`, `surface`, `line`, `fg`, `muted`,
  `accent`, `on-accent`, `neg`, `series-card`, `series-cash`), a `max-w-lg`
  column, safe-area padding, and `tnum` for numbers.
- Comments explain *why*, briefly. Commit messages are short, imperative sentences.

## Commands

`npm run dev`, `npm test` (vitest run), `npm run lint`, `npm run build`.
Environment: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
in `.env.local`.
