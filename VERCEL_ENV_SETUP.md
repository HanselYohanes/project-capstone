# 📦 READY TO DEPLOY - VERCEL ENVIRONMENT CONFIGURATION

## STEP 1: Generate Secure Secrets

Jalankan di terminal:

```bash
# Terminal 1 - Generate JWT_SECRET
node -e "console.log('JWT_SECRET=', require('crypto').randomBytes(32).toString('hex'))"

# Terminal 2 - Generate ADMIN_SECRET  
node -e "console.log('ADMIN_SECRET=', require('crypto').randomBytes(32).toString('hex'))"
```

Contoh output:
```
JWT_SECRET= 7f3a9d2c1e8b4f6a9c2e5d1a8f3b6c9e2d5a8f1c4e7a0b3d6e9f2c5a8b1d4
ADMIN_SECRET= 2c5a8f1e4b7d0a3c6f9e2b5d8a1c4e7f0a3b6c9e2d5a8f1c4e7a0b3d6e9f2
```

---

## STEP 2: Copy These Env Variables for Vercel

### SET THESE IN VERCEL CONSOLE (https://vercel.com → Settings → Environment Variables):

#### ✅ Database Variables (TETAP SAMA):
```
DATABASE_URL
postgresql://postgres.fapitdozoxzlsguaujbw:Hansel%4012340311@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true

DIRECT_URL
postgresql://postgres.fapitdozoxzlsguaujbw:Hansel%4012340311@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
```

#### 🔐 Security Variables (GANTI DENGAN HASIL GENERATE):
```
JWT_SECRET
[PASTE HASIL GENERATE DARI STEP 1]

ADMIN_SECRET
[PASTE HASIL GENERATE DARI STEP 1]
```

#### 🌐 Frontend Variables (GANTI DENGAN VERCEL DOMAIN):
```
VITE_API_BASE_URL
https://zonify.vercel.app/api/v1
(atau custom domain kamu)

VITE_API_URL
https://zonify.vercel.app
(atau custom domain kamu)
```

#### 🤖 AI Service (SESUAIKAN):
```
AI_SERVICE_URL
https://your-ai-service-url:5000

Opsi:
- Local development: http://127.0.0.1:5000
- Cloud hosting: https://your-cloud-ai.com
- Vercel: https://zonify-ai.vercel.app
```

#### ⚙️ Server Configuration:
```
NODE_ENV
production

PORT
3000

VERCEL_ENV
production
```

---

## STEP 3: Deploy Command

```bash
# Login ke Vercel
vercel login

# Deploy dari root folder
vercel deploy --prod

# Atau set env vars via CLI:
vercel env add DATABASE_URL
vercel env add DIRECT_URL
vercel env add JWT_SECRET
vercel env add ADMIN_SECRET
vercel env add VITE_API_BASE_URL
vercel env add VITE_API_URL
vercel env add AI_SERVICE_URL
vercel env add NODE_ENV
```

---

## STEP 4: Verify Deployment

```bash
# Check API health
curl https://zonify.vercel.app/api/v1/health

# Check database connection
curl https://zonify.vercel.app/api/v1/dashboard

# Test login
curl -X POST https://zonify.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@zonify.com","password":"your_password"}'
```

---

## 📋 Full Production Environment Variables List

Copy-paste ready:

```env
# DATABASE
DATABASE_URL=postgresql://postgres.fapitdozoxzlsguaujbw:Hansel%4012340311@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.fapitdozoxzlsguaujbw:Hansel%4012340311@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres

# SERVER
NODE_ENV=production
PORT=3000
VERCEL_ENV=production

# SECURITY (GENERATE SENDIRI!)
JWT_SECRET=YOUR_SECURE_JWT_TOKEN_HERE_64_HEX_CHARS
ADMIN_SECRET=YOUR_SECURE_ADMIN_TOKEN_HERE_64_HEX_CHARS

# FRONTEND
VITE_API_BASE_URL=https://zonify.vercel.app/api/v1
VITE_API_URL=https://zonify.vercel.app

# AI SERVICE
AI_SERVICE_URL=https://your-ai-service:5000
```

---

## ⚠️ IMPORTANT NOTES

1. **Generate New Secrets**: JANGAN pakai JWT_SECRET & ADMIN_SECRET yang lama!
2. **Update Domain**: Ganti `zonify.vercel.app` dengan domain Vercel/custom domain kamu
3. **AI Service URL**: Update sesuai dimana AI service akan di-host
4. **Database**: Sudah di Supabase, tinggal copy-paste
5. **Git Ignore**: Pastikan `.env`, `.env.local`, `.env.production.local` di `.gitignore`

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Generate JWT_SECRET dan ADMIN_SECRET baru
- [ ] Tau domain Vercel kamu (atau custom domain)
- [ ] Tau URL AI service untuk production
- [ ] Semua env vars di-set di Vercel Console
- [ ] Jalankan `vercel deploy --prod`
- [ ] Verify API health endpoint
- [ ] Verify Frontend bisa akses API
- [ ] Test login & core functionality

---

## 🆘 TROUBLESHOOTING

### Error: "DATABASE_URL not found"
→ Set di Vercel Console Environment Variables, bukan di file .env

### Error: "VITE_API_BASE_URL undefined"
→ Pastikan pakai prefix VITE_ dan set di Vercel Console

### Error: "AI service unreachable"
→ Update AI_SERVICE_URL ke URL yang benar dan accessible dari Vercel

### Error: "Unauthorized" (401)
→ Pastikan JWT_SECRET sama di API dan tidak berubah

### Slow build time
→ Vercel cache builds, refresh dengan `vercel deploy --prod`

---

**🚀 Ready to Deploy!**

Kumpulkan semua env vars di atas dan submit ke Vercel Console.
