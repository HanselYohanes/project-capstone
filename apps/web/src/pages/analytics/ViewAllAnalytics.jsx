import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:3001/api/v1";

const ViewAllAnalytics = () => {
    const [kpis, setKpis] = useState(null);
    const [districts, setDistricts] = useState([]);
    const [violationSummary, setViolationSummary] = useState(null);
    const [entityDist, setEntityDist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);

            const [kpiRes, satRes, violRes, entRes] = await Promise.all([
                fetch(`${API_BASE}/analytics/kpis`),
                fetch(`${API_BASE}/analytics/saturation-by-district`),
                fetch(`${API_BASE}/analytics/violation-summary`),
                fetch(`${API_BASE}/analytics/entity-distribution`),
            ]);

            const [kpiData, satData, violData, entData] = await Promise.all([
                kpiRes.json(), satRes.json(), violRes.json(), entRes.json(),
            ]);

            if (!kpiRes.ok || !kpiData.success) throw new Error("Gagal memuat KPI.");
            if (!satRes.ok || !satData.success) throw new Error("Gagal memuat data saturasi.");

            setKpis(kpiData.data);
            setDistricts(satData.data);
            setViolationSummary(violData.success ? violData.data : null);
            setEntityDist(entData.success ? entData.data : []);
        } catch (err) {
            setError(err.message || "Terjadi kesalahan saat mengambil data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    // --- Helpers ---
    const getStatusBadge = (status) => {
        const base = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase";
        const map = {
            CRITICAL: { cls: "bg-red-500/15 text-red-400 ring-1 ring-red-500/25", dot: "bg-red-400 animate-pulse", label: "Critical" },
            WARNING: { cls: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25", dot: "bg-amber-400", label: "Warning" },
            STABLE: { cls: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25", dot: "bg-emerald-400", label: "Stable" },
        };
        const s = map[status] || { cls: "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/25", dot: "bg-slate-400", label: status || "Unknown" };
        return (
            <span className={`${base} ${s.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                {s.label}
            </span>
        );
    };

    const satColor = (p) => p >= 80 ? "bg-red-500" : p >= 50 ? "bg-amber-500" : "bg-emerald-500";
    const satTextColor = (p) => p >= 80 ? "text-red-400" : p >= 50 ? "text-amber-400" : "text-emerald-400";

    const trendIcon = (val) => val > 0 ? "trending_up" : val < 0 ? "trending_down" : "trending_flat";
    const trendColor = (val, invert = false) => {
        if (val === 0) return "text-on-surface-variant";
        const positive = invert ? val < 0 : val > 0;
        return positive ? "text-emerald-400" : "text-red-400";
    };

    // ===================== LOADING =====================
    if (loading) {
        return (
            <div className="ml-64 p-8 min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-outline-variant/20 border-t-primary animate-spin" />
                    <p className="text-on-surface-variant text-sm font-medium animate-pulse">Memuat data analitik...</p>
                </div>
            </div>
        );
    }

    // ===================== ERROR =====================
    if (error) {
        return (
            <div className="ml-64 p-8 min-h-screen flex items-center justify-center">
                <div className="glass-panel rounded-2xl p-8 max-w-md text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-red-400">error</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Gagal Memuat Data</h3>
                    <p className="text-on-surface-variant text-sm mb-6">{error}</p>
                    <button onClick={fetchAnalytics} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 font-medium text-sm transition-all duration-200">
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    // ===================== MAIN =====================
    const kpiCards = kpis ? [
        { key: "totalAudits", icon: "fact_check", label: "Total Audit", color: "primary", ...kpis.totalAudits },
        { key: "overSaturatedZones", icon: "warning", label: "Zona Jenuh (≥80%)", color: "red-400", ...kpis.overSaturatedZones, invertTrend: true },
        { key: "activeViolations", icon: "gavel", label: "Pelanggaran Aktif", color: "amber-400", ...kpis.activeViolations, invertTrend: true },
        { key: "avgCompliance", icon: "verified", label: "Rata-rata Kepatuhan", color: "emerald-400", ...kpis.avgCompliance, suffix: "%" },
    ] : [];

    return (
        <div className="ml-64 p-8 min-h-screen text-on-surface">

            {/* Header */}
            <div className="flex items-end justify-between mb-8">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight text-white">Analitik</h1>
                    <p className="text-on-surface-variant text-sm mt-1">Ringkasan data analitik geospasial Zonify secara keseluruhan.</p>
                </div>
                <button onClick={fetchAnalytics} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-medium border border-outline-variant/20 transition-all duration-200">
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    Refresh
                </button>
            </div>

            {/* KPI Cards */}
            {kpis && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {kpiCards.map((card) => (
                        <div key={card.key} className="glass-panel rounded-xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-10 h-10 rounded-lg bg-${card.color}/15 flex items-center justify-center`}>
                                    <span className={`material-symbols-outlined text-${card.color} text-xl`}>{card.icon}</span>
                                </div>
                                <div className={`flex items-center gap-1 text-xs font-medium ${trendColor(card.trend, card.invertTrend)}`}>
                                    <span className="material-symbols-outlined text-sm">{trendIcon(card.trend)}</span>
                                    {card.trend > 0 ? "+" : ""}{card.trend}
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-white">{card.value}{card.suffix || ""}</p>
                            <p className="text-xs text-on-surface-variant mt-1">{card.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Middle Row: Violation Summary + Entity Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Violation Summary */}
                {violationSummary && (
                    <div className="glass-panel rounded-xl p-6">
                        <h2 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-400 text-lg">gavel</span>
                            Ringkasan Pelanggaran
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-2 font-semibold">Berdasarkan Status</p>
                                <div className="space-y-2">
                                    {violationSummary.byStatus.map((item) => (
                                        <div key={item.status} className="flex items-center justify-between">
                                            <span className="text-sm text-on-surface-variant">{item.status}</span>
                                            <span className="text-sm text-white font-semibold tabular-nums">{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-2 font-semibold">Berdasarkan Severity</p>
                                <div className="space-y-2">
                                    {violationSummary.bySeverity.map((item) => {
                                        const sevColors = { CRITICAL: "text-red-400", HIGH: "text-amber-400", MEDIUM: "text-yellow-400", LOW: "text-emerald-400" };
                                        return (
                                            <div key={item.severity} className="flex items-center justify-between">
                                                <span className={`text-sm font-medium ${sevColors[item.severity] || "text-on-surface-variant"}`}>{item.severity}</span>
                                                <span className="text-sm text-white font-semibold tabular-nums">{item.count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Entity Distribution */}
                {entityDist.length > 0 && (
                    <div className="glass-panel rounded-xl p-6">
                        <h2 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-lg">pie_chart</span>
                            Distribusi Entitas
                        </h2>
                        <div className="space-y-3">
                            {entityDist.map((item) => {
                                const total = entityDist.reduce((s, i) => s + i.count, 0);
                                const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
                                const typeColors = { RETAIL: "bg-primary", PASAR: "bg-amber-500", MINIMARKET: "bg-emerald-500", RESTAURANT: "bg-pink-500" };
                                return (
                                    <div key={item.type}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-white font-medium">{item.type}</span>
                                            <span className="text-xs text-on-surface-variant tabular-nums">{item.count} ({pct}%)</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-surface-container-highest/40 overflow-hidden">
                                            <div className={`h-full rounded-full ${typeColors[item.type] || "bg-primary"} transition-all duration-500`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Saturation by District Table */}
            <div className="glass-panel rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-outline-variant/15 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-lg">leaderboard</span>
                    <h2 className="text-white font-semibold text-base">Kejenuhan per Distrik</h2>
                    <span className="ml-auto text-xs text-on-surface-variant">{districts.length} distrik</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-low/50 border-b border-outline-variant/20">
                                <th className="py-4 px-6 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">#</th>
                                <th className="py-4 px-6 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Nama Distrik</th>
                                <th className="py-4 px-6 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Kejenuhan</th>
                                <th className="py-4 px-6 text-xs text-on-surface-variant uppercase tracking-wider font-semibold text-center">Status</th>
                                <th className="py-4 px-6 text-xs text-on-surface-variant uppercase tracking-wider font-semibold text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10 text-sm">
                            {districts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-on-surface-variant">
                                        <span className="material-symbols-outlined text-4xl text-outline-variant/40 block mb-2">folder_off</span>
                                        Tidak ada data distrik.
                                    </td>
                                </tr>
                            ) : (
                                districts.map((d, i) => (
                                    <tr key={d.name} className="hover:bg-surface-container-highest/30 transition-colors duration-150">
                                        <td className="py-4 px-6 text-on-surface-variant font-medium">{String(i + 1).padStart(2, "0")}</td>
                                        <td className="py-4 px-6 text-white font-medium">{d.name}</td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 rounded-full bg-surface-container-highest/40 overflow-hidden max-w-[120px]">
                                                    <div className={`h-full rounded-full ${satColor(d.saturationPercent)} transition-all duration-500`} style={{ width: `${Math.min(d.saturationPercent, 100)}%` }} />
                                                </div>
                                                <span className={`text-xs font-semibold tabular-nums ${satTextColor(d.saturationPercent)}`}>
                                                    {d.saturationPercent.toFixed(1)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">{getStatusBadge(d.status)}</td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => console.log("Detail:", d.name)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-all duration-200">
                                                    <span className="material-symbols-outlined text-sm">visibility</span>
                                                    Detail
                                                </button>
                                                <button onClick={() => console.log("Edit:", d.name)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-medium transition-all duration-200">
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                    Edit
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ViewAllAnalytics;
