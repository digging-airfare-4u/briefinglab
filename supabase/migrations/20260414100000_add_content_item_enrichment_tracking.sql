alter table public.content_items
add column enrichment_attempted_at timestamptz,
add column enriched_at timestamptz,
add column enrichment_error text;
