// src/services/zoningApi.js

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

export const getZoningMapPoints = async () => {
  const response = await fetch(`${API_BASE_URL}/zoning/points`);

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || 'Gagal mengambil data peta');
  }

  return json.data;
};

export const calculateZoning = async ({ name, latitude, longitude, radiusMeters = 500 }) => {
  const response = await fetch(`${API_BASE_URL}/zoning/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      latitude: Number(latitude),
      longitude: Number(longitude),
      radiusMeters: Number(radiusMeters),
    }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || 'Gagal menghitung zonasi');
  }

  return json.data;
};