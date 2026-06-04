# 🔐 ENVIRONMENT VARIABLES UNTUK VERCEL PRODUCTION

## ENV VARS yang SUDAH READY (dari current .env):

```
DATABASE_URL=postgresql://postgres.fapitdozoxzlsguaujbw:Hansel%4012340311@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true

DIRECT_URL=postgresql://postgres.fapitdozoxzlsguaujbw:Hansel%4012340311@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres

AI_SERVICE_URL=http://127.0.0.1:5000
```

---

## ENV VARS yang HARUS DIGANTI untuk PRODUCTION:

### 1. NODE_ENV
```
SAAT INI: development
UNTUK VERCEL: production
```

### 2. JWT_SECRET & ADMIN_SECRET (PENTING! JANGAN PAKE YANG SEKARANG)
Generate values baru:
```bash
node -e "console.log('JWT_SECRET:', require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ADMIN_SECRET:', require('crypto').randomBytes(32).toString('hex'))"
```
Contoh hasil:
```
JWT_SECRET=a3f5c8e2b9d1f4c7e8a2b5d9f1c4e7a0b3d6e9f2c5a8b1d4e7f0a3c6d9e1f4
ADMIN_SECRET=f1e4d7a0c3f6e9b2a5d8c1f4e7a0b3d6c9f2e5a8b1d4e7f0c3a6b9d2e5f8
```

### 3. VITE_API_BASE_URL (UPDATE KE DOMAIN VERCEL)
```
SAAT INI: http://localhost:3001/api/v1
UNTUK VERCEL: https://zonify-api.vercel.app/api/v1

(Ganti "zonify-api" dengan nama project Vercel kamu)
```

### 4. VITE_API_URL
```
SAAT INI: (tidak ada, auto default ke localhost)
UNTUK VERCEL: https://zonify-api.vercel.app

(Sesuaikan dengan VITE_API_BASE_URL tapi tanpa /api/v1)
```

### 5. AI_SERVICE_URL
```
SAAT INI: http://127.0.0.1:5000
UNTUK VERCEL: [TERGANTUNG DIMANA AI SERVICE DI-HOST]

Opsi:
- Jika AI service juga di Vercel: https://zonify-ai.vercel.app
- Jika on-premise/cloud: https://your-ai-server.com:5000
- Jika GCP/AWS: https://your-cloud-ai-endpoint.com
```

### 6. PORT
```
SAAT INI: 3001
UNTUK VERCEL: 3000 (atau biarkan kosong, Vercel auto handle)
```

---

## SUMMARY - ENV VARS UNTUK VERCEL:

```env
# Database (TETAP SAMA - sudah di Supabase)
DATABASE_URL=postgresql://postgres.fapitdozoxzlsguaujbw:Hansel%4012340311@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.fapitdozoxzlsguaujbw:Hansel%4012340311@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres

# Server
PORT=3000
NODE_ENV=production

# Security (GANTI DENGAN YANG BARU!)
JWT_SECRET=[HASIL GENERATE - 64 CHAR HEX]
ADMIN_SECRET=[HASIL GENERATE - 64 CHAR HEX]

# API URLs (GANTI DENGAN DOMAIN VERCEL)
VITE_API_BASE_URL=https://zonify-api.vercel.app/api/v1
VITE_API_URL=https://zonify-api.vercel.app

# AI Service (GANTI SESUAI DEPLOYMENT)
AI_SERVICE_URL=https://your-ai-service.com:5000

# Vercel
VERCEL_ENV=production
```

---

## ✅ CHECKLIST SEBELUM DEPLOY:

- [ ] Generate JWT_SECRET & ADMIN_SECRET yang baru
- [ ] Tahu domain Vercel kamu (atau custom domain)
- [ ] Tahu dimana AI service akan di-host
- [ ] Sudah copy semua env vars di atas
- [ ] Siap input ke Vercel Console

---

**Kirim ENV VARS ini ke tim yang akan handle deployment ke Vercel! 🚀**
