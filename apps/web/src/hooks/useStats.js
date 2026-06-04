import { useState, useEffect, useCallback } from "react";
import api from '../utils/api';

/**
 * useStats — Single Source of Truth untuk KPI Dashboard.
 *
 * Sumber data: GET /api/v1/entities?type=MINIMARKET (meta.total)
 * Cache: 'no-store' pada setiap fetch agar browser tidak pakai data stale (304).
 *
 * Mengekspos refresh() agar bisa di-trigger dari luar (misal: setelah form Save).
 *
 * @param {number} [refreshInterval=0] - Auto-refresh interval ms (0 = disable)
 */
export const useStats = ({ refreshInterval = 0 } = {}) => {
  const [stats, setStats] = useState({
    pasar: 0,
    pasarTrend: 0,
    total: 0,
    violations: 0,
    safe: 0,
    compliance: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLiveStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // ── Fetch paralel dengan Cache-Control: 'no-store' agar tidak kena 304 ──
      const [miniRes, pasarRes, violRes] = await Promise.all([
        api.get('/entities?type=MINIMARKET&limit=1', { headers: { 'Cache-Control': 'no-store' } }),
        api.get('/entities?type=PASAR&limit=1', { headers: { 'Cache-Control': 'no-store' } }),
        api.get('/violations/summary', { headers: { 'Cache-Control': 'no-store' } }).catch(() => null),
      ]);

      const miniJson = miniRes.data;
      const pasarJson = pasarRes.data;
      const violJson = violRes ? violRes.data : null;

      // totalMinimarket = entities.filter(e => e.type === 'MINIMARKET').length
      // (versi server-side via meta.total — efisien & akurat)
      const totalMinimarket = miniJson?.meta?.total ?? 0;
      const totalPasar = pasarJson?.meta?.total ?? 0;
      const pasarTrend = pasarJson?.meta?.trend ?? 0;

      const activeViolations =
        violJson?.data?.totalActive ??
        violJson?.data?.active ??
        0;

      const safeCount = Math.max(0, totalMinimarket - activeViolations);
      const compliance =
        totalMinimarket > 0
          ? ((safeCount / totalMinimarket) * 100).toFixed(1)
          : "0.0";

      setStats({
        pasar: totalPasar,
        pasarTrend,
        total: totalMinimarket,
        violations: activeViolations,
        safe: safeCount,
        compliance,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveStats();

    if (refreshInterval > 0) {
      const id = setInterval(fetchLiveStats, refreshInterval);
      return () => clearInterval(id);
    }
  }, [fetchLiveStats, refreshInterval]);

  // refresh() diekspor agar komponen lain dapat trigger ulang fetch
  return { ...stats, loading, error, refresh: fetchLiveStats };
};