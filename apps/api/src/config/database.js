import { PrismaClient } from '@prisma/client';

// ─── Global Singleton — aman untuk serverless & dev hot-reload ───────────────
// Pola ini memastikan hanya ada SATU instance PrismaClient yang aktif,
// mencegah Connection Limit Exhausted di Vercel Serverless.
const prisma = globalThis.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export default prisma;
