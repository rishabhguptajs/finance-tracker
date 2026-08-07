-- Personal Expense Tracker schema
-- Fresh install: run this whole file in the Supabase SQL editor.
-- Already have data? Run supabase/migrations/002_income_budgets_payment.sql instead.

create extension if not exists "pgcrypto";

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  raw_input text not null,
  amount numeric not null,
  merchant text,
  category text not null,
  spent_on date not null,
  payment_method text,
  created_at timestamptz default now()
);

create table if not exists income (
  id uuid primary key default gen_random_uuid(),
  raw_input text not null,
  amount numeric not null,
  source text,
  received_on date not null,
  created_at timestamptz default now()
);

create table if not exists budget (
  id uuid primary key default gen_random_uuid(),
  month date not null, -- first day of month, e.g. 2026-08-01
  limit_amount numeric not null,
  created_at timestamptz default now()
);

-- Per-category limits, scoped to a month. A category with no row here is uncapped.
create table if not exists category_budgets (
  id uuid primary key default gen_random_uuid(),
  month date not null, -- first day of month
  category text not null,
  limit_amount numeric not null,
  created_at timestamptz default now()
);

create unique index if not exists budget_month_unique on budget (month);
create unique index if not exists category_budgets_month_category_unique
  on category_budgets (month, category);
create index if not exists expenses_spent_on_idx on expenses (spent_on desc);
create index if not exists expenses_category_idx on expenses (category);
create index if not exists income_received_on_idx on income (received_on desc);

-- Single-user app: RLS disabled for v1. Enable + add policies if you add auth later.
alter table expenses disable row level security;
alter table income disable row level security;
alter table budget disable row level security;
alter table category_budgets disable row level security;
