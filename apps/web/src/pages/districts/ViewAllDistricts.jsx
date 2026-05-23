import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:3001/api/v1";

const ViewAllDistricts = () => {
    const [districts, setDistricts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDistricts = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_BASE}/districts`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                setDistricts(result.data);
            } else {
                throw new Error("Gagal mengambil data distrik.");
            }
        } catch (err) {
            setError(err.message || "Terjadi kesalahan saat mengambil data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDistricts();
    }, []);

    // --- Helper: status badge styling ---
    const getStatusBadge = (status) => {
        const base =
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase";

        switch (status) {
            case "CRITICAL":
                return (
                    <span className={`${base} bg-red-500/15 text-red-400 ring-1 ring-red-500/25`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                        Critical
                    </span>
                );
            case "WARNING":
                return (
                    <span className={`${base} bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Warning
                    </span>
                );
            case "STABLE":
                return (
                    <span className={`${base} bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Stable
                    </span>
                );
            default:
                return (
                    <span className={`${base} bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/25`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        {status || "Unknown"}
                    </span>
                );
        }
    };

    // --- Helper: saturation bar color ---
    const getSaturationColor = (percent) => {
        if (percent >= 80) return "bg-red-500";
        if (percent >= 50) return "bg-amber-500";
        return "bg-emerald-500";
    };

    const getSaturationTextColor = (percent) => {
        if (percent >= 80) return "text-red-400";
        if (percent >= 50) return "text-amber-400";
        return "text-emerald-400";
    };

    // ===================== LOADING STATE =====================
    if (loading) {
        return (
            <div className="ml-64 p-8 min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full border-4 border-outline-variant/20 border-t-primary animate-spin" />
                    </div>
                    <p className="text-on-surface-variant text-sm font-medium animate-pulse">
                        Memuat data distrik...
                    </p>
                </div>
            </div>
        );
    }

    // ===================== ERROR STATE =====================
    if (error) {
        return (
            <div className="ml-64 p-8 min-h-screen flex items-center justify-center">
                <div className="glass-panel rounded-2xl p-8 max-w-md text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-red-400">error</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Gagal Memuat Data</h3>
                    <p className="text-on-surface-variant text-sm mb-6">{error}</p>
                    <button
                        onClick={fetchDistricts}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 font-medium text-sm transition-all duration-200"
                    >
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    // ===================== MAIN VIEW =====================
    return (
        <div className="ml-64 p-8 min-h-screen text-on-surface">

            {/* --- Page Header --- */}
            <div className="flex items-end justify-between mb-8">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight text-white">
                        Semua Distrik
                    </h1>
                    <p className="text-on-surface-variant text-sm mt-1">
                        Daftar seluruh kecamatan beserta tingkat kejenuhan dan status terkini.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchDistricts}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-medium border border-outline-variant/20 transition-all duration-200"
                    >
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        Refresh
                    </button>
                </div>
            </div>

            {/* --- KPI Summary Cards --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Total */}
                <div className="glass-panel rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-xl">location_city</span>
                        </div>
                        <div>
                            <p className="text-xs text-on-surface-variant uppercase tracking-wider">Total Distrik</p>
                            <p className="text-2xl font-bold text-white">{districts.length}</p>
                        </div>
                    </div>
                </div>

                {/* Critical */}
                <div className="glass-panel rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center">
                            <span className="material-symbols-outlined text-red-400 text-xl">warning</span>
                        </div>
                        <div>
                            <p className="text-xs text-on-surface-variant uppercase tracking-wider">Critical</p>
                            <p className="text-2xl font-bold text-red-400">
                                {districts.filter((d) => d.status === "CRITICAL").length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Warning */}
                <div className="glass-panel rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
                            <span className="material-symbols-outlined text-amber-400 text-xl">info</span>
                        </div>
                        <div>
                            <p className="text-xs text-on-surface-variant uppercase tracking-wider">Warning</p>
                            <p className="text-2xl font-bold text-amber-400">
                                {districts.filter((d) => d.status === "WARNING").length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stable */}
                <div className="glass-panel rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                            <span className="material-symbols-outlined text-emerald-400 text-xl">verified</span>
                        </div>
                        <div>
                            <p className="text-xs text-on-surface-variant uppercase tracking-wider">Stable</p>
                            <p className="text-2xl font-bold text-emerald-400">
                                {districts.filter((d) => d.status === "STABLE").length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Table --- */}
            <div className="glass-panel rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-low/50 border-b border-outline-variant/20">
                                <th className="py-4 px-6 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                                    #
                                </th>
                                <th className="py-4 px-6 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                                    Nama
                                </th>
                                <th className="py-4 px-6 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                                    Kode
                                </th>
                                <th className="py-4 px-6 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                                    Kejenuhan
                                </th>
                                <th className="py-4 px-6 text-xs text-on-surface-variant uppercase tracking-wider font-semibold text-center">
                                    Status
                                </th>
                                <th className="py-4 px-6 text-xs text-on-surface-variant uppercase tracking-wider font-semibold text-right">
                                    Entitas
                                </th>
                                <th className="py-4 px-6 text-xs text-on-surface-variant uppercase tracking-wider font-semibold text-right">
                                    Pelanggaran
                                </th>
                                <th className="py-4 px-6 text-xs text-on-surface-variant uppercase tracking-wider font-semibold text-center">
                                    Aksi
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-outline-variant/10 text-sm">
                            {districts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="material-symbols-outlined text-4xl text-outline-variant/40">
                                                folder_off
                                            </span>
                                            <p>Tidak ada data distrik.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                districts.map((district, index) => (
                                    <tr
                                        key={district.id}
                                        className="hover:bg-surface-container-highest/30 transition-colors duration-150"
                                    >
                                        {/* No */}
                                        <td className="py-4 px-6 text-on-surface-variant font-medium">
                                            {String(index + 1).padStart(2, "0")}
                                        </td>

                                        {/* Nama */}
                                        <td className="py-4 px-6 text-white font-medium">
                                            {district.name}
                                        </td>

                                        {/* Kode */}
                                        <td className="py-4 px-6">
                                            <span className="inline-block px-2.5 py-1 rounded-md bg-surface-container text-on-surface-variant text-xs font-mono tracking-wide">
                                                {district.code}
                                            </span>
                                        </td>

                                        {/* Kejenuhan */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 rounded-full bg-surface-container-highest/40 overflow-hidden max-w-[120px]">
                                                    <div
                                                        className={`h-full rounded-full ${getSaturationColor(district.saturationPercent)} transition-all duration-500`}
                                                        style={{ width: `${Math.min(district.saturationPercent, 100)}%` }}
                                                    />
                                                </div>
                                                <span className={`text-xs font-semibold tabular-nums ${getSaturationTextColor(district.saturationPercent)}`}>
                                                    {district.saturationPercent.toFixed(1)}%
                                                </span>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="py-4 px-6 text-center">
                                            {getStatusBadge(district.status)}
                                        </td>

                                        {/* Jumlah Entitas */}
                                        <td className="py-4 px-6 text-right tabular-nums">
                                            {district._count?.entities ?? 0}
                                        </td>

                                        {/* Jumlah Pelanggaran */}
                                        <td className="py-4 px-6 text-right tabular-nums">
                                            <span
                                                className={
                                                    (district._count?.violations ?? 0) > 0
                                                        ? "text-red-400 font-medium"
                                                        : "text-on-surface-variant"
                                                }
                                            >
                                                {district._count?.violations ?? 0}
                                            </span>
                                        </td>

                                        {/* Aksi */}
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => console.log("Lihat Detail:", district.id, district.name)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-all duration-200"
                                                    title="Lihat Detail"
                                                >
                                                    <span className="material-symbols-outlined text-sm">visibility</span>
                                                    Detail
                                                </button>
                                                <button
                                                    onClick={() => console.log("Edit:", district.id, district.name)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-medium transition-all duration-200"
                                                    title="Edit"
                                                >
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

            {/* --- Footer info --- */}
            {districts.length > 0 && (
                <div className="mt-4 text-xs text-on-surface-variant text-right">
                    Menampilkan {districts.length} distrik
                </div>
            )}
        </div>
    );
};

export default ViewAllDistricts;
