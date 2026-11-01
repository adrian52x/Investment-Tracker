create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (name = btrim(name) and char_length(name) between 1 and 40),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create unique index categories_user_id_lower_name_key
  on public.categories (user_id, lower(name));

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null,
  amount numeric(12, 2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('card', 'cash')),
  spent_on date not null default (now() at time zone 'Europe/Copenhagen')::date,
  created_at timestamptz not null default now(),
  -- Composite key stops an expense pointing at another user's category. NO ACTION
  -- rather than RESTRICT so that deleting a user can cascade through both tables.
  foreign key (category_id, user_id) references public.categories (id, user_id)
);

create index expenses_user_id_spent_on_idx
  on public.expenses (user_id, spent_on desc, created_at desc);

create index expenses_category_id_user_id_idx
  on public.expenses (category_id, user_id);

alter table public.categories enable row level security;
alter table public.expenses enable row level security;

revoke all on public.categories, public.expenses from anon;
revoke all on public.categories, public.expenses from authenticated;
grant select, insert on public.categories to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;

create policy "Users read their own categories" on public.categories
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users add their own categories" on public.categories
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users read their own expenses" on public.expenses
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users add their own expenses" on public.expenses
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update their own expenses" on public.expenses
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete their own expenses" on public.expenses
  for delete to authenticated
  using ((select auth.uid()) = user_id);
