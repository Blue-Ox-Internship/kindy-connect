# BWAT.md

This file provides guidance to Bwat when working with code in this repository.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite 8
- **Meta-framework**: TanStack Start (TanStack Router + TanStack React Query + Nitro server)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) + CSS variables (oklch)
- **UI library**: shadcn/ui with new-york style + Radix primitives + lucide-react icons
- **Database**: PostgreSQL (Supabase) via the `postgres` npm package (raw SQL, no ORM)
- **Validation**: Zod + @hookform/resolvers (React Hook Form)
- **Date handling**: date-fns
- **Charts**: recharts
- **Notifications**: sonner (toasts) + custom SMS/email notification records in DB
- **CSS animations**: tw-animate-css

## Brand Identity

**Colors** (all in oklch format, set in CSS variables on `:root`):

- Background: `oklch(0.987 0.018 95)` — cream (#FFF8E7-ish)
- Foreground: `oklch(0.28 0.04 60)` — deep warm brown
- Primary: `oklch(0.81 0.165 78)` — sunny yellow (#FFB627)
- Primary-foreground: `oklch(0.28 0.04 60)` — warm brown on yellow
- Secondary: `oklch(0.79 0.13 195)` — mint/teal (#4ECDC4)
- Accent: `oklch(0.72 0.18 22)` — coral (#FF6B6B)
- Muted: `oklch(0.96 0.025 90)` — warm light grey
- Card: white (`oklch(1 0 0)`)
- Border: `oklch(0.91 0.03 85)`
- Destructive: `oklch(0.62 0.22 27)` — red
- Custom gradient vars: `--gradient-sunny` (yellow→orange), `--gradient-mint` (teal→green)
- Custom shadow: `--shadow-playful` (yellow-tinted drop shadow)

**Typography**:

- Headings (h1-h6): `"Fredoka", "Nunito", system-ui, sans-serif` + `letter-spacing: -0.01em`
- Body: `"Nunito", system-ui, sans-serif`
- Loaded via Fontsource: Fredoka (400-700) and Nunito (400-700)

**Geometry**:

- Base radius: `1rem` (`--radius`) — rounded/playful aesthetic
- Derived radii: sm=calc(--radius - 4px), md=calc(--radius - 2px), lg=--radius, xl=calc(--radius + 4px), 2xl=calc(--radius + 8px), etc.
- Spacing: Tailwind default scale
- Shadows: default Tailwind + custom `--shadow-playful`

**Visual language**: Playful and warm kindergarten aesthetic — rounded everything, sunny yellow + mint + coral palette, cream background, friendly rounded fonts.

## Coding Conventions

- **Imports**: `@/` path alias maps to `src/` (configured in tsconfig.json and vite.config.ts)
- **Types**: Interfaces for data models (`User`, `Pupil`, `Attendance`, etc.), defined in `db-functions.ts` with camelCase keys
- **Server/client boundaries**: All DB operations use `createServerFn({ method: "GET" | "POST" })` from `@tanstack/react-start`. Server-only imports guarded by TanStack Start's import protection (blocks `**/server/**` from client bundles).
- **DB naming**: snake_case in PostgreSQL tables/columns → camelCase in TypeScript via `toCamel()` (query results) and `toSnake()` (inserts/updates), both in `lib/db.ts`
- **ID generation**: IDs are random alphanumeric strings (`Math.random().toString(36).slice(2, 10)`), school IDs get an `s-` prefix. No UUIDs.
- **State management**: All data loaded into a React Context (`MockStoreProvider`) on mount via `getInitialData`. Mutations update DB via server functions + optimistically update local state. No granular React Query cache.
- **State filtering**: The store computes `filtered*` arrays based on `currentUser.role` and `currentUser.schoolId` (super_admin sees all; admins/deputies see their school; teachers see their class). Components read from `useStore()` directly.
- **CSS**: Tailwind utility classes almost exclusively. Custom CSS only in `styles.css` (not much beyond theme vars). `@custom-variant dark` for dark mode via `.dark` class.

## Architecture Notes

**Data flow**: On app mount, `getInitialData()` fetches ALL records from every table (schools, users, pupils, parents, attendance, notifications, audit_logs, marks) via server functions. The entire dataset lives in client memory as React state. All CRUD mutations call server functions (which return the updated row) then patch local state. This means no fetch-on-demand for individual records — everything is always loaded.

**Auth**: Custom ID-based login. User enters their ID, server looks it up. Teachers must be status=verified to log in. Session persisted in localStorage under `kinder.currentUserId`. No passwords are actually validated in the login flow (password field exists but unused). `loginAs(role)` utility lets devs switch roles without credentials.

**App shell sidebar** (`components/app-shell.tsx`): Navigation items are role-dependent — super_admin sees Schools/Users/Classes/Audit; admin/deputy sees full school management (Pupils/Parents/Teachers/Classes/Attendance/Marks/Reports/Audit); teachers see My class/Attendance/Marks only.

## Commands

- `bun dev` (or `npm run dev`) — start dev server on port 8080
- `npm run build` — production build
- `npm run build:dev` — dev-mode build
- `npm run lint` — ESLint on all files
- `npm run format` — Prettier on all files
- `node run-migrations.cjs` — apply `database/schema.sql` then `database/seed.sql` to the Supabase DB (parses DATABASE_URL from .env manually)

## Gotchas

- **DATABASE_URL** must be set in `.env` (Supabase PostgreSQL connection string). The migration runner and db.ts both read it from `process.env.DATABASE_URL`.
- **DB is raw SQL via `postgres` package** — no migration framework, no schema versioning. The `schema.sql` file DROPs all tables before recreating them (destructive — will wipe data on re-run).
- **TanStack Start on Windows**: The dev server is configured on port 8080 with `host: "::"` (IPv6 all-interfaces). Ensure ports aren't blocked.
- **Login bypass**: The current auth checks the user exists and teacher is verified but does NOT validate passwords. `loginAs(role)` in the store finds the first verified user of that role — dev-only convenience.
- **SSR errors**: h3 swallows in-handler throws into a generic JSON 500. The `server.ts` entry normalizes these with `normalizeCatastrophicSsrResponse` and renders a custom error page. The `error-capture.ts` module captures errors before h3 swallows them so the stack trace isn't lost.
- **No client-side routing guards**: The app-shell checks `currentUser` and redirects to `/` if null, but there are no route-level guards if a user navigates directly to a protected URL while logged out.
- **New shadcn components**: To add a new component, use the shadcn CLI (`npx shadcn@latest add <component>`) — components live in `src/components/ui/`. The shadcn registry is not enabled (registries is empty).
