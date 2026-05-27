// src/controllers/zoning.controller.js

import prisma from '../config/database.js';
import {
  validateLatitudeLongitude,
  haversineDistanceMeters,
  formatDistance,
  toNumber,
} from '../utils/geo.util.js';

// ─── GET MAP POINTS ─────────────────────────────────────
// GET /api/v1/zoning/points
export const getZoningMapPoints = async (req, res) => {
  try {
    const { type, districtId, store } = req.query;

    const where = {};

    // filter type optional: MINIMARKET / PASAR / SUPERMARKET
    if (type) {
      where.type = String(type).toUpperCase();
    } else {
      where.type = {
        in: ['MINIMARKET', 'PASAR'],
      };
    }

    if (districtId) {
      where.districtId = districtId;
    }

    if (store) {
      where.store = {
        contains: store,
        mode: 'insensitive',
      };
    }

    const entities = await prisma.entity.findMany({
      where,
      include: {
        district: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
            saturationPercent: true,
          },
        },
      },
      orderBy: [
        {
          type: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });

    const points = entities.map((entity) => {
      const isPasar = entity.type === 'PASAR';
      const isMinimarket = entity.type === 'MINIMARKET';

      return {
        id: entity.id,
        name: entity.name,
        type: entity.type,
        store: entity.store,
        address: entity.address,
        kelurahan: entity.kelurahan,
        latitude: entity.latitude,
        longitude: entity.longitude,
        rating: entity.rating,
        totalRatings: entity.totalRatings,
        permitStatus: entity.permitStatus,
        complianceScore: entity.complianceScore,
        isFlagged: entity.isFlagged,
        district: entity.district,

        // buat frontend map
        markerType: isPasar ? 'PASAR' : 'MINIMARKET',
        markerColor: isPasar
          ? 'green'
          : entity.isFlagged
            ? 'red'
            : entity.store === 'Indomaret'
              ? 'blue'
              : entity.store === 'Alfamart'
                ? 'orange'
                : 'gray',
        statusLabel: isPasar
          ? 'Pasar Tradisional'
          : entity.isFlagged
            ? 'Berpotensi Melanggar'
            : 'Aman',
        popupTitle: entity.name,
        popupSubtitle: isMinimarket
          ? `${entity.store || 'Minimarket'} - ${entity.district?.name || '-'}`
          : `Pasar Tradisional - ${entity.district?.name || '-'}`,
      };
    });

    const summary = {
      total: points.length,
      totalMinimarket: points.filter((item) => item.type === 'MINIMARKET').length,
      totalPasar: points.filter((item) => item.type === 'PASAR').length,
      totalFlagged: points.filter((item) => item.isFlagged).length,
    };

    return res.status(200).json({
      success: true,
      message: 'Data titik peta berhasil diambil',
      data: {
        summary,
        points,
      },
    });
  } catch (error) {
    console.error('GET ZONING MAP POINTS ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data titik peta',
      error: error.message,
    });
  }
};

// ─── POST CALCULATE ZONING ──────────────────────────────
// POST /api/v1/zoning/calculate
export const calculateZoningStatus = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radiusMeters,
      name,
    } = req.body;

    const validation = validateLatitudeLongitude(latitude, longitude);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const lat = validation.latitude;
    const lon = validation.longitude;

    // Ambil radius dari request body.
    // Kalau kosong, coba ambil dari zoning rule.
    // Kalau zoning rule kosong, default 500 meter.
    const bodyRadius = toNumber(radiusMeters);

    const zoningRule = await prisma.zoningRule.findFirst({
      where: {
        ruleType: 'PROXIMITY',
        targetEntityType: 'MINIMARKET',
        referenceEntityType: 'PASAR',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const minimumDistanceMeters =
      bodyRadius ||
      zoningRule?.minDistanceMeters ||
      500;

    const pasars = await prisma.entity.findMany({
      where: {
        type: 'PASAR',
      },
      include: {
        district: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (pasars.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data pasar tradisional belum tersedia',
      });
    }

    const distances = pasars
      .map((pasar) => {
        const distanceMeters = haversineDistanceMeters(
          lat,
          lon,
          pasar.latitude,
          pasar.longitude
        );

        const formattedDistance = formatDistance(distanceMeters);
        const isViolation = distanceMeters < minimumDistanceMeters;

        return {
          pasarId: pasar.id,
          pasarName: pasar.name,
          address: pasar.address,
          district: pasar.district,
          latitude: pasar.latitude,
          longitude: pasar.longitude,
          distanceMeters: formattedDistance.meters,
          distanceKm: formattedDistance.kilometers,
          status: isViolation ? 'MELANGGAR' : 'AMAN',
        };
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters);

    const nearest = distances[0];
    const isViolation = nearest.distanceMeters < minimumDistanceMeters;

    return res.status(200).json({
      success: true,
      message: 'Perhitungan zonasi berhasil',
      data: {
        input: {
          name: name || 'Calon Minimarket',
          latitude: lat,
          longitude: lon,
        },
        rule: {
          ruleType: 'PROXIMITY',
          targetEntityType: 'MINIMARKET',
          referenceEntityType: 'PASAR',
          minimumDistanceMeters,
          source: zoningRule ? 'DATABASE_ZONING_RULE' : 'DEFAULT_500_METERS',
        },
        result: {
          status: isViolation ? 'DITOLAK' : 'AMAN',
          isViolation,
          statusLabel: isViolation
            ? '⛔ DITOLAK / MELANGGAR ATURAN ZONASI'
            : '✅ AMAN / MEMENUHI ATURAN ZONASI',
          message: isViolation
            ? `Lokasi berada ${nearest.distanceMeters} meter dari ${nearest.pasarName}, kurang dari batas minimal ${minimumDistanceMeters} meter.`
            : `Lokasi aman. Pasar terdekat adalah ${nearest.pasarName} dengan jarak ${nearest.distanceMeters} meter.`,
          nearestPasar: nearest,
        },
        nearestMarkets: distances.slice(0, 10),
        allMarkets: distances,
      },
    });
  } catch (error) {
    console.error('CALCULATE ZONING ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Gagal menghitung status zonasi',
      error: error.message,
    });
  }
};