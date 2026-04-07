create extension if not exists pgcrypto;

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  type text not null check (type in ('x_account', 'podcast', 'blog', 'upstream_feed')),
  name text not null,
  homepage_url text,
  external_handle text,
  config jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.creators (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete cascade,
  external_id text not null,
  display_name text not null,
  handle text,
  bio text,
  profile_url text,
  avatar_url text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, external_id)
);

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete restrict,
  creator_id uuid references public.creators(id) on delete set null,
  external_id text not null,
  kind text not null check (kind in ('tweet', 'podcast_episode', 'blog_post')),
  title text,
  slug text not null unique,
  url text not null,
  published_at timestamptz not null,
  language text not null default 'en',
  status text not null default 'published',
  raw_payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, external_id)
);

create table public.content_bodies (
  content_item_id uuid primary key references public.content_items(id) on delete cascade,
  plain_text text,
  html text,
  transcript_text text,
  markdown text,
  updated_at timestamptz not null default now()
);

create table public.content_metrics (
  content_item_id uuid primary key references public.content_items(id) on delete cascade,
  likes integer not null default 0,
  shares integer not null default 0,
  replies integer not null default 0,
  views integer,
  collected_at timestamptz not null default now()
);

create table public.content_summaries (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  locale text not null check (locale in ('en', 'zh')),
  summary text not null,
  bullets jsonb not null default '[]'::jsonb,
  model text,
  status text not null default 'completed',
  created_at timestamptz not null default now(),
  unique (content_item_id, locale)
);

create table public.content_translations (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  locale text not null check (locale in ('en', 'zh')),
  title text,
  plain_text text,
  transcript_text text,
  model text,
  status text not null default 'completed',
  created_at timestamptz not null default now(),
  unique (content_item_id, locale)
);

create table public.ingest_runs (
  id uuid primary key default gen_random_uuid(),
  provider_key text not null,
  status text not null check (status in ('running', 'completed', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  stats jsonb not null default '{}'::jsonb,
  error_text text
);

create index idx_content_items_published_at on public.content_items (published_at desc);
create index idx_content_items_kind_published_at on public.content_items (kind, published_at desc);
create index idx_content_items_source_id on public.content_items (source_id);
create index idx_creators_handle on public.creators (handle);
