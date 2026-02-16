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
