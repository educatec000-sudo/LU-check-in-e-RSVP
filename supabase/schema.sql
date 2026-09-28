-- =====================================================
-- Portal do Casal 💒 — Banco de dados (rode 1 vez no Supabase)
-- SQL Editor → New query → cole tudo → Run
-- =====================================================

-- ---------- perfil (1 por conta) ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz default now()
);

-- ---------- eventos (1 por casamento) ----------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null,                    -- "Ana & João"
  event_date date,
  event_time text,
  location text,
  rsvp_deadline date,                     -- data limite p/ confirmar
  companion_limit int default 4,          -- acompanhantes por convite
  rsvp_code text unique not null default substr(md5(random()::text), 1, 8),
  rsvp_open boolean default true,
  -- personalização do site (Fase 2)
  logo_url text,
  cover_url text,
  color_primary text default '#b8435c',
  color_bg text default '#fdf8f4',
  font_style text default 'classica',     -- classica | romantica | moderna
  welcome_message text,
  -- ponte com a assessoria (Fase 4)
  org_code text unique default upper(substr(md5(random()::text), 1, 6)),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- convidados (cada pessoa: adulto ou criança) ----------
create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  family_key text,                        -- agrupa a família/convite
  name text not null,
  is_child boolean default false,         -- 👶 criança?
  phone text,
  email text,
  rsvp_status text default 'pending',     -- pending | confirmed | declined
  rsvp_at timestamptz,
  notes text,
  -- check-in na portaria (Fase 4)
  table_no text,
  qr_code text,
  checked_in boolean default false,
  checked_in_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists guests_event_idx on guests(event_id);

-- ---------- cria o perfil automaticamente ao cadastrar ----------
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end; $$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- segurança: cada casal só vê o que é seu ----------
alter table profiles enable row level security;
alter table events enable row level security;
alter table guests enable row level security;

drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own events" on events;
create policy "own events" on events for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "own guests" on guests;
create policy "own guests" on guests for all
  using (event_id in (select id from events where owner_id = auth.uid()))
  with check (event_id in (select id from events where owner_id = auth.uid()));

-- ---------- permissões (sem isso o login não enxerga as tabelas) ----------
grant select, insert, update, delete on profiles, events, guests to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ---------- pasta para logos e capas (Fase 2) ----------
insert into storage.buckets (id, name, public)
  values ('event-media', 'event-media', true)
  on conflict (id) do nothing;

drop policy if exists "public read media" on storage.objects;
create policy "public read media" on storage.objects for select
  using (bucket_id = 'event-media');

drop policy if exists "auth upload media" on storage.objects;
create policy "auth upload media" on storage.objects for insert
  to authenticated with check (bucket_id = 'event-media');

drop policy if exists "auth update media" on storage.objects;
create policy "auth update media" on storage.objects for update
  to authenticated using (bucket_id = 'event-media');

drop policy if exists "auth delete media" on storage.objects;
create policy "auth delete media" on storage.objects for delete
  to authenticated using (bucket_id = 'event-media');
