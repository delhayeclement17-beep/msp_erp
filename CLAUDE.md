# Mahieu ERP — Claude Code Handoff

## Project overview
Custom ERP for **Mahieu Sablage Peinture**, a Belgian surface-treatment workshop
(sandblasting, powder coating, liquid painting, metallisation).

**Stack:** Next.js 14 (App Router) · PostgreSQL 16 · Drizzle ORM · NextAuth v4 (JWT)
· Docker Compose · Caddy (SSL) · TypeScript · Tailwind CSS

**PC path:** `C:\Users\Michel\Desktop\MSP_erp`
**Target deploy:** Hetzner VPS + custom domain (not yet configured)

---

## Users & roles
| Name      | Email                  | Role      | Password     |
|-----------|------------------------|-----------|--------------|
| Clément   | clement@mahieu.be      | admin     | mahieu2024   |
| Ghislain  | ghislain@mahieu.be     | admin     | mahieu2024   |
| Allison   | allison@mahieu.be      | operateur | atelier2024  |
| Toni      | toni@mahieu.be         | operateur | atelier2024  |
| Réception | reception@mahieu.be    | operateur | atelier2024  |

Roles: `admin` = full access · `operateur` = production floor (no pricing, no client mgmt)

---

## Reference format
`MM/XXX/YYYY` — monthly sequential (001, 002…).
Sub-orders append suffix: `10/001/2026-A`, `10/001/2026-B`, etc.

---

## Treatment checkboxes & station routing
Treatments drive which stations are created in `station_statuses`:

| Treatment        | Stations triggered                          |
|------------------|---------------------------------------------|
| Nettoyage HP     | ACC → NHP → EMB → EXP                      |
| Sablage          | ACC → SAB → EMB → EXP                      |
| Métallisation    | ACC → SAB (forced) → MET → EMB → EXP       |
| Primaire         | + PRI after SAB/MET                         |
| Thermolaquage    | + TL_ACC → TL_POU → TL_FOU → TL_DEC        |
| Peinture liquide | + PL_CAC → PL_FIN → PL_DCA                 |

Conditional fields: RAL + Texture + Brillance appear when Thermolaquage OR Peinture liquide is checked.
Primaire options: Non / Liquide / Époxy four.

---

## Order lifecycle
`En attente` → `Genere` → `En cours` → `Termine` → `Expedie` → `Facture` → `Paye` → `Archive`
Terminal states: `Annule`

Status advances via PATCH `/api/orders/[id]` with `{ statut: "..." }`.

---

## Key files
```
src/
  app/
    (auth)/login/          — login page
    (dashboard)/
      layout.tsx           — sidebar + mobile top bar
      orders/
        page.tsx           — orders list (cards on mobile, table on desktop)
        new/page.tsx       — full BDC form (~500 lines)
        [id]/
          page.tsx         — order detail + action buttons
          bdc/page.tsx     — printable BDC sheet (auto-opens print dialog)
      clients/page.tsx
      suivi/page.tsx       — STUB: production Kanban (to build)
      scan/page.tsx        — STUB: QR scanner (to build)
      dashboard/page.tsx   — STUB: KPI dashboard (to build)
  api/
    auth/[...nextauth]/    — NextAuth handler
    orders/route.ts        — GET list + POST create
    orders/[id]/route.ts   — GET detail + PATCH update
    clients/route.ts       — GET list (with ?q=search) + POST create
    photos/route.ts        — POST upload (saves to public/uploads/)
  db/
    schema.ts              — all tables (users, clients, orders, stationStatuses, photos, …)
    index.ts               — Drizzle + pg Pool
    seed.ts                — seed users + config
  lib/
    auth.ts                — NextAuth config (bcryptjs comparison, JWT role)
    ref-generator.ts       — generateOrderRefAsync()
    stations.ts            — getApplicableStations(order) → StationCode[]
  components/
    Sidebar.tsx            — nav with mobile hamburger
    Providers.tsx          — SessionProvider wrapper
  middleware.ts            — protects all non-/api routes, redirects to /login
```

---

## Environment variables (.env)
```
DATABASE_URL=postgresql://mahieu:mahieu_secret@localhost:5432/mahieu_erp
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<64-char hex>
NODE_ENV=development
```

## Dev commands
```bash
# Start PostgreSQL (Docker)
docker compose up -d db

# Run dev server (accessible from phone on LAN)
npx next dev -H 0.0.0.0

# Seed database
npx tsx src/db/seed.ts

# Push schema changes
npx drizzle-kit push
```

---

## PRIORITY ROADMAP

### P0 — This sprint (blocking production use)

**1. Fiche Atelier (workshop sheet)**
- Prints at same time as BDC (same print dialog, second page or separate tab)
- One sheet per sub-order (or one sheet for single orders)
- Content: ref, client name, treatment sequence as checklist, RAL/texture/brillance if applicable, nb pieces, description, remarks, delivery date
- NO pricing on workshop sheet
- Add station-by-station checkbox grid for the floor operators to tick off
- File to create: `src/app/(dashboard)/orders/[id]/fiche/page.tsx`
- Update BDC button to open both BDC + fiche in new tabs simultaneously

**2. Photo capture from phone**
- BDC form already has `capture="environment"` on file input
- Needs testing on mobile — likely works once app is deployed (HTTPS required for camera on most mobile browsers)
- Verify `src/app/api/photos/route.ts` saves correctly and returns URL
- Show uploaded photo thumbnails in the BDC form and order detail

**3. Schema migration: add `dateExpeditionSouhaitee`**
- Already in schema as `delaiSouhaite` (text) — should be a proper date field
- Rename to `dateExpeditionSouhaitee`, type `text` (ISO date string) for simplicity
- Used by production planning to sort/prioritise

### P1 — Production planning

**4. Suivi Atelier — Station Kanban**
- File: `src/app/(dashboard)/suivi/page.tsx` (currently stub)
- Station columns from `STATIONS` array in schema.ts
- Each card: order ref, client, nb pieces, RAL if applicable, delivery date badge (green/orange/red)
- Filter bar: show all stations or filter to one station (for floor operators)
- Tap card → goes to order detail
- PATCH station status via API when operator marks a station done
- API needed: `GET /api/suivi` — returns all active orders with their station statuses

**5. Production scheduling view**
- Date-based view: "what needs to leave this week"
- Groups orders by `dateExpeditionSouhaitee`
- Shows treatment pipeline per order so manager can spot bottlenecks

### P2 — Data import

**6. Historical data import**
- Clément has existing order files + client contact data from prior Excel system
- Build `src/db/import.ts` script once files are shared
- Client import: nom, type, contact, telephone, email, adresse, tva_number
- Order import: ref (preserve original), client, date, treatments, status → Archive

### P3 — Deployment

**7. GitHub + Hetzner VPS**
- `git init && git push` to private GitHub repo
- Provision Hetzner CX22 (Ubuntu 24.04)
- `docker compose up -d` — app + PostgreSQL + Caddy
- Configure domain DNS → Caddy handles SSL automatically
- Photo storage: mount Hetzner Volume for `public/uploads/` persistence

---

## Known issues / tech debt
- `next.config.js` uses `serverComponentsExternalPackages: ["bcryptjs", "pg"]` — required to prevent webpack bundling errors
- Photo uploads go to `public/uploads/` — fine for dev, needs persistent volume in production
- `generateOrderRefAsync()` has a race condition under concurrent inserts — add DB-level unique constraint (already exists on `ref`) and catch duplicate key on retry
- `delaiSouhaite` is stored as free text — should be ISO date for proper sorting in production planning

---

## Parallel agent suggestions
If running multiple Claude Code agents on this project:
- **Agent A (forms/print):** P0 tasks 1+2 — fiche atelier + photo testing
- **Agent B (backend/API):** P1 task 4 — suivi Kanban API + page
- **Agent C (data):** P2 task 6 — import script (needs files from Clément first)
Agents should not edit the same files simultaneously. Agent A owns `src/app/(dashboard)/orders/`, Agent B owns `src/app/(dashboard)/suivi/` and `src/app/api/suivi/`.
