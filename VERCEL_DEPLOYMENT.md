# 📋 VERCEL DEPLOYMENT GUIDE - Zonify API & Web

## Langkah 1: Generate Secret Keys (PENTING!)

Buka terminal dan jalankan:

```bash
node -e "console.log('JWT_SECRET:', require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ADMIN_SECRET:', require('crypto').randomBytes(32).toString('hex'))"
```

Copy hasil output tersebut - kamu akan membutuhkannya.

---

## Langkah 2: Deploy ke Vercel

### 2a. Setup Vercel Project

```bash
npm install -g vercel
vercel login
vercel deploy
```

### 2b. Pilih opsi:
- Project name: `zonify`
- Link to existing project: No
- Set project root: `./`
- Framework: Next.js (or skip untuk monorepo)

---

## Langkah 3: Set Environment Variables di Vercel Console

Pergi ke: **https://vercel.com/dashboard → zonify → Settings → Environment Variables**

### Tambahkan semua environment variables berikut:

```
DATABASE_URL
postgresql://postgres.fapitdozoxzlsguaujbw:Hansel%4012340311@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true

DIRECT_URL
postgresql://postgres.fapitdozoxzlsguaujbw:Hansel%4012340311@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres

NODE_ENV
production

PORT
3000

JWT_SECRET
[PASTE HASIL DARI STEP 1 - JWT_SECRET]

ADMIN_SECRET
[PASTE HASIL DARI STEP 1 - ADMIN_SECRET]

VITE_API_BASE_URL
https://zonify-api.vercel.app/api/v1
(atau ganti dengan domain Vercel/custom domain kamu)

VITE_API_URL
https://zonify-api.vercel.app
(atau ganti dengan domain Vercel/custom domain kamu)

AI_SERVICE_URL
[GANTI DENGAN URL AI SERVICE - jika on-premise atau cloud-hosted]
Contoh: https://zonify-ai.vercel.app atau https://your-ai-server.com:5000

VERCEL_ENV
production
```

---

## Langkah 4: Deploy kedua-duanya (BE + FE)

Vercel akan otomatis:
1. ✅ Build API (Node.js) dari `apps/api/`
2. ✅ Build Frontend (React) dari `apps/web/`
3. ✅ Deploy keduanya ke domain yang sama

### Verifikasi:

```bash
# API Health
curl https://zonify-api.vercel.app/api/v1/health

# Frontend
https://zonify-api.vercel.app
```

---

## Langkah 5: Database Migrations

Jika ada perubahan schema Prisma:

```bash
# Local
npx prisma migrate dev --name "your_migration_name"

# Production (auto-run on Vercel)
vercel env pull .env.production.local
npx prisma migrate deploy --skip-generate
```

---

## Troubleshooting

### "Port 3000 already in use"
- Vercel otomatis handle ini, jangan set PORT di build

### "DATABASE_URL not found"
- Pastikan ENV variables sudah di-set di Vercel Console
- Jangan hardcode di `.env` - gunakan Vercel Console

### "VITE_API_BASE_URL not working"
- Pastikan prefix `VITE_` - React butuh prefix ini
- Update nilai sesuai domain Vercel kamu

### "AI Service unreachable"
- Update `AI_SERVICE_URL` ke URL yang benar
- Pastikan AI service accessible dari Vercel

---

## Environment Variables Checklist

- [ ] DATABASE_URL di-set di Vercel
- [ ] DIRECT_URL di-set di Vercel
- [ ] JWT_SECRET di-generate dan di-set
- [ ] ADMIN_SECRET di-generate dan di-set
- [ ] VITE_API_BASE_URL sesuai domain Vercel
- [ ] AI_SERVICE_URL di-update
- [ ] NODE_ENV = production
- [ ] Semua vars di-set untuk staging dan production

---

## Domain Setup (Optional)

Jika punya custom domain:
1. Pergi ke Vercel → Settings → Domains
2. Add custom domain
3. Update DNS settings
4. Update `VITE_API_BASE_URL` ke custom domain

---

**Siap deploy! 🚀**
