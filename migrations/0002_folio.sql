-- Site password + synced study notebook (one owner, many devices).
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

insert into folio_settings (id, password_hash)
values ('default', '37101d1f664aa8859d980580c38141d3413988f15c049d36702d80081b26fdb0')
on conflict (id) do nothing;

insert into folio_state (id, payload)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;
