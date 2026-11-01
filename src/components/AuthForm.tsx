"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup, type AuthState } from "@/lib/actions";

const COPY = {
  login: {
    title: "Log in",
    submit: "Log in",
    passwordAutoComplete: "current-password",
    switchText: "New here?",
    switchLabel: "Create an account",
    switchHref: "/signup",
  },
  signup: {
    title: "Create account",
    submit: "Create account",
    passwordAutoComplete: "new-password",
    switchText: "Already have an account?",
    switchLabel: "Log in",
    switchHref: "/login",
  },
};

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const copy = COPY[mode];
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    mode === "login" ? login : signup,
    {},
  );

  const inputCls =
    "w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-base outline-none focus:border-accent";
  const labelCls = "mb-1.5 block text-sm font-medium text-muted";

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <h1 className="text-center text-sm font-semibold text-muted">Expenses</h1>
      <p className="mt-1 mb-8 text-center text-2xl font-bold">{copy.title}</p>

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label htmlFor="username" className={labelCls}>
            Username
          </label>
          <input
            id="username"
            name="username"
            className={inputCls}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className={labelCls}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className={inputCls}
            autoComplete={copy.passwordAutoComplete}
            minLength={mode === "signup" ? 6 : undefined}
            required
          />
          {mode === "signup" && (
            <p className="mt-1.5 text-sm text-muted">At least 6 characters</p>
          )}
        </div>

        {state.error && (
          <p role="alert" className="rounded-xl bg-neg/10 px-4 py-3 text-sm text-neg">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-xl bg-accent py-4 text-base font-semibold text-on-accent active:opacity-80 disabled:opacity-60"
        >
          {pending ? "One moment…" : copy.submit}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {copy.switchText}{" "}
        <Link href={copy.switchHref} className="font-medium text-accent">
          {copy.switchLabel}
        </Link>
      </p>
    </main>
  );
}
