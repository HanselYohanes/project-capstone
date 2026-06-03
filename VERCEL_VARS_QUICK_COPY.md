# VERCEL ENVIRONMENT VARIABLES - COPY TO VERCEL CONSOLE

## 🔑 Generate These First (Run in Terminal):

```bash
node -e "console.log('JWT_SECRET=', require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ADMIN_SECRET=', require('crypto').randomBytes(32).toString('hex'))"
```

---

## ✅ Variables to Add in Vercel (https://vercel.com/dashboard → zonify → Settings → Environment Variables)

### Copy-Paste These:

| Key | Value | Notes |
|-----|-------|-------|
| `DATABASE_URL` | `postgresql://postgres.fapitdozoxzlsguaujbw:Hansel%4012340311@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true` | Runtime connection (pgbouncer) |
| `DIRECT_URL` | `postgresql://postgres.fapitdozoxzlsguaujbw:Hansel%4012340311@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres` | Direct connection (migrations) |
| `NODE_ENV` | `production` | Must be production |
| `PORT` | `3000` | Vercel default |
| `JWT_SECRET` | [GENERATE & PASTE] | From Step 1 - IMPORTANT! |
| `ADMIN_SECRET` | [GENERATE & PASTE] | From Step 1 - IMPORTANT! |
| `VITE_API_BASE_URL` | `https://zonify.vercel.app/api/v1` | Update domain! |
| `VITE_API_URL` | `https://zonify.vercel.app` | Update domain! |
| `AI_SERVICE_URL` | `https://your-ai-service:5000` | Update AI service URL |
| `VERCEL_ENV` | `production` | Vercel config |

---

## 🚀 Quick Deploy:

```bash
vercel deploy --prod
```

---

## ✨ Notes:

- [ ] Replace `zonify` with your actual Vercel project name
- [ ] Generate new JWT_SECRET & ADMIN_SECRET (don't use old values!)
- [ ] Update AI_SERVICE_URL to actual AI service location
- [ ] Database URLs are ready to use (Supabase)
- [ ] After deploy, test: `curl https://zonify.vercel.app/api/v1/health`
