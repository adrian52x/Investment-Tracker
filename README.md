# Expense tracker

A phone-first app for logging personal expenses in DKK. Each user has a username
and password, their own categories, and a monthly overview. Built with Next.js
and Supabase.

## Setup

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

Then run:

```
npm install
npm run dev
```

Set the same two variables on your host when deploying.

`npm test` runs the unit tests, and `npm run lint` runs ESLint.

## Backend

- `supabase/migrations/` holds the `categories` and `expenses` tables. Row-level
  security limits each user to their own rows.
- `supabase/functions/signup/` creates accounts. Supabase Auth needs an email, so
  a username is stored as `<username>@expenses.invalid`, confirmed on creation and
  never mailed. The username and password rules also live in
  `src/lib/credentials.ts`; change both together.

There is no email address on an account, so a forgotten password can't be reset
by the user.
