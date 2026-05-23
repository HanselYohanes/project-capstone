import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:3001/api/v1";

const ViewAllSettings = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchRules = async () => {
        try {
            setLoading(true);
            setError(null);

            // Karena endpoint khusus zoning_rules mungkin belum tersedia di backend,
            // kita lakukan fetch, jika gagal/404 kita sediakan fallback data dummy.
            const res = await fetch(`${API_BASE}/settings/rules`);

            if (res.ok) {
                const result = await res.json();
                if (result.success) {
                    setRules(result.data);
                    return;
                }
            }

            // Fallback Data UI (Mock) jika endpoint belum ada
            console.warn("Endpoint /settings/rules tidak ditemukan, menggunakan data fallback.");
            setTimeout(() => {
                setRules([
                    {
                        id: "rule_1",
                        name: "Jarak Minimarket ke Pasar Tradisional",
                        ruleType: "PROXIMITY",
                        minDistanceMeters: 500,
                        targetEntityType: "MINIMARKET",
                        referenceEntityType: "PASAR",
                        isActive: true,
                    },
                    {
                        id: "rule_2",
                        name: "Kepadatan Minimarket per Zona",
                        ruleType: "DENSITY",
                        maxEntitiesPerZone: 10,
                        targetEntityType: "MINIMARKET",
                        isActive: true,
                    },
                    {
                        id: "rule_3",
                        name: "Jarak Antar Supermarket",
                        ruleType: "PROXIMITY",
                        minDistanceMeters: 1000,
                        targetEntityType: "SUPERMARKET",
                        referenceEntityType: "SUPERMARKET",
                        isActive: false,
                    }
                ]);
                setLoading(false);
            }, 600);

        } catch (err) {
            setError("Gagal menghubungi server. Menampilkan mode offline/fallback.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const getRuleTypeBadge = (type) => {
        const badges = {
            PROXIMITY: "bg-amber-500/15 text-amber-400 border-amber-500/20",
            DENSITY: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
            CAPACITY: "bg-blue-500/15 text-blue-400 border-blue-500/20"
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider border ${badges[type] || "bg-slate-500/15 text-slate-400 border-slate-500/20"}`}>
                {type}
            </span>
        );
    };

    // ===================== LOADING =====================
    if (loading) {
        return (
            <div className="ml-64 p-8 min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-outline-variant/20 border-t-primary animate-spin" />
                    <p className="text-on-surface-variant text-sm font-medium animate-pulse">Memuat aturan zonasi...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="ml-64 p-8 min-h-screen text-on-surface">

            {/* Header */}
            <div className="flex items-end justify-between mb-8">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight text-white">Aturan Zonasi (Zoning Rules)</h1>
                    <p className="text-on-surface-variant text-sm mt-1">Kelola jarak minimal dan batas kepadatan entitas ritel.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-sm">add</span>
                    Tambah Aturan
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 max-w-4xl">
                    <span className="material-symbols-outlined text-amber-400">warning</span>
                    <p className="text-amber-400 text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Table */}
            <div className="glass-panel rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-low/50 border-b border-outline-variant/20">
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Nama Aturan</th>
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Tipe</th>
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Target / Referensi</th>
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase tracking-wider font-semibold text-center">Parameter (M/Qty)</th>
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase tracking-wider font-semibold text-center">Status</th>
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase tracking-wider font-semibold text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10 text-sm">
                            {rules.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                                        <span className="material-symbols-outlined text-4xl text-outline-variant/40 block mb-2">rule</span>
                                        Belum ada aturan zonasi.
                                    </td>
                                </tr>
                            ) : rules.map((rule) => (
                                <tr key={rule.id} className="hover:bg-surface-container-highest/30 transition-colors duration-150">
                                    <td className="py-4 px-5">
                                        <p className="text-white font-medium">{rule.name}</p>
                                        <p className="text-xs text-on-surface-variant mt-0.5 font-mono">ID: {rule.id.split('_')[1] || rule.id}</p>
                                    </td>
                                    <td className="py-4 px-5">
                                        {getRuleTypeBadge(rule.ruleType)}
                                    </td>
                                    <td className="py-4 px-5">
                                        <div className="flex flex-col gap-1 text-xs">
                                            <span className="text-on-surface-variant">Target: <span className="text-white font-semibold">{rule.targetEntityType}</span></span>
                                            {rule.referenceEntityType && (
                                                <span className="text-on-surface-variant">Ref: <span className="text-white font-semibold">{rule.referenceEntityType}</span></span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-5 text-center">
                                        {rule.ruleType === "PROXIMITY" ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-highest/50 text-white font-semibold tabular-nums">
                                                <span className="material-symbols-outlined text-[16px] text-amber-400">straighten</span>
                                                {rule.minDistanceMeters}m
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-highest/50 text-white font-semibold tabular-nums">
                                                <span className="material-symbols-outlined text-[16px] text-emerald-400">group_work</span>
                                                Max {rule.maxEntitiesPerZone}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4 px-5 text-center">
                                        {rule.isActive ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Aktif
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-400 text-xs font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Nonaktif
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4 px-5 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => console.log("Edit", rule.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors" title="Edit">
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </button>
                                            <button onClick={() => console.log("Hapus", rule.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="Hapus">
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ViewAllSettings;
