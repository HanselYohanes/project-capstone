import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:3001/api/v1";

const ViewAllEntities = () => {
    const [entities, setEntities] = useState([]);
    const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);

    const fetchEntities = async (pageNum = 1) => {
        try {
            setLoading(true);
            setError(null);

            const res = await fetch(`${API_BASE}/entities?page=${pageNum}&limit=20`);
            const result = await res.json();

            if (!res.ok || !result.success) throw new Error("Gagal mengambil data entitas.");

            setEntities(result.data);
            setMeta(result.meta);
            setPage(pageNum);
        } catch (err) {
            setError(err.message || "Terjadi kesalahan.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEntities(); }, []);

    // Helpers
    const permitBadge = (status) => {
        const base = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase";
        const map = {
            APPROVED: `${base} bg-emerald-500/15 text-emerald-400`,
            UNDER_REVIEW: `${base} bg-amber-500/15 text-amber-400`,
            REJECTED: `${base} bg-red-500/15 text-red-400`,
            EXPIRED: `${base} bg-slate-500/15 text-slate-400`,
        };
        return <span className={map[status] || `${base} bg-slate-500/15 text-slate-400`}>{status || "—"}</span>;
    };

    const typeBadge = (type) => {
        const icons = { PASAR: "storefront", MINIMARKET: "local_convenience_store", SUPERMARKET: "shopping_cart" };
        const colors = { PASAR: "text-amber-400 bg-amber-500/15", MINIMARKET: "text-emerald-400 bg-emerald-500/15", SUPERMARKET: "text-primary bg-primary/15" };
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${colors[type] || "text-slate-400 bg-slate-500/15"}`}>
                <span className="material-symbols-outlined text-sm">{icons[type] || "store"}</span>
                {type}
            </span>
        );
    };

    const complianceColor = (score) => score >= 70 ? "text-emerald-400" : score >= 40 ? "text-amber-400" : "text-red-400";
    const complianceBar = (score) => score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";

    // ===================== LOADING =====================
    if (loading) {
        return (
            <div className="ml-64 p-8 min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-outline-variant/20 border-t-primary animate-spin" />
                    <p className="text-on-surface-variant text-sm font-medium animate-pulse">Memuat data entitas...</p>
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
                    <button onClick={() => fetchEntities()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 font-medium text-sm transition-all duration-200">
                        <span className="material-symbols-outlined text-sm">refresh</span> Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    // ===================== MAIN =====================
    return (
        <div className="ml-64 p-8 min-h-screen text-on-surface">

            {/* Header */}
            <div className="flex items-end justify-between mb-8">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight text-white">Semua Entitas</h1>
                    <p className="text-on-surface-variant text-sm mt-1">Daftar seluruh entitas ritel yang terdaftar dalam sistem Zonify.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/20 text-xs text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">database</span>
                        {meta.total} total
                    </div>
                    <button onClick={() => fetchEntities(page)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-medium border border-outline-variant/20 transition-all duration-200">
                        <span className="material-symbols-outlined text-sm">refresh</span> Refresh
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="glass-panel rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-low/50 border-b border-outline-variant/20">
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">#</th>
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Nama</th>
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Tipe</th>
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Alamat</th>
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Kecamatan</th>
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase tracking-wider font-semibold text-center">Status Izin</th>
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase tracking-wider font-semibold text-center">Kepatuhan</th>
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase tracking-wider font-semibold text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10 text-sm">
                            {entities.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                                        <span className="material-symbols-outlined text-4xl text-outline-variant/40 block mb-2">folder_off</span>
                                        Tidak ada data entitas.
                                    </td>
                                </tr>
                            ) : entities.map((entity, i) => (
                                <tr key={entity.id} className="hover:bg-surface-container-highest/30 transition-colors duration-150">
                                    <td className="py-3.5 px-5 text-on-surface-variant font-medium">
                                        {String((page - 1) * 20 + i + 1).padStart(2, "0")}
                                    </td>
                                    <td className="py-3.5 px-5">
                                        <div className="flex items-center gap-2">
                                            {entity.isFlagged && (
                                                <span className="material-symbols-outlined text-red-400 text-sm" title="Flagged">flag</span>
                                            )}
                                            <span className="text-white font-medium truncate max-w-[200px]">{entity.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-5">{typeBadge(entity.type)}</td>
                                    <td className="py-3.5 px-5">
                                        <span className="text-on-surface-variant truncate block max-w-[180px]" title={entity.address}>
                                            {entity.address || "—"}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-5 text-white">{entity.district?.name || "—"}</td>
                                    <td className="py-3.5 px-5 text-center">{permitBadge(entity.permitStatus)}</td>
                                    <td className="py-3.5 px-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-16 h-1.5 rounded-full bg-surface-container-highest/40 overflow-hidden">
                                                <div className={`h-full rounded-full ${complianceBar(entity.complianceScore)} transition-all duration-500`} style={{ width: `${Math.min(entity.complianceScore, 100)}%` }} />
                                            </div>
                                            <span className={`text-xs font-semibold tabular-nums ${complianceColor(entity.complianceScore)}`}>
                                                {entity.complianceScore}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-5 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button onClick={() => console.log("Detail:", entity.id)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-all duration-200" title="Detail">
                                                <span className="material-symbols-outlined text-sm">visibility</span>
                                            </button>
                                            <button onClick={() => console.log("Edit:", entity.id)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-medium transition-all duration-200" title="Edit">
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </button>
                                            <button onClick={() => console.log("Delete:", entity.id)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-all duration-200" title="Hapus">
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-outline-variant/15 flex items-center justify-between">
                        <p className="text-xs text-on-surface-variant">
                            Halaman {meta.page} dari {meta.totalPages} · {meta.total} entitas
                        </p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => fetchEntities(page - 1)} disabled={page <= 1} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium border border-outline-variant/20 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed">
                                <span className="material-symbols-outlined text-sm">chevron_left</span> Prev
                            </button>
                            <button onClick={() => fetchEntities(page + 1)} disabled={page >= meta.totalPages} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium border border-outline-variant/20 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed">
                                Next <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewAllEntities;
