import { db } from "./db";
import type { Transaction } from "./types";

interface BackupFile {
  app: "investment-tracker";
  version: 1;
  exportedAt: string;
  transactions: Transaction[];
}

export async function exportBackup(): Promise<void> {
  const transactions = await db.transactions.toArray();
  const backup: BackupFile = {
    app: "investment-tracker",
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `investment-tracker-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Replaces all existing data with the backup's contents. */
export async function importBackup(file: File): Promise<number> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  const backup = parsed as Partial<BackupFile>;
  if (backup.app !== "investment-tracker" || !Array.isArray(backup.transactions)) {
    throw new Error("That file doesn't look like an investment-tracker backup.");
  }
  const transactions = backup.transactions.filter(
    (t): t is Transaction =>
      typeof t === "object" &&
      t !== null &&
      typeof t.id === "string" &&
      (t.accountId === "saxo" || t.accountId === "revolut") &&
      typeof t.type === "string" &&
      typeof t.date === "string",
  );
  await db.transaction("rw", db.transactions, async () => {
    await db.transactions.clear();
    await db.transactions.bulkAdd(transactions);
  });
  return transactions.length;
}
