create table public.daily_summaries (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  locale text not null default 'zh',
  summary text not null,
  bullets jsonb not null default '[]'::jsonb,
  highlights jsonb default '[]'::jsonb,
  model text,
  status text not null default 'completed',
  generated_at timestamptz not null default now()
);

create index idx_daily_summaries_date on public.daily_summaries (date desc);
