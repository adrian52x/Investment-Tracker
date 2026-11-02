alter table public.categories
  add column icon text check (char_length(icon) between 1 and 16);

-- Only these columns, so that a category can't be handed to another user.
grant update (name, icon) on public.categories to authenticated;
grant delete on public.categories to authenticated;

create policy "Users update their own categories" on public.categories
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete their own categories" on public.categories
  for delete to authenticated
  using ((select auth.uid()) = user_id);
