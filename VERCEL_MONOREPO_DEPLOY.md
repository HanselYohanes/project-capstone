# 🚀 VERCEL DEPLOYMENT - Backend + Frontend Monorepo

## Struktur Deployment di Vercel

```
zonify.vercel.app/
├── /api/*        → Express Backend (apps/api)
└── /*            → React Frontend (apps/web)
```

---

## Konfigurasi Files

### 1. **vercel.json** ✅
- Sudah dikonfigurasi untuk monorepo
- Routes: `/api/*` → Backend, `/*` → Frontend
- Build commands otomatis

### 2. **.npmrc** ✅
```
legacy-peer-deps=true
engine-strict=false
```
- Handle dependency conflicts untuk React 18.3 + react-leaflet-heatmap-layer

### 3. **.vercelignore** ✅
- Exclude files yang tidak perlu saat deploy

---

## Environment Variables yang Diperlukan

Set di Vercel Console (Settings → Environment Variables):

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://...@...pool...` | Supabase (pooler) |
| `DIRECT_URL` | `postgresql://...@...direct...` | Supabase (direct) |
| `NODE_ENV` | `production` | Must be production |
| `PORT` | `3000` | Default Vercel |
| `JWT_SECRET` | Generate dengan: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | REQUIRED - Generate baru! |
| `ADMIN_SECRET` | Generate dengan: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | REQUIRED - Generate baru! |
| `VITE_API_BASE_URL` | `https://zonify.vercel.app/api/v1` | Frontend → Backend URL |
| `VITE_API_URL` | `https://zonify.vercel.app` | Frontend base URL |
| `AI_SERVICE_URL` | `https://huggingface.co/spaces/melissalau/zonify-api` | HuggingFace AI Service |

---

## Deploy Steps

### 1. Generate Secrets
```bash
node -e "console.log('JWT_SECRET:', require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ADMIN_SECRET:', require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Set Environment Variables di Vercel Console
- Go to: https://vercel.com/dashboard
- Select project: `zonify`
- Settings → Environment Variables
- Add all variables dari tabel di atas

### 3. Deploy
```bash
# Option 1: Via CLI
vercel deploy --prod

# Option 2: Push ke Git repo (auto deploy)
git push origin main
```

---

## Testing After Deployment

### Check Backend Health
```bash
curl https://zonify.vercel.app/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-06-03T..."
  }
}
```

### Check Frontend
- Open: https://zonify.vercel.app/
- Should see login page

### Check API Connectivity
1. Login di frontend
2. Cek console browser untuk errors
3. Cek Vercel deployment logs: `vercel logs --prod`

---

## Route Mappings

| Path | Handler | Served From |
|------|---------|-------------|
| `/api/v1/*` | Express | apps/api |
| `/api/v1/health` | Backend | apps/api |
| `/api/v1/auth/*` | Backend | apps/api |
| `/api/v1/dashboard` | Backend | apps/api |
| `/` | React App | apps/web |
| `/pages/*` | React Router | apps/web |
| `/assets/*` | Static Files | apps/web/dist |

---

## Troubleshooting

### ❌ "Cannot GET /api/v1/dashboard"
- Check Backend is deployed correctly
- Check environment variables are set
- Check DATABASE_URL is valid

### ❌ "CORS Error"
- Frontend URL not in CORS whitelist
- Update CORS in apps/api/src/index.js
- Add domain to whitelist

### ❌ "Database Connection Failed"
- Check DATABASE_URL in Vercel Console
- Check Supabase database is running
- Ping: `pg_isready -U user -h host`

### ❌ "Build Failed"
- Check Vercel build logs
- Ensure npm dependencies compatible
- Try: `npm install --legacy-peer-deps`

---

## Monitoring

### Vercel Logs
```bash
vercel logs --prod
vercel logs --prod --tail
```

### Database
- Supabase Console: https://app.supabase.com
- Check query logs and performance

---

## Rollback

If deployment has issues:
```bash
vercel rollback
```

This reverts to previous working deployment.

---

✅ **Ready to Deploy!**
