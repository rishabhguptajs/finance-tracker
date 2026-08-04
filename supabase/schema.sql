-- Personal Expense Tracker schema
-- Run this in the Supabase SQL editor for your project.

create extension if not exists "pgcrypto";

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  raw_input text not null,
  amount numeric not null,
  merchant text,
  category text not null,
  spent_on date not null,
  created_at timestamptz default now()
);

create table if not exists budget (
  id uuid primary key default gen_random_uuid(),
  month date not null, -- first day of month, e.g. 2026-08-01
  limit_amount numeric not null,
  created_at timestamptz default now()
);

create unique index if not exists budget_month_unique on budget (month);
create index if not exists expenses_spent_on_idx on expenses (spent_on desc);
create index if not exists expenses_category_idx on expenses (category);

-- Single-user app: RLS disabled for v1. Enable + add policies if you add auth later.
alter table expenses disable row level security;
alter table budget disable row level security;
