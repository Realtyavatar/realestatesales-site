-- Seed: one example job so the app isn't empty on first login.
-- Safe to delete from the app once you've had a look around.

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
    id,
    'MSB',
    'Ground floor switch room',
    '250',
    '10kA',
    '[
      {"id": "c1", "label": "RCD test", "result": "fail"},
      {"id": "c2", "label": "Connections torqued", "result": "pass"},
      {"id": "c3", "label": "Labelling compliant", "result": "pass"}
    ]'::jsonb,
    true,
    'RCD on circuit 4 failed trip-time test (>300ms). Requires replacement.',
    'safety',
    0
  from new_job
  returning job_id
)
insert into boards (job_id, name, location, rating_amps, fault_level, checklist, has_defects, sort_order)
select
  job_id,
  'GMB-1',
  'Level 1 riser cupboard',
  '100',
  '6kA',
  '[
    {"id": "c1", "label": "RCD test", "result": "pass"},
    {"id": "c2", "label": "Connections torqued", "result": "pass"},
    {"id": "c3", "label": "Labelling compliant", "result": "na"}
  ]'::jsonb,
  false,
  1
from board_msb;
