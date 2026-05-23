import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:3001/api/v1";

const ViewAllDashboard = () => {
    const [kpis, setKpis] = useState(null);
    const [topDistricts, setTopDistricts] = useState([]);
    const [recentViolations, setRecentViolations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError(null);

            const [kpiRes, topRes, violRes] = await Promise.all([
                fetch(`${API_BASE}/dashboard/kpis`),
                fetch(`${API_BASE}/dashboard/top-districts`),
                fetch(`${API_BASE}/dashboard/recent-violations`),
            ]);

            const [kpiData, topData, violData] = await Promise.all([
                kpiRes.json(), topRes.json(), violRes.json(),
            ]);

            if (!kpiRes.ok || !kpiData.success) throw new Error("Gagal memuat KPI.");
            setKpis(kpiData.data);
            if (topData.success) setTopDistricts(topData.data);
            if (violData.success) setRecentViolations(violData.data);
        } catch (err) {
            setError(err.message || "Terjadi kesalahan saat mengambil data dashboard.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    // Helpers
    const satColor = (p) => p >= 80 ? "bg-red-500" : p >= 50 ? "bg-amber-500" : "bg-emerald-500";
    const satText = (p) => p >= 80 ? "text-red-400" : p >= 50 ? "text-amber-400" : "text-emerald-400";

    const statusBadge = (status) => {
        const base = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase";
        const map = {
            CRITICAL: `${base} bg-red-500/15 text-red-400`, WARNING: `${base} bg-amber-500/15 text-amber-400`,
            STABLE: `${base} bg-emerald-500/15 text-emerald-400`, ACTIVE: `${base} bg-red-500/15 text-red-400`,
            UNDER_REVIEW: `${base} bg-amber-500/15 text-amber-400`, RESOLVED: `${base} bg-emerald-500/15 text-emerald-400`,
        };
        return <span className={map[status] || `${base} bg-slate-500/15 text-slate-400`}>{status}</span>;
    };

    const sevBadge = (sev) => {
        const colors = { CRITICAL: "text-red-400", HIGH: "text-amber-400", WARNING: "text-yellow-400", MEDIUM: "text-yellow-400", ELEVATED: "text-orange-400", LOW: "text-emerald-400", STABLE: "text-emerald-400" };
        return <span className={`text-xs font-semibold ${colors[sev] || "text-on-surface-variant"}`}>{sev}</span>;
    };

    const timeAgo = (dateStr) => {
        if (!dateStr) return "-";
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m lalu`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h lalu`;
        return `${Math.floor(hrs / 24)}d lalu`;
    };

    // ===================== LOADING =====================
    if (loading) {
        return (
            <div className="ml-64 p-8 min-h-screen">
                {/* Skeleton Header */}
                <div className="mb-8">
                    <div className="h-8 w-48 bg-surface-container-highest/40 rounded-lg animate-pulse mb-2" />
                    <div className="h-4 w-72 bg-surface-container-highest/30 rounded animate-pulse" />
                </div>
                {/* Skeleton KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="glass-panel rounded-xl p-5 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-surface-container-highest/40" />
                                <div className="flex-1">
                                    <div className="h-3 w-20 bg-surface-container-highest/30 rounded mb-2" />
                                    <div className="h-6 w-14 bg-surface-container-highest/40 rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Skeleton Table */}
                <div className="glass-panel rounded-xl p-6 animate-pulse">
                    <div className="h-5 w-40 bg-surface-container-highest/40 rounded mb-4" />
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-10 bg-surface-container-highest/20 rounded mb-2" />
                    ))}
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
                    <h3 className="text-lg font-semibold text-white mb-2">Gagal Memuat Dashboard</h3>
                    <p className="text-on-surface-variant text-sm mb-6">{error}</p>
                    <button onClick={fetchDashboard} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 font-medium text-sm transition-all duration-200">
                        <span className="material-symbols-outlined text-sm">refresh</span> Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    // KPI card definitions
    const kpiCards = kpis ? [
        { key: "totalEntities", icon: "apartment", label: "Total Entitas", color: "primary", value: kpis.totalEntities?.value, sub: kpis.totalEntities?.label },
        { key: "totalPasar", icon: "storefront", label: "Total Pasar", color: "amber-400", value: kpis.totalPasar?.value, sub: kpis.totalPasar?.label },
        { key: "totalMinimarket", icon: "local_convenience_store", label: "Total Minimarket", color: "emerald-400", value: kpis.totalMinimarket?.value, sub: kpis.totalMinimarket?.label },
        { key: "activeViolations", icon: "gavel", label: "Pelanggaran Aktif", color: "red-400", value: kpis.activeViolations?.value, sub: kpis.activeViolations?.label },
        { key: "overSaturatedZones", icon: "warning", label: "Zona Jenuh (≥80%)", color: "amber-400", value: kpis.overSaturatedZones?.value, sub: kpis.overSaturatedZones?.label },
        { key: "flaggedEntities", icon: "flag", label: "Entitas Bermasalah", color: "red-400", value: kpis.flaggedEntities?.value, sub: kpis.flaggedEntities?.label },
        { key: "permitApprovalRate", icon: "verified", label: "Tingkat Izin (%)", color: "emerald-400", value: kpis.permitApprovalRate?.value, sub: kpis.permitApprovalRate?.label, suffix: "%" },
        { key: "totalViolations", icon: "report", label: "Total Pelanggaran", color: "amber-400", value: kpis.totalViolations?.value, sub: kpis.totalViolations?.label },
        { key: "totalSupermarket", icon: "shopping_cart", label: "Total Supermarket", color: "primary", value: kpis.totalSupermarket?.value, sub: kpis.totalSupermarket?.label },
    ] : [];

    // ===================== MAIN =====================
    return (
        <div className="ml-64 p-8 min-h-screen text-on-surface">

            {/* Header */}
            <div className="flex items-end justify-between mb-8">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight text-white">Dashboard</h1>
                    <p className="text-on-surface-variant text-sm mt-1">Ringkasan data geospasial Zonify secara real-time.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/20">
                        <span className="material-symbols-outlined text-xs text-emerald-400">sync</span> Live Sync
                    </div>
                    <button onClick={fetchDashboard} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-medium border border-outline-variant/20 transition-all duration-200">
                        <span className="material-symbols-outlined text-sm">refresh</span> Refresh
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {kpiCards.map((card) => (
                    <div key={card.key} className="glass-panel rounded-xl p-5 hover:border-outline-variant/40 transition-all duration-200">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-${card.color}/15 flex items-center justify-center`}>
                                <span className={`material-symbols-outlined text-${card.color} text-xl`}>{card.icon}</span>
                            </div>
                            <div>
                                <p className="text-xs text-on-surface-variant uppercase tracking-wider">{card.label}</p>
                                <p className="text-2xl font-bold text-white">{card.value ?? 0}{card.suffix || ""}</p>
                                <p className="text-xs text-on-surface-variant mt-0.5">{card.sub}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom: Top Districts + Recent Violations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Top Districts */}
                <div className="glass-panel rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-outline-variant/15 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">leaderboard</span>
                        <h2 className="text-white font-semibold text-base">Top 5 Distrik Terjenuh</h2>
                    </div>
                    <div className="divide-y divide-outline-variant/10">
                        {topDistricts.length === 0 ? (
                            <div className="p-6 text-center text-on-surface-variant text-sm">Tidak ada data.</div>
                        ) : topDistricts.map((d, i) => (
                            <div key={d.id || i} className="flex items-center gap-4 px-6 py-3.5 hover:bg-surface-container-highest/20 transition-colors">
                                <span className={`text-sm font-bold w-6 text-center ${i === 0 ? "text-primary" : "text-on-surface-variant"}`}>{String(i + 1).padStart(2, "0")}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{d.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 h-1.5 rounded-full bg-surface-container-highest/40 overflow-hidden max-w-[100px]">
                                            <div className={`h-full rounded-full ${satColor(d.saturationPercent)} transition-all duration-500`} style={{ width: `${Math.min(d.saturationPercent, 100)}%` }} />
                                        </div>
                                        <span className={`text-xs font-semibold tabular-nums ${satText(d.saturationPercent)}`}>{d.saturationPercent?.toFixed(1)}%</span>
                                    </div>
                                </div>
                                {statusBadge(d.status)}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Violations */}
                <div className="glass-panel rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-outline-variant/15 flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-400 text-lg">gavel</span>
                        <h2 className="text-white font-semibold text-base">Pelanggaran Terbaru</h2>
                    </div>
                    <div className="divide-y divide-outline-variant/10 max-h-[400px] overflow-y-auto">
                        {recentViolations.length === 0 ? (
                            <div className="p-6 text-center text-on-surface-variant text-sm">Tidak ada pelanggaran terbaru.</div>
                        ) : recentViolations.map((v) => (
                            <div key={v.id} className="flex items-start gap-3 px-6 py-3.5 hover:bg-surface-container-highest/20 transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="material-symbols-outlined text-red-400 text-sm">report</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-white text-sm font-medium truncate">{v.entity?.name || v.code || "-"}</span>
                                        {sevBadge(v.severity)}
                                    </div>
                                    <p className="text-on-surface-variant text-xs truncate">{v.district?.name || "-"} · {v.ruleType}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    {statusBadge(v.status)}
                                    <p className="text-on-surface-variant text-xs mt-1">{timeAgo(v.detectedAt)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewAllDashboard;
