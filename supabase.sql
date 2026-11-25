-- Hörtagebuch: eigene Tabelle, kein Konflikt mit anderen Tabellen im Projekt
create table if not exists public.hoertagebuch_kv (
  grp        text        not null default 'drei-fragezeichen-freunde',
  key        text        not null,
  value      jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (grp, key)
);

alter table public.hoertagebuch_kv enable row level security;

drop policy if exists "hoertagebuch lesen"      on public.hoertagebuch_kv;
drop policy if exists "hoertagebuch einfuegen"  on public.hoertagebuch_kv;
drop policy if exists "hoertagebuch aendern"    on public.hoertagebuch_kv;
drop policy if exists "hoertagebuch loeschen"   on public.hoertagebuch_kv;

create policy "hoertagebuch lesen"     on public.hoertagebuch_kv for select to anon, authenticated using (true);
create policy "hoertagebuch einfuegen" on public.hoertagebuch_kv for insert to anon, authenticated with check (true);
create policy "hoertagebuch aendern"   on public.hoertagebuch_kv for update to anon, authenticated using (true) with check (true);
create policy "hoertagebuch loeschen"  on public.hoertagebuch_kv for delete to anon, authenticated using (true);

-- Echtzeit aktivieren
alter table public.hoertagebuch_kv replica identity full;
do $$
begin
  alter publication supabase_realtime add table public.hoertagebuch_kv;
exception when duplicate_object then null;
end $$;
