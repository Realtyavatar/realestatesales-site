-- Impulse Reports — initial schema
-- Single-user app: all tables are locked down to authenticated users via RLS.
-- Create your one login user in Supabase Dashboard > Authentication > Users,
-- and disable public signups (Authentication > Providers > Email > "Allow new users to sign up" OFF).

create extension if not exists pg_trgm;

create type job_status as enum ('draft', 'in_progress', 'complete');
create type defect_severity as enum ('safety', 'non_compliance', 'recommendation');
create type variation_pricing as enum ('fixed', 'hourly');

-- ---------------------------------------------------------------------------
-- Settings (single row) — business details, logo, default checklist
-- ---------------------------------------------------------------------------
create table settings (
  id boolean primary key default true check (id), -- enforce single row
  business_name text not null default 'Impulse Electrical Contractors',
  rec_number text not null default 'REC 25266',
  abn text not null default '',
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  logo_path text, -- path in "logos" storage bucket
  -- Default checklist items copied onto every new board: [{ "label": "..." }]
  default_checklist jsonb not null default '[
    {"label": "RCD test"},
    {"label": "Connections torqued"},
    {"label": "Labelling compliant"}
  ]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Jobs
-- ---------------------------------------------------------------------------
create table jobs (
  id uuid primary key default gen_random_uuid(),
  client_name text not null default '',
  client_phone text not null default '',
  client_email text not null default '',
  site_address text not null default '',
  job_type text not null default 'general', -- surge_protection | switchboard_upgrade | safety_check | general
  job_date date not null default current_date,
  notes text not null default '',
  recommendations text not null default '', -- appears in the PDF recommendations section
  status job_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_updated_at_idx on jobs (updated_at desc);
-- Search by address / client name (case-insensitive substring search via ilike)
create index jobs_site_address_idx on jobs using gin (site_address gin_trgm_ops);
create index jobs_client_name_idx on jobs using gin (client_name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Boards (report sections within a job, e.g. MSB, GMB-1, Unit 14)
-- ---------------------------------------------------------------------------
create table boards (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  name text not null default '',      -- board name / ID
  location text not null default '',  -- location on site
  rating_amps text not null default '',
  fault_level text not null default '',
  -- Customisable checklist: [{ "id": "...", "label": "RCD test", "result": "pass" | "fail" | "na" | null }]
  checklist jsonb not null default '[]'::jsonb,
  has_defects boolean not null default false,
  defect_description text not null default '',
  defect_severity defect_severity,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index boards_job_id_idx on boards (job_id, sort_order);

-- The defects register is derived: every board with has_defects = true is a row
-- in the job's defects register (see the app + PDF), so it can never drift.

-- ---------------------------------------------------------------------------
-- Photos (attached to a board)
-- ---------------------------------------------------------------------------
create table photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  board_id uuid not null references boards (id) on delete cascade,
  storage_path text not null, -- path in "photos" storage bucket
  caption text not null default '',
  sort_order bigint not null default 0, -- capture-time epoch ms, so late (queued) uploads keep their order
  created_at timestamptz not null default now()
);

create index photos_board_id_idx on photos (board_id, sort_order);
create index photos_job_id_idx on photos (job_id);

-- ---------------------------------------------------------------------------
-- Variations / extra works with client sign-off
-- ---------------------------------------------------------------------------
create table variations (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  description text not null default '',
  pricing_mode variation_pricing not null default 'fixed',
  price_ex_gst numeric(12, 2),       -- when pricing_mode = 'fixed'
  hourly_rate_ex_gst numeric(12, 2), -- when pricing_mode = 'hourly'
  variation_date date not null default current_date,
  signer_name text not null default '',
  signed_at timestamptz,             -- set when the client signs; a variation is "signed" when this is non-null
  signature_path text,               -- path in "signatures" storage bucket (PNG of the canvas)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index variations_job_id_idx on variations (job_id, created_at);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
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

-- Touch the parent job whenever a board / photo / variation changes so the
-- jobs list "most recent" ordering reflects real activity.
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

-- ---------------------------------------------------------------------------
-- Row Level Security — any authenticated user (there is exactly one: you)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Storage buckets (all private; the app uses signed URLs)
-- ---------------------------------------------------------------------------
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

-- Single settings row so the app always has something to read
insert into settings (id) values (true);
