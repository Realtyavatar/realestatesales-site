# realestatesales.com.au

Buyer-facing AI property search website powered by RealtyAvatar backend.

## Architecture

```
realestatesales.com.au  →  RealtyAvatar Backend (realtyavatar-dashboard.vercel.app)
     (this repo)                    (existing repo)
```

## RealtyAvatar Backend Endpoints Used

| Endpoint | Method | Description | Fallback |
|----------|--------|-------------|---------|
| `/api/listings` | GET | All listings | Mock listings |
| `/api/listings?status=Active` | GET | Active listings only | Mock listings |
| `/api/listings/:id` | GET | Single listing | Mock listing |
| `/api/rentals` | GET | All rentals | Empty array |
| `/api/documents?search=<address>` | GET | Documents for property | Empty array |
| `/api/leads` | POST | Create lead/enquiry | Silent fail |
| `/api/settings` | GET | Agency settings | Defaults |

## Endpoints To Be Added to RealtyAvatar

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai-search` | POST | AI-powered property search by natural language prompt |
| `/api/widget/chat` | POST | Sam assistant chat with property context |

## Service Files

- `lib/realtyavatar/client.ts` — base HTTP client
- `lib/realtyavatar/listings.ts` — listings CRUD
- `lib/realtyavatar/leads.ts` — lead capture
- `lib/realtyavatar/documents.ts` — document availability & requests
- `lib/realtyavatar/search.ts` — AI search with local fallback
- `lib/realtyavatar/chat.ts` — Sam assistant with context

## Sam Assistant Rules

- Does NOT offer documents unless a property is selected AND documents confirmed available from backend
- Collects buyer contact details naturally before document delivery
- All leads sent to RealtyAvatar `/api/leads`
