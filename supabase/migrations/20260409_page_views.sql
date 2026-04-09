-- Anonymous page view tracking for market intelligence
create table if not exists public.page_views (
  id          bigserial primary key,
  visitor_id  text not null,          -- anonymous uuid from cookie
  path        text not null,          -- e.g. /about, /services
  referrer    text,                   -- document.referrer
  utm_source  text,
  utm_medium  text,
  utm_campaign text,
  country     text,                   -- from CF-IPCountry or x-vercel-ip-country header
  device_type text,                   -- mobile / tablet / desktop (derived from UA)
  browser     text,                   -- chrome / safari / firefox / other
  viewed_at   timestamptz not null default now()
);

create index if not exists page_views_visitor_idx  on public.page_views (visitor_id);
create index if not exists page_views_path_idx     on public.page_views (path);
create index if not exists page_views_viewed_at_idx on public.page_views (viewed_at desc);

-- Read-only for anon (insert only via service role from API)
alter table public.page_views enable row level security;
create policy "no anon select" on public.page_views for select using (false);
