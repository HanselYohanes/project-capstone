// src/routes/zoning.routes.js

import { Router } from 'express';
import {
  getZoningMapPoints,
  calculateZoningStatus,
} from '../controllers/zoning.controller.js';

const router = Router();

// API GET buat nampilin semua titik toko & pasar ke peta
router.get('/points', getZoningMapPoints);

// API POST buat fitur kalkulator zonasi
router.post('/calculate', calculateZoningStatus);

export default router;