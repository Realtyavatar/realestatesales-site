# Deploy runbook — Checkout Inspections

Machine-actionable steps to deploy `airbnb-inspections/` from this repo.
Written so an automation agent (or a human with a terminal) can run it
top-to-bottom. Every step has an API/CLI command; dashboard click-paths are
in the README if you prefer.

## Inputs (secrets the agent needs before starting)

| Variable | Where to get it |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | supabase.com → Account → Access Tokens |
| `SUPABASE_ORG_ID` | supabase.com → your org → Settings → General (org slug/id) |
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens |
| `LOGIN_EMAIL` | the one app login to create (e.g. `you@example.com`) |
| `LOGIN_PASSWORD` | strong password for that login |
| `DB_PASSWORD` | strong password for the new Supabase database |

Source branch: `claude/airbnb-inspection-checklist-r5g41a` (or `main` once
merged). App root directory within the repo: `airbnb-inspections`.

---

## 1. Create the Supabase project

```bash
curl -sf -X POST "https://api.supabase.com/v1/projects" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "airbnb-inspections",
    "organization_id": "'"$SUPABASE_ORG_ID"'",
    "db_pass": "'"$DB_PASSWORD"'",
    "region": "ap-southeast-2"
  }'
# → note "id" from the response; export it:
export PROJECT_REF=<id from response>
```

Wait until the project reports `ACTIVE_HEALTHY` (poll every ~15s, usually
1–2 min):

```bash
curl -sf "https://api.supabase.com/v1/projects/$PROJECT_REF" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | grep -o '"status":"[^"]*"'
```

## 2. Apply the database schema

Run the entire migration file `supabase/migrations/0001_init.sql` via the
Management API query endpoint (single statement batch — the file is written
to run as one script):

```bash
jq -Rs '{query: .}' < airbnb-inspections/supabase/migrations/0001_init.sql | \
curl -sf -X POST "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @-
```

(Alternative: `psql "$(supabase --experimental db url)" -f ...`, or paste the
file into the dashboard SQL Editor.)

The migration is idempotent-ish for buckets (`on conflict do nothing`) but
NOT for tables/types — do not run it twice; on a re-run error, check whether
the schema already exists before diagnosing further.

## 3. Get the API keys

```bash
curl -sf "https://api.supabase.com/v1/projects/$PROJECT_REF/api-keys" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
# → export both:
export SUPABASE_URL="https://$PROJECT_REF.supabase.co"
export ANON_KEY=<key where name == "anon">
export SERVICE_ROLE_KEY=<key where name == "service_role">   # used only in steps 4–5, never deployed
```

## 4. Create the single login user (auto-confirmed)

```bash
curl -sf -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$LOGIN_EMAIL"'",
    "password": "'"$LOGIN_PASSWORD"'",
    "email_confirm": true
  }'
```

## 5. Disable public signups

```bash
curl -sf -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"disable_signup": true}'
```

## 6. Create the Vercel project (root directory is the critical part)

```bash
curl -sf -X POST "https://api.vercel.com/v11/projects" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "airbnb-inspections",
    "framework": "nextjs",
    "rootDirectory": "airbnb-inspections",
    "gitRepository": {
      "type": "github",
      "repo": "Realtyavatar/realestatesales-site"
    }
  }'
# → export PROJECT_ID=<"id" from response>
```

If your Vercel account/team hasn't connected the GitHub repo yet, connect it
once in the dashboard (Add New → Project → Import), then re-run — or create
the project without `gitRepository` and link the repo in Settings → Git.

## 7. Set the environment variables

```bash
for kv in "NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL" \
          "NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY"; do
  curl -sf -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "key": "'"${kv%%=*}"'",
      "value": "'"${kv#*=}"'",
      "type": "plain",
      "target": ["production", "preview", "development"]
    }'
done
```

Only these two are needed. Do NOT deploy the service_role key anywhere.

## 8. Deploy from the branch

```bash
curl -sf -X POST "https://api.vercel.com/v13/deployments" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "airbnb-inspections",
    "project": "'"$PROJECT_ID"'",
    "target": "production",
    "gitSource": {
      "type": "github",
      "repo": "Realtyavatar/realestatesales-site",
      "ref": "claude/airbnb-inspection-checklist-r5g41a"
    }
  }'
# → note "url" in the response; poll /v13/deployments/{id} until readyState == "READY"
```

(CLI alternative: `cd airbnb-inspections && vercel deploy --prod --token $VERCEL_TOKEN`.)

## 9. Verify the deployment

1. `curl -sfI https://<deployment-url>/` → expect `200` and the login page
   (unauthenticated visits to `/inspections` must redirect to `/`).
2. Sign in with `LOGIN_EMAIL` / `LOGIN_PASSWORD` → the startup prompt
   "Begin a checkout inspection?" should appear.
3. Begin an inspection → four rooms (Bedroom, Bathroom, Kitchen, Living
   area) → tick an item, take/add a photo, flag a damage item.
4. Download the PDF from the inspection overview → file name looks like
   `inspection-<property>-YYYYMMDD-HHMM.pdf` and contains the photo with a
   timestamp badge.
5. Optional: add the URL to a phone home screen (PWA manifest is served at
   `/manifest.webmanifest`).

## Rollback / teardown

- Vercel: delete the project (`DELETE /v9/projects/$PROJECT_ID`).
- Supabase: delete the project (`DELETE /v1/projects/$PROJECT_REF`) — this
  permanently deletes all inspection data and photos.
