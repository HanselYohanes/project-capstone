import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SAVED_SEARCHES_KEY = "zonify_saved_searches";

const ViewAllSearch = () => {
    const navigate = useNavigate();
    const [savedSearches, setSavedSearches] = useState([]);
    const [loading, setLoading] = useState(true);

    // Simulasi loading & ambil data dari localStorage
    useEffect(() => {
        const loadSearches = () => {
            setLoading(true);
            try {
                const stored = localStorage.getItem(SAVED_SEARCHES_KEY);
                if (stored) {
                    setSavedSearches(JSON.parse(stored));
                } else {
                    // Data dummy jika kosong (untuk testing UI)
                    const dummyData = [
                        {
                            id: "1",
                            name: "Minimarket Bermasalah di Tebet",
                            query: "Tebet",
                            type: "entity",
                            filters: { entityType: "MINIMARKET", isFlagged: true },
                            createdAt: new Date().toISOString(),
                        },
                        {
                            id: "2",
                            name: "Distrik Kritis (>80%)",
                            query: "",
                            type: "district",
                            filters: { status: "CRITICAL" },
                            createdAt: new Date(Date.now() - 86400000).toISOString(),
                        }
                    ];
                    setSavedSearches(dummyData);
                    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(dummyData));
                }
            } catch (err) {
                console.error("Gagal membaca riwayat pencarian", err);
            } finally {
                // Sengaja di-delay sedikit untuk efek loading
                setTimeout(() => setLoading(false), 500);
            }
        };

        loadSearches();
    }, []);

    const handleDelete = (id) => {
        const updated = savedSearches.filter(s => s.id !== id);
        setSavedSearches(updated);
        localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated));
    };

    const handleUseSearch = (searchItem) => {
        // Build query string berdasarkan config yang disimpan
        const params = new URLSearchParams();
        if (searchItem.query) params.append("q", searchItem.query);
        if (searchItem.type) params.append("type", searchItem.type);

        if (searchItem.filters) {
            Object.entries(searchItem.filters).forEach(([key, val]) => {
                if (val !== undefined && val !== "") params.append(key, val);
            });
        }

        // Navigasi ke halaman utama pencarian (misal /search atau /map) dengan query params
        console.log("Navigating to /search?" + params.toString());
        // navigate(`/search?${params.toString()}`);
    };

    const timeAgo = (dateStr) => {
        if (!dateStr) return "-";
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins} menit lalu`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs} jam lalu`;
        return `${Math.floor(hrs / 24)} hari lalu`;
    };

    const getTypeBadge = (type) => {
        const map = {
            entity: { icon: "storefront", label: "Entitas", color: "text-emerald-400 bg-emerald-500/15" },
            district: { icon: "map", label: "Distrik", color: "text-primary bg-primary/15" },
            violation: { icon: "gavel", label: "Pelanggaran", color: "text-red-400 bg-red-500/15" },
            cluster: { icon: "hub", label: "Cluster", color: "text-amber-400 bg-amber-500/15" },
            all: { icon: "search", label: "Semua Kategori", color: "text-slate-300 bg-slate-500/20" },
        };
        const config = map[type] || map.all;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
                <span className="material-symbols-outlined text-xs">{config.icon}</span>
                {config.label}
            </span>
        );
    };

    // ===================== LOADING =====================
    if (loading) {
        return (
            <div className="ml-64 p-8 min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-outline-variant/20 border-t-primary animate-spin" />
                    <p className="text-on-surface-variant text-sm font-medium animate-pulse">Memuat riwayat pencarian...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="ml-64 p-8 min-h-screen text-on-surface">
            {/* Header */}
            <div className="flex items-end justify-between mb-8">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight text-white">Pencarian Tersimpan</h1>
                    <p className="text-on-surface-variant text-sm mt-1">Daftar riwayat dan filter pencarian yang sering Anda gunakan.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-sm">add</span>
                    Pencarian Baru
                </button>
            </div>

            {/* Grid Cards */}
            {savedSearches.length === 0 ? (
                <div className="glass-panel rounded-2xl p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-surface-container-highest/40 flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant/60">search_off</span>
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">Belum Ada Pencarian</h3>
                    <p className="text-on-surface-variant text-sm max-w-sm mx-auto">
                        Anda belum menyimpan riwayat pencarian. Gunakan fitur pencarian utama untuk menyimpan filter favorit Anda.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedSearches.map((item) => (
                        <div key={item.id} className="glass-panel rounded-2xl p-6 flex flex-col hover:border-outline-variant/40 transition-colors duration-300 relative group">

                            {/* Badge Type */}
                            <div className="absolute top-6 right-6">
                                {getTypeBadge(item.type)}
                            </div>

                            {/* Info */}
                            <h3 className="text-lg font-bold text-white mb-2 pr-24 truncate" title={item.name}>{item.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-4">
                                <span className="material-symbols-outlined text-sm">history</span>
                                Disimpan {timeAgo(item.createdAt)}
                            </div>

                            {/* Query Box */}
                            <div className="bg-surface-container-low/50 rounded-xl p-4 mb-6 border border-outline-variant/10 flex-1">
                                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-2">Query & Filter</p>
                                <div className="space-y-1.5">
                                    {item.query ? (
                                        <p className="text-sm text-white"><span className="text-on-surface-variant">Kata Kunci:</span> "{item.query}"</p>
                                    ) : (
                                        <p className="text-sm text-on-surface-variant italic">Tanpa kata kunci</p>
                                    )}

                                    {item.filters && Object.keys(item.filters).length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                            {Object.entries(item.filters).map(([k, v]) => (
                                                <span key={k} className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-container-highest/40 border border-outline-variant/20 text-[11px] text-on-surface-variant font-medium">
                                                    {k}: <span className="text-white ml-1">{v.toString()}</span>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-auto pt-4 border-t border-outline-variant/15">
                                <button
                                    onClick={() => handleUseSearch(item)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-sm font-semibold transition-colors duration-200"
                                >
                                    <span className="material-symbols-outlined text-sm">search</span>
                                    Gunakan
                                </button>
                                <button
                                    onClick={() => console.log("Edit:", item.id)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high text-amber-400 border border-outline-variant/20 transition-colors duration-200"
                                    title="Edit"
                                >
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container hover:bg-red-500/10 text-red-400 border border-outline-variant/20 transition-colors duration-200"
                                    title="Hapus"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ViewAllSearch;
