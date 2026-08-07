-- Migration for existing installs. Safe to re-run.
-- Adds: payment method on expenses, income tracking, per-category budgets.

create extension if not exists "pgcrypto";

alter table expenses add column if not exists payment_method text;

create table if not exists income (
  id uuid primary key default gen_random_uuid(),
  raw_input text not null,
  amount numeric not null,
  source text,
  received_on date not null,
  created_at timestamptz default now()
);

create table if not exists category_budgets (
  id uuid primary key default gen_random_uuid(),
  month date not null,
  category text not null,
  limit_amount numeric not null,
  created_at timestamptz default now()
);

create unique index if not exists category_budgets_month_category_unique
  on category_budgets (month, category);
create index if not exists income_received_on_idx on income (received_on desc);

alter table income disable row level security;
alter table category_budgets disable row level security;
