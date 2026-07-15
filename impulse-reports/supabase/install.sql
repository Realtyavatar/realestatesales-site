-- ============================================================
-- IMPULSE REPORTS — one-shot database install
-- Paste this whole file into Supabase SQL Editor and press Run.
--
-- Safe to run more than once: it clears any previous / half-built
-- Impulse Reports tables first (fine on day one — do NOT run it
-- later once you have real job data in here).
-- ============================================================

-- ---- clean slate (removes anything a previous attempt created)
drop table if exists photos cascade;
drop table if exists variations cascade;
drop table if exists quotes cascade;      -- from an earlier agent experiment
drop table if exists boards cascade;
drop table if exists jobs cascade;
drop table if exists settings cascade;
drop type if exists job_status cascade;
drop type if exists defect_severity cascade;
drop type if exists variation_pricing cascade;

drop policy if exists "authenticated read app buckets" on storage.objects;
drop policy if exists "authenticated write app buckets" on storage.objects;
drop policy if exists "authenticated update app buckets" on storage.objects;
drop policy if exists "authenticated delete app buckets" on storage.objects;

-- ---- schema
create extension if not exists pg_trgm;

create type job_status as enum ('draft', 'in_progress', 'complete');
create type defect_severity as enum ('safety', 'non_compliance', 'recommendation');
create type variation_pricing as enum ('fixed', 'hourly');

create table settings (
  id boolean primary key default true check (id),
  business_name text not null default 'Impulse Electrical Contractors',
  rec_number text not null default 'REC 25266',
  abn text not null default '',
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  logo_path text,
  default_checklist jsonb not null default '[
    {"label": "RCD test"},
    {"label": "Connections torqued"},
    {"label": "Labelling compliant"}
  ]'::jsonb,
  updated_at timestamptz not null default now()
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  client_name text not null default '',
  client_phone text not null default '',
  client_email text not null default '',
  site_address text not null default '',
  job_type text not null default 'general',
  job_date date not null default current_date,
  notes text not null default '',
  recommendations text not null default '',
  status job_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_updated_at_idx on jobs (updated_at desc);
create index jobs_site_address_idx on jobs using gin (site_address gin_trgm_ops);
create index jobs_client_name_idx on jobs using gin (client_name gin_trgm_ops);

create table boards (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  name text not null default '',
  location text not null default '',
  rating_amps text not null default '',
  fault_level text not null default '',
  checklist jsonb not null default '[]'::jsonb,
  has_defects boolean not null default false,
  defect_description text not null default '',
  defect_severity defect_severity,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index boards_job_id_idx on boards (job_id, sort_order);

create table photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  board_id uuid not null references boards (id) on delete cascade,
  storage_path text not null,
  caption text not null default '',
  sort_order bigint not null default 0,
  created_at timestamptz not null default now()
);

create index photos_board_id_idx on photos (board_id, sort_order);
create index photos_job_id_idx on photos (job_id);

create table variations (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  description text not null default '',
  pricing_mode variation_pricing not null default 'fixed',
  price_ex_gst numeric(12, 2),
  hourly_rate_ex_gst numeric(12, 2),
  variation_date date not null default current_date,
  signer_name text not null default '',
  signed_at timestamptz,
  signature_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index variations_job_id_idx on variations (job_id, created_at);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger settings_updated_at before update on settings for each row execute function set_updated_at();
create trigger jobs_updated_at before update on jobs for each row execute function set_updated_at();
create trigger boards_updated_at before update on boards for each row execute function set_updated_at();
create trigger variations_updated_at before update on variations for each row execute function set_updated_at();

create or replace function touch_job()
returns trigger language plpgsql as $$
begin
  update jobs set updated_at = now()
  where id = coalesce(new.job_id, old.job_id);
  return coalesce(new, old);
end;
$$;

create trigger boards_touch_job after insert or update or delete on boards for each row execute function touch_job();
create trigger photos_touch_job after insert or update or delete on photos for each row execute function touch_job();
create trigger variations_touch_job after insert or update or delete on variations for each row execute function touch_job();

-- ---- security: only your login can touch anything
alter table settings enable row level security;
alter table jobs enable row level security;
alter table boards enable row level security;
alter table photos enable row level security;
alter table variations enable row level security;

create policy "authenticated full access" on settings for all to authenticated using (true) with check (true);
create policy "authenticated full access" on jobs for all to authenticated using (true) with check (true);
create policy "authenticated full access" on boards for all to authenticated using (true) with check (true);
create policy "authenticated full access" on photos for all to authenticated using (true) with check (true);
create policy "authenticated full access" on variations for all to authenticated using (true) with check (true);

-- ---- private storage buckets
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false), ('signatures', 'signatures', false), ('logos', 'logos', false)
on conflict (id) do nothing;

create policy "authenticated read app buckets" on storage.objects
  for select to authenticated using (bucket_id in ('photos', 'signatures', 'logos'));
create policy "authenticated write app buckets" on storage.objects
  for insert to authenticated with check (bucket_id in ('photos', 'signatures', 'logos'));
create policy "authenticated update app buckets" on storage.objects
  for update to authenticated using (bucket_id in ('photos', 'signatures', 'logos'));
create policy "authenticated delete app buckets" on storage.objects
  for delete to authenticated using (bucket_id in ('photos', 'signatures', 'logos'));

insert into settings (id) values (true) on conflict (id) do nothing;

-- ---- one example job so the app isn't empty
with new_job as (
  insert into jobs (client_name, client_phone, client_email, site_address, job_type, job_date, notes, recommendations, status)
  values (
    'Example Client — Jane Citizen',
    '0400 000 000',
    'jane@example.com',
    '14 Sample Street, Melbourne VIC 3000',
    'safety_check',
    current_date,
    'EXAMPLE JOB — created automatically so you can see how Impulse Reports works. Open it, poke around, then delete it.',
    'Replace the aged RCD on the main switchboard within 30 days. Book a follow-up thermal scan of GMB-1 in 12 months.',
    'in_progress'
  )
  returning id
),
board_msb as (
  insert into boards (job_id, name, location, rating_amps, fault_level, checklist, has_defects, defect_description, defect_severity, sort_order)
  select
    id, 'MSB', 'Ground floor switch room', '250', '10kA',
    '[
      {"id": "c1", "label": "RCD test", "result": "fail"},
      {"id": "c2", "label": "Connections torqued", "result": "pass"},
      {"id": "c3", "label": "Labelling compliant", "result": "pass"}
    ]'::jsonb,
    true, 'RCD on circuit 4 failed trip-time test (>300ms). Requires replacement.', 'safety', 0
  from new_job
  returning job_id
)
insert into boards (job_id, name, location, rating_amps, fault_level, checklist, has_defects, sort_order)
select
  job_id, 'GMB-1', 'Level 1 riser cupboard', '100', '6kA',
  '[
    {"id": "c1", "label": "RCD test", "result": "pass"},
    {"id": "c2", "label": "Connections torqued", "result": "pass"},
    {"id": "c3", "label": "Labelling compliant", "result": "na"}
  ]'::jsonb,
  false, 1
from board_msb;

-- Done. Next: Authentication → Users → add yourself, then turn off signups.
