# Khidmat

Sistem Informasi Masjid berbasis Next.js (App Router), Supabase Auth, dan Prisma.

## Arsitektur Single Tenant

Aplikasi ini didesain untuk **1 masjid per 1 instance deploy**.

- Data masjid disimpan sebagai **singleton** (satu record konfigurasi global).
- Admin mengelola data via endpoint protected: `GET/POST /api/admin/mosque`.
- Layar publik (`/display`) membaca data via endpoint public read-only: `GET /api/public/mosque`.

## Stack

- Next.js 16 + React 19
- Supabase SSR auth
- Prisma + PostgreSQL
- React Query + Axios
- Tailwind CSS 4

## Menjalankan Project

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Buat file `.env` minimal berisi:

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...

# Optional: set false jika tidak ingin user baru daftar sendiri
ALLOW_PUBLIC_REGISTRATION=true
```

## Rute penting

- Public:
  - `/`
  - `/display`
  - `/api/public/mosque`
- Auth:
  - `/auth/login`
  - `/auth/register`
- Admin (butuh login):
  - `/dashboard`
  - `/settings`
  - `/images`
  - `/announcements`
  - `/api/admin/mosque`

```
khidmat-offline
├─ app
│  ├─ (admin)
│  │  ├─ announcements
│  │  │  └─ page.tsx
│  │  ├─ dashboard
│  │  │  └─ page.tsx
│  │  ├─ finance
│  │  │  └─ page.tsx
│  │  ├─ images
│  │  │  └─ page.tsx
│  │  ├─ layout.tsx
│  │  └─ settings
│  │     └─ page.tsx
│  ├─ api
│  │  ├─ admin
│  │  │  ├─ announcements
│  │  │  │  ├─ route.ts
│  │  │  │  └─ [id]
│  │  │  │     └─ route.ts
│  │  │  ├─ finance
│  │  │  │  └─ route.ts
│  │  │  ├─ images
│  │  │  │  ├─ route.ts
│  │  │  │  └─ [id]
│  │  │  │     └─ route.ts
│  │  │  ├─ mosque
│  │  │  │  └─ route.ts
│  │  │  └─ prayer-settings
│  │  │     └─ route.ts
│  │  ├─ mosque
│  │  │  └─ route.ts
│  │  └─ public
│  │     ├─ announcements
│  │     │  └─ route.ts
│  │     ├─ finance
│  │     │  └─ weekly
│  │     │     └─ route.ts
│  │     ├─ images
│  │     │  └─ route.ts
│  │     ├─ mosque
│  │     │  └─ route.ts
│  │     └─ prayer-settings
│  │        └─ route.ts
│  ├─ auth
│  │  ├─ callback
│  │  │  └─ page.tsx
│  │  ├─ login
│  │  │  └─ page.tsx
│  │  └─ register
│  │     └─ page.tsx
│  ├─ display
│  │  └─ page.tsx
│  ├─ favicon.ico
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components
│  ├─ app-breadcrumb.tsx
│  ├─ app-sidebar.tsx
│  ├─ auth
│  │  ├─ login-form.tsx
│  │  └─ register-form.tsx
│  ├─ header.tsx
│  ├─ map-picker.tsx
│  ├─ providers
│  │  └─ query-provider.tsx
│  └─ ui
│     ├─ badge.tsx
│     ├─ breadcrumb.tsx
│     ├─ button.tsx
│     ├─ card.tsx
│     ├─ dropdown-menu.tsx
│     ├─ form.tsx
│     ├─ input.tsx
│     ├─ label.tsx
│     ├─ select.tsx
│     ├─ separator.tsx
│     ├─ sheet.tsx
│     ├─ sidebar.tsx
│     ├─ skeleton.tsx
│     ├─ sonner.tsx
│     ├─ switch.tsx
│     ├─ textarea.tsx
│     └─ tooltip.tsx
├─ components.json
├─ eslint.config.mjs
├─ hooks
│  └─ use-mobile.ts
├─ lib
│  ├─ actions
│  │  ├─ login.ts
│  │  ├─ logout.ts
│  │  └─ register.ts
│  ├─ announcement.ts
│  ├─ auth
│  │  └─ middleware.ts
│  ├─ axios.ts
│  ├─ display-image.ts
│  ├─ finance.ts
│  ├─ generated
│  ├─ mosque.ts
│  ├─ prayer-settings.ts
│  ├─ prayer-times.ts
│  ├─ prisma.ts
│  ├─ session.ts
│  ├─ types
│  │  ├─ announcement.ts
│  │  ├─ display-image.ts
│  │  ├─ finance.ts
│  │  ├─ geocode.ts
│  │  ├─ mosque.ts
│  │  ├─ prayer-settings.ts
│  │  └─ response.ts
│  ├─ upload.ts
│  └─ utils.ts
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ prisma
│  └─ schema.prisma
├─ prisma.config.ts
├─ proxy.ts
├─ public
│  ├─ fonts
│  │  ├─ headline
│  │  │  └─ Khodijah Free.ttf
│  │  ├─ sans
│  │  │  ├─ SourceSans3-Italic-VariableFont_wght.ttf
│  │  │  └─ SourceSans3-VariableFont_wght.ttf
│  │  └─ serif
│  │     ├─ SourceSerif4-Italic-VariableFont_opsz,wght.ttf
│  │     └─ SourceSerif4-VariableFont_opsz,wght.ttf
│  ├─ masjid-2.png
│  ├─ masjid-3.jpg
│  ├─ sounds
│  │  ├─ alarm1.wav
│  │  ├─ alarm2.wav
│  │  └─ alarm3.wav
│  ├─ test.png
│  └─ uploads
├─ README.md
└─ tsconfig.json

```