import { Router } from 'express';
import { listAudits, createAudit, auditMiddlewares } from '../controllers/audit.controller.js';

const router = Router();

// ─── GET /api/v1/audits ───────────────────────────────────────────────────────
// List semua audit dengan pagination, filter, dan search
router.get('/', ...auditMiddlewares.list, listAudits);

// ─── POST /api/v1/audits ──────────────────────────────────────────────────────
// HANYA ADMIN: buat audit baru secara atomik (Audit + Entity dalam 1 transaksi)
//
// Body (buat entity BARU sekaligus):
//   { name, type, address, latitude, longitude, districtId,
//     store, kelurahan, permitStatus, priority, status, findings }
//
// Body (tautkan ke entity YANG SUDAH ADA):
//   { entityId, districtId, priority, status, findings }
router.post('/', ...auditMiddlewares.create, createAudit);

export default router;