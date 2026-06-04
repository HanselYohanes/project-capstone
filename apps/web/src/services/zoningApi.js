import api from '../utils/api';

/**
 * Mengambil semua titik data peta zonasi dari backend.
 * GET /api/v1/zoning/points
 * @returns {Promise<Array>} Array of zoning map point objects.
 */
export const getZoningMapPoints = async () => {
  const response = await api.get('/zoning/points');
  // response.data = { success, message, data: [...] }
  return response.data.data;
};

/**
 * Menghitung status zonasi berdasarkan koordinat dan radius.
 * POST /api/v1/zoning/calculate
 * @param {Object} payload - { name, latitude, longitude, radiusMeters }
 * @returns {Promise<Object>} Keseluruhan objek { success, message, data } dari backend.
 */
export const calculateZoning = async (payload) => {
  const response = await api.post('/zoning/calculate', payload);

  // response.data = { success, message, data }
  // Kembalikan keseluruhan response.data agar Calculator.jsx
  // bisa mengakses results.data, results.message, dst.
  return response.data;
};

/**
 * Memanggil endpoint AI feature-engineering.
 * POST /api/v1/ai/predict
 * Menghitung fitur kompetitor (Haversine) di backend lalu
 * meneruskannya ke Python ML service.
 * Mengembalikan { prediction, ai_recommendation } yang sudah dinormalisasi.
 * @param {Object} params - { latitude, longitude }
 * @returns {Promise<{ prediction: Object, ai_recommendation: Object|null }>}
 */
export const predictAI = async ({ latitude, longitude }) => {
  const response = await api.post('/ai/predict', { latitude, longitude });

  const json = response.data;

  // json.data.prediction = objek dari Python ML service
  // { is_violation, verdict, confidence_percentage, ai_recommendation? }
  const predictionObj = json?.data?.prediction ?? json?.prediction ?? {};
  const aiRec =
    predictionObj.ai_recommendation ??
    json?.data?.ai_recommendation ??
    json?.ai_recommendation ??
    null;

  return {
    prediction: predictionObj,
    ai_recommendation: aiRec,
  };
};