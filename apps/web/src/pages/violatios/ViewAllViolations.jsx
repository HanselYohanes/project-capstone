import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:3001/api/v1";

const ViewAllViolations = () => {
    const [violations, setViolations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter states
    const [filterStatus, setFilterStatus] = useState("");
    const [filterSeverity, setFilterSeverity] = useState("");

    const fetchViolations = async () => {
        try {
            setLoading(true);
            setError(null);

            // Construct query parameters
            const params = new URLSearchParams();
            if (filterStatus) params.append("status", filterStatus);
            if (filterSeverity) params.append("severity", filterSeverity);
            params.append("limit", 50);

            const res = await fetch(`${API_BASE}/violations?${params.toString()}`);
            const result = await res.json();

            if (!res.ok || !result.success) {
                throw new Error(result.error || "Gagal mengambil data pelanggaran.");
            }

            setViolations(result.data?.data || result.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchViolations();
    }, [filterStatus, filterSeverity]);

    const getSeverityBadge = (severity) => {
        const badges = {
            CRITICAL: "bg-red-500/15 text-red-400 border-red-500/20",
            WARNING: "bg-amber-500/15 text-amber-400 border-amber-500/20",
            ELEVATED: "bg-orange-500/15 text-orange-400 border-orange-500/20",
            STABLE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
        };
        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${badges[severity] || badges.STABLE}`}>
                {severity}
            </span>
        );
    };

    const getStatusBadge = (status) => {
        const badges = {
            ACTIVE: "bg-red-500/10 text-red-400",
            UNDER_REVIEW: "bg-amber-500/10 text-amber-400",
            RESOLVED: "bg-emerald-500/10 text-emerald-400"
        };
        const dots = {
            ACTIVE: "bg-red-400",
            UNDER_REVIEW: "bg-amber-400",
            RESOLVED: "bg-emerald-400"
        };
        const labels = {
            ACTIVE: "Aktif",
            UNDER_REVIEW: "Ditinjau",
            RESOLVED: "Selesai"
        };

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badges[status] || badges.ACTIVE}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || dots.ACTIVE}`} />
                {labels[status] || status}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("id-ID", {
            day: "numeric", month: "short", year: "numeric",
        }).format(date);
    };

    // ===================== LOADING =====================
    if (loading && violations.length === 0) {
        return (
            <div className="ml-64 p-8 min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-outline-variant/20 border-t-primary animate-spin" />
                    <p className="text-on-surface-variant text-sm font-medium animate-pulse">Memuat daftar pelanggaran...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="ml-64 p-8 min-h-screen text-on-surface">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight text-white">Daftar Pelanggaran</h1>
                    <p className="text-on-surface-variant text-sm mt-1">Data riwayat pelanggaran zonasi yang terjadi di berbagai distrik.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchViolations} className="p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 transition-colors" title="Muat Ulang">
                        <span className="material-symbols-outlined text-on-surface-variant text-sm">refresh</span>
                    </button>
                    <Link to="/violations/create" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-sm">add</span>
                        Tambah Data
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-xl glass-panel">
                <span className="material-symbols-outlined text-on-surface-variant text-sm">filter_list</span>
                <span className="text-sm text-on-surface-variant font-medium mr-2">Filter:</span>

                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/20 text-white text-xs focus:outline-none focus:border-primary/50">
                    <option value="">Semua Status</option>
                    <option value="ACTIVE">Status: Aktif</option>
                    <option value="UNDER_REVIEW">Status: Dalam Tinjauan</option>
                    <option value="RESOLVED">Status: Selesai</option>
                </select>

                <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} className="px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/20 text-white text-xs focus:outline-none focus:border-primary/50">
                    <option value="">Semua Tingkat Keparahan</option>
                    <option value="CRITICAL">Severity: Critical</option>
                    <option value="WARNING">Severity: Warning</option>
                    <option value="ELEVATED">Severity: Elevated</option>
                </select>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <span className="material-symbols-outlined text-red-400">warning</span>
                    <p className="text-red-400 text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Table */}
            <div className="glass-panel rounded-xl overflow-hidden relative">
                {/* Overlay loading state during filter change */}
                {loading && violations.length > 0 && (
                    <div className="absolute inset-0 z-10 bg-surface/50 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-outline-variant/20 border-t-primary animate-spin" />
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-low/50 border-b border-outline-variant/20">
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Entitas & Kode</th>
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Kecamatan</th>
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Tipe & Defisit</th>
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Keparahan</th>
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Tanggal & Status</th>
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase tracking-wider font-semibold text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10 text-sm">
                            {violations.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                                        <span className="material-symbols-outlined text-4xl text-outline-variant/40 block mb-2">gavel</span>
                                        Tidak ada data pelanggaran yang ditemukan.
                                    </td>
                                </tr>
                            ) : violations.map((v) => (
                                <tr key={v.id} className="hover:bg-surface-container-highest/30 transition-colors duration-150">
                                    <td className="py-4 px-5">
                                        <p className="text-white font-medium truncate max-w-[200px]" title={v.entity?.name}>
                                            {v.entity?.name || "Tidak Diketahui"}
                                        </p>
                                        <p className="text-xs text-on-surface-variant mt-0.5 font-mono">{v.code}</p>
                                    </td>
                                    <td className="py-4 px-5 text-on-surface-variant">
                                        {v.district?.name || "-"}
                                    </td>
                                    <td className="py-4 px-5">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs text-on-surface-variant">{v.ruleType}</span>
                                            {v.distanceM !== null && v.distanceM !== undefined && (
                                                <span className="inline-flex items-center gap-1 text-[11px] text-amber-400">
                                                    <span className="material-symbols-outlined text-[12px]">straighten</span>
                                                    {v.distanceM}m
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-5">
                                        {getSeverityBadge(v.severity)}
                                    </td>
                                    <td className="py-4 px-5">
                                        <div className="flex flex-col items-start gap-1.5">
                                            <span className="text-xs text-on-surface-variant">{formatDate(v.detectedAt)}</span>
                                            {getStatusBadge(v.status)}
                                        </div>
                                    </td>
                                    <td className="py-4 px-5 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link to={`/violations/update/${v.id}`} className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors" title="Edit">
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </Link>
                                            <button onClick={() => console.log("Hapus", v.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="Hapus">
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

export default ViewAllViolations;
