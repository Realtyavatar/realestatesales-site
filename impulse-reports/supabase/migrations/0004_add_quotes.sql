-- Quotes table — standalone quote PDFs, separate from inspection reports
create table if not exists quotes (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references jobs(id) on delete cascade,
  quote_number text not null default '',
  quote_date  date not null default current_date,
  expiry_date date,
  status      text not null default 'draft'
                check (status in ('draft','sent','accepted','declined')),
  items       jsonb not null default '[]'::jsonb,
  notes       text not null default '',
  terms       text not null default 'Payment due within 14 days of acceptance. Quoted prices are exclusive of GST unless stated. Quote valid for 30 days from issue date.',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists quotes_job_id_idx on quotes(job_id);

alter table quotes enable row level security;
create policy "authenticated full access" on quotes
  for all to authenticated using (true) with check (true);
