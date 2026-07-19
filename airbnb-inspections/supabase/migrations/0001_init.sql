-- Airbnb Checkout Inspections — initial schema
-- Single-user app: all tables are locked down to authenticated users via RLS.
-- Create your one login user in Supabase Dashboard > Authentication > Users,
-- and disable public signups (Authentication > Providers > Email > "Allow new users to sign up" OFF).

create type inspection_status as enum ('in_progress', 'complete');
create type damage_severity as enum ('minor', 'moderate', 'severe');

-- ---------------------------------------------------------------------------
-- Inspections
-- ---------------------------------------------------------------------------
create table inspections (
  id uuid primary key default gen_random_uuid(),
  property_name text not null default '',
  property_address text not null default '',
  inspection_type text not null default 'checkout', -- only 'checkout' today
  status inspection_status not null default 'in_progress',
  notes text not null default '', -- overall notes, appears in the PDF
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inspections_updated_at_idx on inspections (updated_at desc);

-- ---------------------------------------------------------------------------
-- Rooms (bedroom, bathroom, kitchen, living area — created from templates
-- when an inspection begins)
-- ---------------------------------------------------------------------------
create table rooms (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references inspections (id) on delete cascade,
  room_type text not null, -- bedroom | bathroom | kitchen | living
  name text not null default '',
  -- Checklist: [{ "id": "...", "label": "Linens changed...", "checked": false }]
  checklist jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rooms_inspection_id_idx on rooms (inspection_id, sort_order);

-- ---------------------------------------------------------------------------
-- Photos (attached to a room; taken_at is the capture time, which is also
-- burned into the image itself by the app)
-- ---------------------------------------------------------------------------
create table photos (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references inspections (id) on delete cascade,
  room_id uuid not null references rooms (id) on delete cascade,
  storage_path text not null, -- path in "photos" storage bucket
  caption text not null default '',
  taken_at timestamptz not null default now(),
  sort_order bigint not null default 0, -- capture-time epoch ms, so late (queued) uploads keep their order
  created_at timestamptz not null default now()
);

create index photos_room_id_idx on photos (room_id, sort_order);
create index photos_inspection_id_idx on photos (inspection_id);

-- ---------------------------------------------------------------------------
-- Damage flags (room-scoped or property-wide when room_id is null)
-- ---------------------------------------------------------------------------
create table damage_flags (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references inspections (id) on delete cascade,
  room_id uuid references rooms (id) on delete cascade, -- null = whole property
  description text not null default '',
  severity damage_severity not null default 'minor',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index damage_flags_inspection_id_idx on damage_flags (inspection_id, created_at);
create index damage_flags_room_id_idx on damage_flags (room_id);

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

create trigger inspections_updated_at before update on inspections for each row execute function set_updated_at();
create trigger rooms_updated_at before update on rooms for each row execute function set_updated_at();
create trigger damage_flags_updated_at before update on damage_flags for each row execute function set_updated_at();

-- Touch the parent inspection whenever a room / photo / damage flag changes so
-- the inspections list "most recent" ordering reflects real activity.
create or replace function touch_inspection()
returns trigger language plpgsql as $$
begin
  update inspections set updated_at = now()
  where id = coalesce(new.inspection_id, old.inspection_id);
  return coalesce(new, old);
end;
$$;

create trigger rooms_touch_inspection after insert or update or delete on rooms for each row execute function touch_inspection();
create trigger photos_touch_inspection after insert or update or delete on photos for each row execute function touch_inspection();
create trigger damage_flags_touch_inspection after insert or update or delete on damage_flags for each row execute function touch_inspection();

-- ---------------------------------------------------------------------------
-- Row Level Security — any authenticated user (there is exactly one: you)
-- ---------------------------------------------------------------------------
alter table inspections enable row level security;
alter table rooms enable row level security;
alter table photos enable row level security;
alter table damage_flags enable row level security;

create policy "authenticated full access" on inspections for all to authenticated using (true) with check (true);
create policy "authenticated full access" on rooms for all to authenticated using (true) with check (true);
create policy "authenticated full access" on photos for all to authenticated using (true) with check (true);
create policy "authenticated full access" on damage_flags for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Storage bucket (private; the app uses signed URLs)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

create policy "authenticated read app buckets" on storage.objects
  for select to authenticated using (bucket_id = 'photos');
create policy "authenticated write app buckets" on storage.objects
  for insert to authenticated with check (bucket_id = 'photos');
create policy "authenticated update app buckets" on storage.objects
  for update to authenticated using (bucket_id = 'photos');
create policy "authenticated delete app buckets" on storage.objects
  for delete to authenticated using (bucket_id = 'photos');
