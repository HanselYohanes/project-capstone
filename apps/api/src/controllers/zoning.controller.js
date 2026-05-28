import prisma from '../config/database.js';
import { validateLatitudeLongitude, haversineDistanceMeters, formatDistance, toNumber } from '../utils/geo.util.js';

const DEFAULT_RADIUS = 500;

// GET /api/v1/zoning/points
export const getZoningMapPoints = async (req, res) => {
  try {
    const { type, districtId, store } = req.query;
    const where = { latitude: { not: null }, longitude: { not: null } };

    if (type) where.type = String(type).toUpperCase();
    else where.type = { in: ['MINIMARKET', 'SUPERMARKET', 'PASAR'] };

    if (districtId) where.districtId = districtId;
    if (store) where.store = { contains: store, mode: 'insensitive' };

    const entities = await prisma.entity.findMany({
      where,
      include: { district: { select: { id: true, name: true, code: true, status: true, saturationPercent: true } } },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    const points = entities.map((e) => {
      const isPasar = e.type === 'PASAR';
      const isSupermarket = e.type === 'SUPERMARKET';

      return {
        id: e.id,
        name: e.name,
        type: e.type,
        store: e.store,
        address: e.address,
        kelurahan: e.kelurahan,
        latitude: Number(e.latitude),
        longitude: Number(e.longitude),
        rating: e.rating,
        totalRatings: e.totalRatings,
        permitStatus: e.permitStatus,
        complianceScore: e.complianceScore,
        isFlagged: e.isFlagged,
        district: e.district,
        markerType: isPasar ? 'PASAR' : isSupermarket ? 'SUPERMARKET' : 'MINIMARKET',
        markerColor: isPasar
          ? 'green'
          : e.isFlagged
            ? 'red'
            : e.store === 'Indomaret'
              ? 'blue'
              : e.store === 'Alfamart'
                ? 'orange'
                : isSupermarket
                  ? 'purple'
                  : 'gray',
        statusLabel: isPasar ? 'Pasar Tradisional' : e.isFlagged ? 'Berpotensi Melanggar' : 'Aman',
        popupTitle: e.name,
        popupSubtitle: isPasar ? `Pasar Tradisional - ${e.district?.name || '-'}` : `${e.store || e.type} - ${e.district?.name || '-'}`,
      };
    });

    const summary = {
      total: points.length,
      totalMinimarket: points.filter((p) => p.type === 'MINIMARKET').length,
      totalSupermarket: points.filter((p) => p.type === 'SUPERMARKET').length,
      totalPasar: points.filter((p) => p.type === 'PASAR').length,
      totalFlagged: points.filter((p) => p.isFlagged).length,
    };

    res.status(200).json({ success: true, message: 'Data titik peta berhasil diambil', data: { summary, points } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data titik peta', error: error.message });
  }
};

// POST /api/v1/zoning/calculate
export const calculateZoningStatus = async (req, res) => {
  try {
    const { latitude, longitude, radiusMeters, name } = req.body;
    const validation = validateLatitudeLongitude(latitude, longitude);
    if (!validation.valid) return res.status(400).json({ success: false, message: validation.message });

    const lat = validation.latitude;
    const lon = validation.longitude;
    const bodyRadius = toNumber(radiusMeters);

    const zoningRule = await prisma.zoningRule.findFirst({
      where: { ruleType: 'PROXIMITY', targetEntityType: 'MINIMARKET', referenceEntityType: 'PASAR' },
      orderBy: { createdAt: 'desc' },
    });

    const minimumDistanceMeters = bodyRadius || zoningRule?.minDistanceMeters || DEFAULT_RADIUS;
    const ruleSource = bodyRadius ? 'REQUEST_BODY_RADIUS' : zoningRule ? 'DATABASE_ZONING_RULE' : 'DEFAULT_500_METERS';

    // 1. Ambil SEMUA data pasar tanpa filter 'where' dari database
    // Ini akan menghindari error Prisma sama sekali
    const allEntities = await prisma.entity.findMany({
      where: { type: 'PASAR' },
      include: { district: { select: { id: true, name: true, code: true } } },
    });

    // 2. Filter secara manual di kodingan (bukan di database)
    const pasars = allEntities.filter(p => p.latitude != null && p.longitude != null);
    // const pasars = await prisma.entity.findMany({
    //   where: { type: 'PASAR', latitude: { not: null }, longitude: { not: null } },
    //   include: { district: { select: { id: true, name: true, code: true } } },
    // });

    if (!pasars.length) return res.status(404).json({ success: false, message: 'Data pasar tradisional belum tersedia' });

    const distances = pasars
      .map((p) => {
        const dMeters = haversineDistanceMeters(lat, lon, Number(p.latitude), Number(p.longitude));
        const f = formatDistance(dMeters);
        return {
          pasarId: p.id,
          pasarName: p.name,
          address: p.address,
          district: p.district,
          latitude: Number(p.latitude),
          longitude: Number(p.longitude),
          distanceMeters: f.meters,
          distanceKm: f.kilometers,
          status: dMeters < minimumDistanceMeters ? 'MELANGGAR' : 'AMAN',
        };
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters);

    const nearest = distances[0];
    const isViolation = nearest.distanceMeters < minimumDistanceMeters;

    res.status(200).json({
      success: true,
      message: 'Perhitungan zonasi berhasil',
      data: {
        input: { name: name || 'Calon Minimarket', latitude: lat, longitude: lon },
        rule: { ruleType: 'PROXIMITY', targetEntityType: 'MINIMARKET', referenceEntityType: 'PASAR', minimumDistanceMeters, source: ruleSource },
        result: {
          status: isViolation ? 'DITOLAK' : 'AMAN',
          isViolation,
          statusLabel: isViolation ? '⛔ DITOLAK / MELANGGAR ATURAN ZONASI' : '✅ AMAN / MEMENUHI ATURAN ZONASI',
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
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal menghitung status zonasi', error: error.message });
  }
};