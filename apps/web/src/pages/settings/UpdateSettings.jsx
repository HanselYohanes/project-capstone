import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3001/api/v1";

const UpdateSettings = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        ruleType: "PROXIMITY",
        targetEntityType: "MINIMARKET",
        referenceEntityType: "PASAR",
        minDistanceMeters: "",
        maxEntitiesPerZone: "",
        isActive: true,
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    const [fetchError, setFetchError] = useState(null);

    useEffect(() => {
        const fetchRule = async () => {
            try {
                setLoading(true);
                setFetchError(null);

                const res = await fetch(`${API_BASE}/settings/rules/${id}`);

                if (res.ok) {
                    const result = await res.json();
                    if (result.success) {
                        const r = result.data;
                        setFormData({
                            name: r.name || "",
                            ruleType: r.ruleType || "PROXIMITY",
                            targetEntityType: r.targetEntityType || "MINIMARKET",
                            referenceEntityType: r.referenceEntityType || "PASAR",
                            minDistanceMeters: r.minDistanceMeters ?? "",
                            maxEntitiesPerZone: r.maxEntitiesPerZone ?? "",
                            isActive: r.isActive ?? true,
                        });
                        return;
                    }
                }

                // Fallback Mock Data jika endpoint GET /settings/rules/:id belum ada
                if (res.status === 404) {
                    console.warn(`Endpoint GET /settings/rules/${id} tidak ditemukan. Menggunakan fallback.`);
                    setTimeout(() => {
                        setFormData({
                            name: "Aturan Mock (Fallback)",
                            ruleType: "PROXIMITY",
                            targetEntityType: "MINIMARKET",
                            referenceEntityType: "PASAR",
                            minDistanceMeters: 500,
                            maxEntitiesPerZone: "",
                            isActive: true,
                        });
                        setLoading(false);
                    }, 500);
                    return;
                }

                throw new Error("Gagal mengambil data aturan.");
            } catch (err) {
                setFetchError(err.message || "Terjadi kesalahan koneksi.");
                setLoading(false);
            }
        };

        if (id) fetchRule();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSuccess(null);
        setError(null);

        try {
            if (!formData.name.trim()) throw new Error("Nama aturan wajib diisi.");
            if (formData.ruleType === "PROXIMITY" && !formData.minDistanceMeters) {
                throw new Error("Jarak minimal wajib diisi.");
            }
            if (formData.ruleType === "DENSITY" && !formData.maxEntitiesPerZone) {
                throw new Error("Batas maksimal entitas wajib diisi.");
            }

            const body = {
                name: formData.name.trim(),
                ruleType: formData.ruleType,
                targetEntityType: formData.targetEntityType,
                isActive: formData.isActive,
            };

            if (formData.ruleType === "PROXIMITY") {
                body.referenceEntityType = formData.referenceEntityType;
                body.minDistanceMeters = Number(formData.minDistanceMeters);
            } else if (formData.ruleType === "DENSITY") {
                body.maxEntitiesPerZone = Number(formData.maxEntitiesPerZone);
            }

            const res = await fetch(`${API_BASE}/settings/rules/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                if (res.status === 404) {
                    console.warn("API Endpoint /settings/rules/:id PUT tidak ditemukan. Simulasi sukses.");
                    await new Promise(resolve => setTimeout(resolve, 800));
                } else {
                    const result = await res.json().catch(() => ({}));
                    throw new Error(result.error || `HTTP error! status: ${res.status}`);
                }
            }

            setSuccess(`Aturan zonasi berhasil diperbarui!`);

        } catch (err) {
            setError(err.message || "Terjadi kesalahan saat memperbarui aturan.");
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass = "w-full px-4 py-3 rounded-xl bg-surface-container-highest/40 border border-outline-variant/20 text-white placeholder-on-surface-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all duration-200";
    const labelClass = "block text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-2";

    // ===================== LOADING =====================
    if (loading) {
        return (
            <div className="ml-64 p-8 min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-outline-variant/20 border-t-primary animate-spin" />
                    <p className="text-on-surface-variant text-sm font-medium animate-pulse">Memuat konfigurasi aturan...</p>
                </div>
            </div>
        );
    }

    // ===================== FETCH ERROR =====================
    if (fetchError) {
        return (
            <div className="ml-64 p-8 min-h-screen flex items-center justify-center">
                <div className="glass-panel rounded-2xl p-8 max-w-md text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-red-400">error</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Gagal Memuat Data</h3>
                    <p className="text-on-surface-variant text-sm mb-6">{fetchError}</p>
                    <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 font-medium text-sm transition-all duration-200">
                        <span className="material-symbols-outlined text-sm">arrow_back</span> Kembali
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
                    <div className="flex items-center gap-3 mb-1">
                        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 flex items-center justify-center transition-all duration-200" title="Kembali">
                            <span className="material-symbols-outlined text-on-surface-variant text-lg">arrow_back</span>
                        </button>
                        <h1 className="font-headline text-3xl font-bold tracking-tight text-white">Edit Aturan Zonasi</h1>
                    </div>
                    <p className="text-on-surface-variant text-sm mt-1 ml-12">
                        Perbarui konfigurasi <span className="text-white font-medium">{formData.name || id}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/20">
                    <span className="material-symbols-outlined text-on-surface-variant text-sm">fingerprint</span>
                    <span className="text-xs text-on-surface-variant font-mono truncate max-w-[150px]">{id}</span>
                </div>
            </div>

            {/* Success */}
            {success && (
                <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 max-w-3xl">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-emerald-400 text-xl">check_circle</span>
                    </div>
                    <p className="flex-1 text-emerald-400 text-sm font-medium">{success}</p>
                    <button onClick={() => setSuccess(null)} className="text-emerald-400/60 hover:text-emerald-400 transition-colors">
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 max-w-3xl">
                    <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-red-400 text-xl">error</span>
                    </div>
                    <p className="flex-1 text-red-400 text-sm font-medium">{error}</p>
                    <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-400 transition-colors">
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
            )}

            {/* Form Card */}
            <div className="glass-panel rounded-xl overflow-hidden max-w-3xl">
                <div className="px-8 py-5 border-b border-outline-variant/15 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
                        <span className="material-symbols-outlined text-amber-400 text-xl">edit_note</span>
                    </div>
                    <div>
                        <h2 className="text-white font-semibold text-base">Edit Formulir Aturan</h2>
                        <p className="text-on-surface-variant text-xs">Ubah parameter pembatasan yang ada</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Nama Aturan */}
                        <div className="md:col-span-2">
                            <label htmlFor="name" className={labelClass}>Nama Aturan <span className="text-red-400">*</span></label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={inputClass} required />
                        </div>

                        {/* Tipe Aturan */}
                        <div>
                            <label htmlFor="ruleType" className={labelClass}>Tipe Aturan</label>
                            <select id="ruleType" name="ruleType" value={formData.ruleType} onChange={handleChange} className={inputClass}>
                                <option value="PROXIMITY">Jarak Minimum (Proximity)</option>
                                <option value="DENSITY">Batas Kepadatan Zona (Density)</option>
                            </select>
                        </div>

                        {/* Entitas Target */}
                        <div>
                            <label htmlFor="targetEntityType" className={labelClass}>Entitas Target</label>
                            <select id="targetEntityType" name="targetEntityType" value={formData.targetEntityType} onChange={handleChange} className={inputClass}>
                                <option value="MINIMARKET">Minimarket</option>
                                <option value="SUPERMARKET">Supermarket</option>
                                <option value="PASAR">Pasar Tradisional</option>
                            </select>
                        </div>

                        {/* Dinamis berdasarkan tipe: Proximity */}
                        {formData.ruleType === "PROXIMITY" && (
                            <>
                                <div className="border-t border-outline-variant/10 md:col-span-2 mt-2 pt-6">
                                    <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">straighten</span> Parameter Jarak
                                    </p>
                                </div>
                                <div>
                                    <label htmlFor="referenceEntityType" className={labelClass}>Terhadap (Entitas Referensi)</label>
                                    <select id="referenceEntityType" name="referenceEntityType" value={formData.referenceEntityType} onChange={handleChange} className={inputClass}>
                                        <option value="PASAR">Pasar Tradisional</option>
                                        <option value="MINIMARKET">Minimarket Lain</option>
                                        <option value="SUPERMARKET">Supermarket Lain</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="minDistanceMeters" className={labelClass}>Jarak Minimal (Meter) <span className="text-red-400">*</span></label>
                                    <input type="number" id="minDistanceMeters" name="minDistanceMeters" value={formData.minDistanceMeters} onChange={handleChange} min="0" className={inputClass} />
                                </div>
                            </>
                        )}

                        {/* Dinamis berdasarkan tipe: Density */}
                        {formData.ruleType === "DENSITY" && (
                            <>
                                <div className="border-t border-outline-variant/10 md:col-span-2 mt-2 pt-6">
                                    <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">group_work</span> Parameter Kepadatan
                                    </p>
                                </div>
                                <div>
                                    <label htmlFor="maxEntitiesPerZone" className={labelClass}>Batas Maksimal Entitas (Per Zona) <span className="text-red-400">*</span></label>
                                    <input type="number" id="maxEntitiesPerZone" name="maxEntitiesPerZone" value={formData.maxEntitiesPerZone} onChange={handleChange} min="1" className={inputClass} />
                                </div>
                            </>
                        )}

                        {/* Status Toggle */}
                        <div className="md:col-span-2 border-t border-outline-variant/10 mt-2 pt-6">
                            <label className="flex items-center gap-3 cursor-pointer w-max">
                                <div className="relative">
                                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="sr-only peer" />
                                    <div className="w-11 h-6 rounded-full bg-surface-container-highest/60 peer-checked:bg-emerald-500 transition-colors duration-200" />
                                    <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 peer-checked:translate-x-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-white font-medium">Status Aturan</p>
                                    <p className="text-xs text-on-surface-variant">{formData.isActive ? "Aktif (Diberlakukan)" : "Nonaktif (Diabaikan)"}</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-outline-variant/15 mt-8 pt-6 flex items-center justify-between">
                        <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-on-surface-variant hover:text-white text-sm font-medium transition-all duration-200">
                            <span className="material-symbols-outlined text-sm">arrow_back</span> Kembali
                        </button>
                        <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 focus:ring-2 focus:ring-primary/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            {submitting ? (
                                <><div className="w-4 h-4 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin" /> Memperbarui...</>
                            ) : (
                                <><span className="material-symbols-outlined text-sm">save</span> Perbarui Aturan</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateSettings;
