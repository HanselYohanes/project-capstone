import { useState, useEffect } from "react";

const API_BASE = "http://localhost:3001/api/v1";

export const useStats = () => {
    const [stats, setStats] = useState({
        pasar: 0,
        total: 0,
        violations: 0,
        safe: 0,
        compliance: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchKPIs = async () => {
            try {
                setLoading(true);
                const savedUser = localStorage.getItem("user");
                const token = savedUser ? JSON.parse(savedUser)?.token : null;
                const headers = token
                    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
                    : { "Content-Type": "application/json" };

                const res = await fetch(`${API_BASE}/dashboard/kpis`, {
                    headers,
                });
                if (!res.ok) {
                    throw new Error(`HTTP error: ${res.status}`);
                }
                const json = await res.json();
                const d = json.data;

                // 🔥 Defensive check: pastikan property ada sebelum akses .value
                const totalMinimarket = d?.totalMinimarket?.value ?? 0;
                const activeViolations = d?.activeViolations?.value ?? 0;
                const safeCount = Math.max(0, totalMinimarket - activeViolations);
                const compliance =
                    totalMinimarket > 0
                        ? ((safeCount / totalMinimarket) * 100).toFixed(1)
                        : "0.0";

                setStats({
                    pasar: d?.totalPasar?.value ?? 0,
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