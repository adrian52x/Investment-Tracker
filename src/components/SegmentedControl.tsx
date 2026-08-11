"use client";

import { ACCOUNTS, ACCOUNT_IDS } from "@/lib/accounts";
import type { AccountId } from "@/lib/types";

export default function SegmentedControl({
  value,
  onChange,
}: {
  value: AccountId;
  onChange: (id: AccountId) => void;
}) {
  return (
    <div className="flex rounded-xl bg-line/60 p-1" role="tablist">
      {ACCOUNT_IDS.map((id) => {
        const selected = id === value;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(id)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              selected
                ? "bg-surface text-fg shadow-sm"
                : "text-muted active:text-fg"
            }`}
          >
            {ACCOUNTS[id].name}
          </button>
        );
      })}
    </div>
  );
}
