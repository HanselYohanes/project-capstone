import { Router } from 'express';
import { getZoningMapPoints, calculateZoningStatus } from '../controllers/zoning.controller.js';

const router = Router();

// GET untuk Map (titik toko & pasar)
router.get('/points', getZoningMapPoints);

// POST untuk Calculator Zonasi
router.post('/calculate', calculateZoningStatus);

export default router;