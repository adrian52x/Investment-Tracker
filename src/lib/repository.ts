import type { AccountId, Transaction } from "./types";

/**
 * Storage abstraction. The UI and calculation logic only depend on this
 * interface, so the Dexie implementation can be swapped for a Postgres-backed
 * API in v2 without touching anything else.
 */
export interface TransactionRepository {
  list(accountId: AccountId): Promise<Transaction[]>;
  add(tx: Transaction): Promise<void>;
  update(tx: Transaction): Promise<void>;
  remove(id: string): Promise<void>;
}
