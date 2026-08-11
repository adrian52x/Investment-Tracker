"use client";

import { useSyncExternalStore } from "react";
import { ACCOUNTS } from "./accounts";
import type { Account, AccountId } from "./types";

const STORAGE_KEY = "invest.selectedAccount";
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): AccountId {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "revolut" ? "revolut" : "saxo";
}

function getServerSnapshot(): AccountId {
  return "saxo";
}

export function setSelectedAccount(id: AccountId): void {
  localStorage.setItem(STORAGE_KEY, id);
  listeners.forEach((l) => l());
}

export function useAccount(): {
  account: Account;
  accountId: AccountId;
  setAccountId: (id: AccountId) => void;
  ready: boolean;
} {
  const accountId = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    account: ACCOUNTS[accountId],
    accountId,
    setAccountId: setSelectedAccount,
    ready: true,
  };
}
