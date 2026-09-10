-- Folio 4 — pegar en el editor SQL de tu proyecto y darle Run
create table if not exists folio_settings (
  id text primary key,
  password_hash text not null,
  updated_at timestamptz not null default now()
);

create table if not exists folio_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table folio_settings enable row level security;
alter table folio_state enable row level security;

drop policy if exists folio_settings_select on folio_settings;
drop policy if exists folio_settings_insert on folio_settings;
drop policy if exists folio_settings_update on folio_settings;
drop policy if exists folio_state_select on folio_state;
drop policy if exists folio_state_insert on folio_state;
drop policy if exists folio_state_update on folio_state;

create policy folio_settings_select on folio_settings
  for select to anon, authenticated using (id = 'default');
create policy folio_settings_insert on folio_settings
  for insert to anon, authenticated with check (id = 'default');
create policy folio_settings_update on folio_settings
  for update to anon, authenticated using (id = 'default') with check (id = 'default');

create policy folio_state_select on folio_state
  for select to anon, authenticated using (id = 'default');
create policy folio_state_insert on folio_state
  for insert to anon, authenticated with check (id = 'default');
create policy folio_state_update on folio_state
  for update to anon, authenticated using (id = 'default') with check (id = 'default');

grant select, insert, update on table folio_settings to anon, authenticated;
grant select, insert, update on table folio_state to anon, authenticated;

insert into folio_settings (id, password_hash)
values ('default', '37101d1f664aa8859d980580c38141d3413988f15c049d36702d80081b26fdb0')
on conflict (id) do nothing;

insert into folio_state (id, payload)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;
