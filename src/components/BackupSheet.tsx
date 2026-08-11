"use client";

import { useRef, useState } from "react";
import Sheet from "./Sheet";
import { exportBackup, importBackup } from "@/lib/backup";

export default function BackupSheet({ onClose }: { onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImport(file: File) {
    setError(null);
    setMessage(null);
    try {
      const count = await importBackup(file);
      setMessage(`Restored ${count} transactions.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    }
  }

  return (
    <Sheet title="Backup" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">
          Data lives only on this device. Export a JSON backup regularly so a
          cleared browser cache doesn&apos;t lose everything.
        </p>
        <button
          onClick={() => exportBackup()}
          className="rounded-xl bg-accent py-3.5 text-base font-semibold text-white active:opacity-80"
        >
          Export backup
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-xl border border-line py-3.5 text-base font-semibold active:bg-line/40"
        >
          Import backup…
        </button>
        <p className="text-xs text-muted">
          Importing replaces all existing data with the backup&apos;s contents.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImport(file);
            e.target.value = "";
          }}
        />
        {message && (
          <p className="rounded-xl bg-pos/10 px-4 py-3 text-sm text-pos">{message}</p>
        )}
        {error && (
          <p className="rounded-xl bg-neg/10 px-4 py-3 text-sm text-neg">{error}</p>
        )}
      </div>
    </Sheet>
  );
}
