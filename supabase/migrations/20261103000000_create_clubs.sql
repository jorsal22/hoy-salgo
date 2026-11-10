create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  city text not null,
  neighborhood text,
  address text,
  phone text,
  logo_url text,
  instagram_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.clubs
  add column if not exists address text,
  add column if not exists phone text,
  add column if not exists logo_url text;

create unique index if not exists clubs_name_city_unique
  on public.clubs (lower(name), lower(city));

alter table public.clubs enable row level security;

grant select on public.clubs to anon, authenticated;
grant insert, update, delete on public.clubs to authenticated;

drop policy if exists "Anyone can read clubs" on public.clubs;
create policy "Anyone can read clubs"
  on public.clubs
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Configured admin can insert clubs" on public.clubs;
create policy "Configured admin can insert clubs"
  on public.clubs
  for insert
  to authenticated
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'salsamendi.jorge@gmail.com'
    and created_by = auth.uid()
  );

drop policy if exists "Configured admin can update clubs" on public.clubs;
create policy "Configured admin can update clubs"
  on public.clubs
  for update
  to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'salsamendi.jorge@gmail.com')
  with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'salsamendi.jorge@gmail.com');

drop policy if exists "Configured admin can delete clubs" on public.clubs;
create policy "Configured admin can delete clubs"
  on public.clubs
  for delete
  to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'salsamendi.jorge@gmail.com');

drop policy if exists "Configured admin can insert events" on public.events;
create policy "Configured admin can insert events"
  on public.events
  for insert
  to authenticated
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'salsamendi.jorge@gmail.com'
    and created_by = auth.uid()
  );
