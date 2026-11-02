"use client";

import { useState, useTransition } from "react";
import Chevron from "./Chevron";
import EmojiInput from "./EmojiInput";
import NavLink from "./NavLink";
import {
  addCategory,
  deleteCategory,
  updateCategory,
  type ActionResult,
} from "@/lib/actions";
import type { Category } from "@/lib/expenses";
import { formatCategory } from "@/lib/format";

const NEW = "new";

function CategoryEditor({
  category,
  onDone,
}: {
  /** When set, the form edits this category instead of creating one. */
  category?: Category;
  onDone: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else onDone();
    });
  }

  function handleSave() {
    if (!name.trim()) return;
    run(() =>
      category
        ? updateCategory(category.id, name, icon)
        : addCategory(name, icon),
    );
  }

  function handleDelete() {
    if (!category) return;
    setConfirmDelete(false);
    run(() => deleteCategory(category.id));
  }

  return (
    <form
      className="flex flex-col gap-3 px-4 py-3"
      onSubmit={(event) => {
        event.preventDefault();
        handleSave();
      }}
    >
      <div className="flex gap-2">
        <EmojiInput value={icon} onChange={setIcon} />
        <input
          aria-label="Category name"
          placeholder="Category name"
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 text-base outline-none focus:border-accent"
          maxLength={40}
          enterKeyHint="done"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-neg/10 px-4 py-2 text-sm text-neg"
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        {category &&
          (confirmDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="rounded-lg py-2 text-sm font-semibold text-neg active:opacity-60"
            >
              Confirm delete
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rounded-lg py-2 text-sm text-neg active:opacity-60"
            >
              Delete
            </button>
          ))}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg px-2 py-2 text-sm text-muted active:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending || !name.trim()}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent active:opacity-80 disabled:opacity-40"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default function CategoryManager({
  categories,
}: {
  categories: Category[];
}) {
  // The category id being edited, NEW for the add form, or null for neither.
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-lg px-5 pt-[max(env(safe-area-inset-top),0.5rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]">
      <header className="flex items-center gap-1 py-2">
        <NavLink
          href="/"
          aria-label="Back to overview"
          className="-ml-2 rounded-full p-2.5 text-muted active:bg-line/60"
        >
          <Chevron direction="left" />
        </NavLink>
        <h1 className="text-base font-semibold">Categories</h1>
      </header>

      {categories.length === 0 ? (
        <p className="mt-2 rounded-xl border border-line bg-surface px-4 py-8 text-center text-sm text-muted">
          No categories yet.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-surface">
          {categories.map((category) => (
            <li key={category.id}>
              {editing === category.id ? (
                <CategoryEditor
                  category={category}
                  onDone={() => setEditing(null)}
                />
              ) : (
                <button
                  onClick={() => setEditing(category.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-line/40"
                >
                  <span className="min-w-0 flex-1 truncate text-base font-medium">
                    {formatCategory(category.name, category.icon)}
                  </span>
                  <span className="shrink-0 text-sm text-muted">Edit</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3">
        {editing === NEW ? (
          <div className="rounded-xl border border-line bg-surface">
            <CategoryEditor onDone={() => setEditing(null)} />
          </div>
        ) : (
          <button
            onClick={() => setEditing(NEW)}
            className="w-full rounded-xl border border-dashed border-muted px-4 py-3 text-sm font-medium text-muted"
          >
            + New category
          </button>
        )}
      </div>
    </main>
  );
}
