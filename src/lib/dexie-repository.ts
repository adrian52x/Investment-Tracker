import { db } from "./db";
import type { TransactionRepository } from "./repository";
import type { AccountId, Transaction } from "./types";

export class DexieTransactionRepository implements TransactionRepository {
  async list(accountId: AccountId): Promise<Transaction[]> {
    return db.transactions.where("accountId").equals(accountId).toArray();
  }

  async add(tx: Transaction): Promise<void> {
    await db.transactions.add(tx);
  }

  async update(tx: Transaction): Promise<void> {
    await db.transactions.put(tx);
  }

  async remove(id: string): Promise<void> {
    await db.transactions.delete(id);
  }
}

export const repository: TransactionRepository = new DexieTransactionRepository();
