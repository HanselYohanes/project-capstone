// src/utils/geo.util.js

export const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export const validateLatitudeLongitude = (latitude, longitude) => {
  const lat = toNumber(latitude);
  const lon = toNumber(longitude);

  if (lat === null || lon === null) {
    return {
      valid: false,
      message: 'Latitude dan longitude wajib berupa angka',
    };
  }

  if (lat < -90 || lat > 90) {
    return {
      valid: false,
      message: 'Latitude harus berada di antara -90 sampai 90',
    };
  }

  if (lon < -180 || lon > 180) {
    return {
      valid: false,
      message: 'Longitude harus berada di antara -180 sampai 180',
    };
  }

  return {
    valid: true,
    latitude: lat,
    longitude: lon,
  };
};

export const haversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;

  const toRad = (degree) => degree * Math.PI / 180;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dPhi = toRad(lat2 - lat1);
  const dLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(dLambda / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const formatDistance = (distanceMeters) => {
  return {
    meters: Number(distanceMeters.toFixed(1)),
    kilometers: Number((distanceMeters / 1000).toFixed(3)),
  };
};

// tambahan kecil utility untuk feature engineering otomatis
export const isValidLatitude = (lat) => typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
export const isValidLongitude = (lon) => typeof lon === 'number' && !isNaN(lon) && lon >= -180 && lon <= 180;

export const roundNumber = (value, digits = 2) => Number(Number(value).toFixed(digits));