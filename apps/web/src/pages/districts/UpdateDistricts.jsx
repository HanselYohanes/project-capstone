import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3001/api/v1";

const UpdateDistricts = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        latitude: "",
        longitude: "",
        saturationPercent: 0,
        status: "STABLE",
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    const [fetchError, setFetchError] = useState(null);

    // --- Fetch existing district data on mount ---
    useEffect(() => {
        const fetchDistrict = async () => {
            try {
                setLoading(true);
                setFetchError(null);

                const response = await fetch(`${API_BASE}/districts/${id}`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                if (result.success && result.data) {
                    const d = result.data;
                    setFormData({
                        name: d.name || "",
                        code: d.code || "",
                        latitude: d.latitude ?? "",
                        longitude: d.longitude ?? "",
                        saturationPercent: d.saturationPercent ?? 0,
                        status: d.status || "STABLE",
                    });
                } else {
                    throw new Error("Data distrik tidak ditemukan.");
                }
            } catch (err) {
                setFetchError(err.message || "Gagal memuat data distrik.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDistrict();
        }
    }, [id]);

    // --- Handle input change ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // --- Handle submit (PUT) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSuccess(null);
        setError(null);

        try {
            // Validasi sederhana
            if (!formData.name.trim() || !formData.code.trim()) {
                throw new Error("Nama dan Kode distrik wajib diisi.");
            }

            if (!formData.latitude && formData.latitude !== 0) {
                throw new Error("Latitude wajib diisi.");
            }

            if (!formData.longitude && formData.longitude !== 0) {
                throw new Error("Longitude wajib diisi.");
            }

            const response = await fetch(`${API_BASE}/districts/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    code: formData.code.trim(),
                    latitude: Number(formData.latitude),
                    longitude: Number(formData.longitude),
                    saturationPercent: Number(formData.saturationPercent),
                    status: formData.status,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            setSuccess(`Distrik "${result.data.name}" berhasil diperbarui!`);
        } catch (err) {
            setError(err.message || "Terjadi kesalahan saat memperbarui data.");
        } finally {
            setSubmitting(false);
        }
    };

    // --- Helper: input field class ---
    const inputClass =
        "w-full px-4 py-3 rounded-xl bg-surface-container-highest/40 border border-outline-variant/20 text-white placeholder-on-surface-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all duration-200";

    const labelClass =
        "block text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-2";

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

    // ===================== FETCH ERROR STATE =====================
    if (fetchError) {
        return (
            <div className="ml-64 p-8 min-h-screen flex items-center justify-center">
                <div className="glass-panel rounded-2xl p-8 max-w-md text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-red-400">error</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Gagal Memuat Data</h3>
                    <p className="text-on-surface-variant text-sm mb-6">{fetchError}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 font-medium text-sm transition-all duration-200"
                    >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Kembali
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
                    <div className="flex items-center gap-3 mb-1">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 flex items-center justify-center transition-all duration-200"
                            title="Kembali"
                        >
                            <span className="material-symbols-outlined text-on-surface-variant text-lg">arrow_back</span>
                        </button>
                        <h1 className="font-headline text-3xl font-bold tracking-tight text-white">
                            Edit Distrik
                        </h1>
                    </div>
                    <p className="text-on-surface-variant text-sm mt-1 ml-12">
                        Perbarui data kecamatan <span className="text-white font-medium">{formData.name || id}</span>
                    </p>
                </div>

                {/* ID Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/20">
                    <span className="material-symbols-outlined text-on-surface-variant text-sm">fingerprint</span>
                    <span className="text-xs text-on-surface-variant font-mono">{id}</span>
                </div>
            </div>

            {/* --- Success Message --- */}
            {success && (
                <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-[fadeIn_0.3s_ease-out]">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-emerald-400 text-xl">check_circle</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-emerald-400 text-sm font-medium">{success}</p>
                    </div>
                    <button
                        onClick={() => setSuccess(null)}
                        className="text-emerald-400/60 hover:text-emerald-400 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
            )}

            {/* --- Error Message --- */}
            {error && (
                <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-[fadeIn_0.3s_ease-out]">
                    <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-red-400 text-xl">error</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-red-400 text-sm font-medium">{error}</p>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-400/60 hover:text-red-400 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
            )}

            {/* --- Form Card --- */}
            <div className="glass-panel rounded-xl overflow-hidden max-w-3xl">

                {/* Card Header */}
                <div className="px-8 py-5 border-b border-outline-variant/15 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
                        <span className="material-symbols-outlined text-amber-400 text-xl">edit_location_alt</span>
                    </div>
                    <div>
                        <h2 className="text-white font-semibold text-base">Edit Formulir Distrik</h2>
                        <p className="text-on-surface-variant text-xs">Ubah field yang ingin diperbarui</p>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Nama Distrik */}
                        <div>
                            <label htmlFor="name" className={labelClass}>
                                Nama Distrik <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Contoh: Kebayoran Baru"
                                className={inputClass}
                                required
                            />
                        </div>

                        {/* Kode */}
                        <div>
                            <label htmlFor="code" className={labelClass}>
                                Kode Distrik <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                id="code"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                placeholder="Contoh: KBB-01"
                                className={inputClass}
                                required
                            />
                        </div>

                        {/* Latitude */}
                        <div>
                            <label htmlFor="latitude" className={labelClass}>
                                Latitude <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="number"
                                id="latitude"
                                name="latitude"
                                value={formData.latitude}
                                onChange={handleChange}
                                placeholder="Contoh: -6.2415"
                                step="any"
                                className={inputClass}
                                required
                            />
                        </div>

                        {/* Longitude */}
                        <div>
                            <label htmlFor="longitude" className={labelClass}>
                                Longitude <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="number"
                                id="longitude"
                                name="longitude"
                                value={formData.longitude}
                                onChange={handleChange}
                                placeholder="Contoh: 106.7834"
                                step="any"
                                className={inputClass}
                                required
                            />
                        </div>

                        {/* Persentase Kejenuhan */}
                        <div>
                            <label htmlFor="saturationPercent" className={labelClass}>
                                Persentase Kejenuhan (%)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    id="saturationPercent"
                                    name="saturationPercent"
                                    value={formData.saturationPercent}
                                    onChange={handleChange}
                                    placeholder="0"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    className={inputClass}
                                />
                                {/* Mini progress indicator */}
                                <div className="mt-2 h-1.5 rounded-full bg-surface-container-highest/40 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${Number(formData.saturationPercent) >= 80
                                            ? "bg-red-500"
                                            : Number(formData.saturationPercent) >= 50
                                                ? "bg-amber-500"
                                                : "bg-emerald-500"
                                            }`}
                                        style={{ width: `${Math.min(Math.max(Number(formData.saturationPercent), 0), 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status" className={labelClass}>
                                Status
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className={inputClass}
                            >
                                <option value="STABLE">🟢 Stable</option>
                                <option value="WARNING">🟡 Warning</option>
                                <option value="CRITICAL">🔴 Critical</option>
                            </select>
                        </div>
                    </div>

                    {/* Divider + Actions */}
                    <div className="border-t border-outline-variant/15 mt-8 pt-6">
                        <div className="flex items-center justify-between">
                            {/* Back Button */}
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-on-surface-variant hover:text-white text-sm font-medium transition-all duration-200"
                            >
                                <span className="material-symbols-outlined text-sm">arrow_back</span>
                                Kembali
                            </button>

                            <div className="flex items-center gap-3">
                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 focus:ring-2 focus:ring-primary/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-4 h-4 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-sm">save</span>
                                            Perbarui Distrik
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateDistricts;
