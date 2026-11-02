alter table public.expenses
  add column note text check (note = btrim(note) and char_length(note) between 1 and 200);
