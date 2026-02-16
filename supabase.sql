create extension if not exists "pgcrypto";

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time text not null,
  end_time text not null,
  break_minutes integer not null default 0,
  notes text,
  client_id uuid references clients(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists entries_date_idx on entries(date);

create table if not exists settings (
  id integer primary key,
  hourly_rate numeric not null default 40,
  currency text not null default '€'
);

insert into settings (id, hourly_rate, currency)
values (1, 40, '€')
on conflict (id) do nothing;

alter table clients disable row level security;
alter table entries disable row level security;
alter table settings disable row level security;
