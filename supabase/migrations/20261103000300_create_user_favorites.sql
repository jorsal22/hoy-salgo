create table if not exists public.user_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('event', 'club')),
  item_id text not null check (length(trim(item_id)) > 0),
  item_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);

alter table public.user_favorites enable row level security;

grant select, insert, delete on public.user_favorites to authenticated;

drop policy if exists "Users can read their own favorites" on public.user_favorites;
create policy "Users can read their own favorites"
  on public.user_favorites
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can save their own favorites" on public.user_favorites;
create policy "Users can save their own favorites"
  on public.user_favorites
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove their own favorites" on public.user_favorites;
create policy "Users can remove their own favorites"
  on public.user_favorites
  for delete
  to authenticated
  using (auth.uid() = user_id);
