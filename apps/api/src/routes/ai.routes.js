import { Router } from 'express';
import axios from 'axios';
import prisma from '../config/database.js';
import {
  haversineDistanceMeters,
  isValidLatitude,
  isValidLongitude,
} from '../utils/geo.util.js';

const router = Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5000';

const COMPETITOR_RADIUS_METERS = 500;
const HEAD_TO_HEAD_RADIUS_METERS = 50;

const COMPETITOR_KEYWORDS = [
  'MINIMARKET',
  'MINI_MARKET',
  'RETAIL',
  'STORE',
  'TOKO',
  'MART',
  'ALFAMART',
  'INDOMARET',
  'ALFAMIDI',
  'LAWSON',
  'FAMILYMART',
  'CIRCLE K',
];

function roundNumber(value, digits = 2) {
  return Number(Number(value).toFixed(digits));
}

function stringifyValue(value) {
  if (value === null || value === undefined) return '';

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }

  return String(value);
}

function isRetailCompetitor(entity) {
  const text = [
    stringifyValue(entity.name),
    stringifyValue(entity.type),
    stringifyValue(entity.store),
  ]
    .join(' ')
    .toUpperCase();

  return COMPETITOR_KEYWORDS.some((keyword) => text.includes(keyword));
}

function deriveClusterFeatures({ competitorDensity, jarakKompetitor, nearestDistrict }) {
  const saturationPercent = nearestDistrict?.saturationPercent ?? null;
  const districtStatus = nearestDistrict?.status ?? null;

  let cluster_macro = 1;
  let cluster_hotspot = -1;
  let is_hotspot = 0;

  /**
   * Prioritas 1:
   * Jika data district punya saturationPercent/status,
   * gunakan itu sebagai dasar fitur klaster.
   */
  if (saturationPercent !== null && saturationPercent !== undefined) {
    if (saturationPercent >= 80) {
      cluster_macro = 4;
      cluster_hotspot = 1;
      is_hotspot = 1;
    } else if (saturationPercent >= 60) {
      cluster_macro = 3;
      cluster_hotspot = 1;
      is_hotspot = 1;
    } else if (saturationPercent >= 40) {
      cluster_macro = 2;
      cluster_hotspot = 0;
      is_hotspot = 0;
    } else {
      cluster_macro = 1;
      cluster_hotspot = -1;
      is_hotspot = 0;
    }
  }

  /**
   * Prioritas 2:
   * Jika status district CRITICAL/WARNING,
   * anggap area sebagai hotspot.
   */
  if (districtStatus === 'CRITICAL') {
    cluster_macro = 4;
    cluster_hotspot = 1;
    is_hotspot = 1;
  }

  if (districtStatus === 'WARNING') {
    cluster_macro = Math.max(cluster_macro, 3);
    cluster_hotspot = 1;
    is_hotspot = 1;
  }

  /**
   * Fallback:
   * Jika belum ada data district/cluster,
   * gunakan kepadatan kompetitor sebagai pendekatan sementara.
   */
  if (!nearestDistrict) {
    if (competitorDensity >= 8) {
      cluster_macro = 4;
      cluster_hotspot = 1;
      is_hotspot = 1;
    } else if (competitorDensity >= 5) {
      cluster_macro = 3;
      cluster_hotspot = 1;
      is_hotspot = 1;
    } else if (competitorDensity >= 2) {
      cluster_macro = 2;
      cluster_hotspot = 0;
      is_hotspot = 0;
    } else {
      cluster_macro = 1;
      cluster_hotspot = -1;
      is_hotspot = 0;
    }
  }

  /**
   * Jika jarak kompetitor terlalu dekat,
   * area tetap dianggap berisiko hotspot.
   */
  if (jarakKompetitor <= HEAD_TO_HEAD_RADIUS_METERS) {
    is_hotspot = 1;
    cluster_hotspot = 1;
    cluster_macro = Math.max(cluster_macro, 3);
  }

  return {
    cluster_macro,
    cluster_hotspot,
    is_hotspot,
  };
}

async function buildPredictionFeatures(latitude, longitude) {
  const entities = await prisma.entity.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      store: true,
      latitude: true,
      longitude: true,
      district: {
        select: {
          id: true,
          name: true,
          status: true,
          saturationPercent: true,
        },
      },
    },
  });

  // filter secara manual di JS supaya latitude & longitude valid
  const validEntities = entities.filter(
    (e) =>
      typeof e.latitude === 'number' &&
      !isNaN(e.latitude) &&
      typeof e.longitude === 'number' &&
      !isNaN(e.longitude)
  );

  const competitors = entities
    .filter((entity) => {
      const entityLat = Number(entity.latitude);
      const entityLng = Number(entity.longitude);

      return (
        isValidLatitude(entityLat) &&
        isValidLongitude(entityLng) &&
        isRetailCompetitor(entity)
      );
    })
    .map((entity) => {
      const entityLat = Number(entity.latitude);
      const entityLng = Number(entity.longitude);

      const distanceMeters = haversineDistanceMeters(
        latitude,
        longitude,
        entityLat,
        entityLng
      );

      return {
        entity,
        distanceMeters,
      };
    })
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  const competitorsWithinRadius = competitors.filter(
    (item) => item.distanceMeters <= COMPETITOR_RADIUS_METERS
  );

  const nearestCompetitor = competitors[0] || null;

  const competitor_density = competitorsWithinRadius.length;

  const jarak_kompetitor = nearestCompetitor
    ? roundNumber(nearestCompetitor.distanceMeters, 2)
    : 999999;

  const head_to_head =
    nearestCompetitor && nearestCompetitor.distanceMeters <= HEAD_TO_HEAD_RADIUS_METERS
      ? 1
      : 0;

  const nearestDistrict = nearestCompetitor?.entity?.district || null;

  const clusterFeatures = deriveClusterFeatures({
    competitorDensity: competitor_density,
    jarakKompetitor: jarak_kompetitor,
    nearestDistrict,
  });

  return {
    latitude,
    longitude,
    competitor_density,
    jarak_kompetitor,
    head_to_head,
    cluster_macro: clusterFeatures.cluster_macro,
    cluster_hotspot: clusterFeatures.cluster_hotspot,
    is_hotspot: clusterFeatures.is_hotspot,
  };
}

// POST /api/v1/ai/predict
// POST /api/v1/ai/predict
// POST /api/v1/ai/predict
router.post('/predict', async (req, res, next) => {
  try {
    const latitude = Number(req.body.latitude);
    const longitude = Number(req.body.longitude);

    if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
      return res.status(400).json({ success: false, message: 'Latitude dan longitude tidak valid' });
    }

    const features = await buildPredictionFeatures(latitude, longitude);
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/zonasi/predict`, features, { timeout: 15000 });

    // 1. Ambil data pasar secara agresif
    const semuaEntity = await prisma.entity.findMany();
    const pasarEntities = semuaEntity.filter(e =>
      (e.type && String(e.type).toUpperCase() === 'PASAR') ||
      (e.store && String(e.store).toUpperCase().includes('PASAR')) ||
      (e.name && String(e.name).toUpperCase().includes('PASAR'))
    );

    // 2. BUNGKUS KE DALAM OBJEK (Sesuai ekspektasi Front-End)
    let finalAIObject = {
      prediction: 'AMAN',
      ai_recommendation: 'Lokasi aman dari pelanggaran zonasi.'
    };

    // Ambil data asli dari Python jika ada
    if (aiResponse.data && typeof aiResponse.data === 'object') {
      finalAIObject.prediction = aiResponse.data.prediction || 'AMAN';
      finalAIObject.ai_recommendation = aiResponse.data.ai_recommendation || 'Aman';
    }

    // 3. HITUNG JARAK MUTLAK
    if (pasarEntities.length === 0) {
      // Jika database benar-benar kosong
      finalAIObject.prediction = "MELANGGAR";
      finalAIObject.ai_recommendation = "🚨 ERROR BACKEND: Data Pasar KOSONG di Database! Tolong pastikan database sudah di-seed.";
    } else {
      let jarakTerdekat = 999999;
      let namaPasarTerdekat = '';

      for (const pasar of pasarEntities) {
        const latPasar = Number(pasar.latitude);
        const lonPasar = Number(pasar.longitude);

        if (isValidLatitude(latPasar) && isValidLongitude(lonPasar)) {
          const jarak = haversineDistanceMeters(latitude, longitude, latPasar, lonPasar);
          if (jarak < jarakTerdekat) {
            jarakTerdekat = jarak;
            namaPasarTerdekat = pasar.name;
          }
        }
      }

      // 4. GUARDRAIL 500 METER
      if (jarakTerdekat < 500) {
        finalAIObject.prediction = "MELANGGAR"; // Masukkan ke dalam objek final
        finalAIObject.ai_recommendation = `🚨 Sistem Zonify: Lokasi ini melanggar karena berjarak hanya ${jarakTerdekat.toFixed(2)} meter dari ${namaPasarTerdekat} (Batas min 500m).`;
      }
    }

    // 5. KIRIM DATA KE FRONT-END
    res.json({
      success: true,
      message: 'Prediksi berhasil',
      data: {
        input: { latitude, longitude },
        generatedFeatures: features,
        // KUNCI PERBAIKAN: prediction sekarang berisi OBJEK utuh, bukan string rata!
        prediction: finalAIObject
      },
    });
  } catch (err) {
    next(err);
  }
});
// router.post('/predict', async (req, res, next) => {
//   try {
//     const latitude = Number(req.body.latitude);
//     const longitude = Number(req.body.longitude);

//     if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Latitude dan longitude tidak valid',
//       });
//     }

//     const features = await buildPredictionFeatures(latitude, longitude);

//     const aiResponse = await axios.post(
//       `${AI_SERVICE_URL}/api/zonasi/predict`,
//       features,
//       {
//         timeout: 15000,
//       }
//     );

//     res.json({
//       success: true,
//       message: 'Prediksi berhasil',
//       data: {
//         input: {
//           latitude,
//           longitude,
//         },
//         generatedFeatures: features,
//         prediction: aiResponse.data,
//       },
//     });
//   } catch (err) {
//     if (err.response) {
//       err.status = err.response.status || 500;
//       err.message =
//         err.response.data?.message ||
//         err.response.data?.error ||
//         'Gagal melakukan prediksi AI';
//     }

//     next(err);
//   }
// });

export default router;