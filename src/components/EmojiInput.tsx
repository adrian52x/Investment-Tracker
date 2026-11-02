"use client";

import { lastEmoji } from "@/lib/expenses";

/** Holds one emoji: picking another replaces it, and other typing is ignored. */
export default function EmojiInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (emoji: string) => void;
}) {
  return (
    <input
      aria-label="Category icon (optional)"
      placeholder="Icon"
      className="w-14 shrink-0 rounded-xl border border-line bg-surface px-1 py-2.5 text-center text-base outline-none placeholder:text-sm focus:border-accent"
      autoComplete="off"
      enterKeyHint="done"
      value={value}
      onChange={(event) => onChange(lastEmoji(event.target.value))}
    />
  );
}
