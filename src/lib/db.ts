import Dexie, { type EntityTable } from "dexie";
import type { Transaction } from "./types";

export class InvestmentDB extends Dexie {
  transactions!: EntityTable<Transaction, "id">;

  constructor() {
    super("investment-tracker");
    this.version(1).stores({
      transactions: "id, accountId, date, [accountId+date]",
    });
  }
}

export const db = new InvestmentDB();
