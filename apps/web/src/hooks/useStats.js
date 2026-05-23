import { useState, useEffect } from "react";

const API_BASE = "http://localhost:3001/api/v1";

export const useStats = () => {
    const [stats, setStats] = useState({
        pasar: null,
        total: null,
        violations: null,
        safe: null,
        compliance: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchKPIs = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API_BASE}/dashboard/kpis`);
                if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
                const json = await res.json();
                const d = json.data;

                const totalMinimarket = d.totalMinimarket.value;
                const activeViolations = d.activeViolations.value;
                const safeCount = totalMinimarket - activeViolations;
                const compliance =
                    totalMinimarket > 0
                        ? ((safeCount / totalMinimarket) * 100).toFixed(1)
                        : 0;

                setStats({
                    pasar: d.totalPasar.value,
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
        };

        fetchKPIs();
    }, []);

    return { ...stats, loading, error };
};