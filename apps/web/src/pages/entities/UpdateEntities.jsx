import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3001/api/v1";

const UpdateEntities = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "", type: "MINIMARKET", address: "", latitude: "", longitude: "",
        placeId: "", store: "", kelurahan: "", rating: 0, totalRatings: 0,
        permitStatus: "UNDER_REVIEW", complianceScore: 0, isFlagged: false, districtId: "",
    });

    const [districts, setDistricts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    const [fetchError, setFetchError] = useState(null);

    // Fetch entity + districts on mount
    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);
                setFetchError(null);

                const [entRes, distRes] = await Promise.all([
                    fetch(`${API_BASE}/entities/${id}`),
                    fetch(`${API_BASE}/districts`),
                ]);

                const entData = await entRes.json();
                const distData = await distRes.json();

                if (distData.success) setDistricts(distData.data);

                if (!entRes.ok || !entData.success) throw new Error(entData.error || "Entitas tidak ditemukan.");

                const e = entData.data;
                setFormData({
                    name: e.name || "", type: e.type || "MINIMARKET", address: e.address || "",
                    latitude: e.latitude ?? "", longitude: e.longitude ?? "",
                    placeId: e.placeId || "", store: e.store || "", kelurahan: e.kelurahan || "",
                    rating: e.rating ?? 0, totalRatings: e.totalRatings ?? 0,
                    permitStatus: e.permitStatus || "UNDER_REVIEW",
                    complianceScore: e.complianceScore ?? 0,
                    isFlagged: e.isFlagged ?? false, districtId: e.districtId || "",
                });
            } catch (err) {
                setFetchError(err.message || "Gagal memuat data.");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchAll();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSuccess(null);
        setError(null);

        try {
            if (!formData.name.trim()) throw new Error("Nama entitas wajib diisi.");
            if (!formData.districtId) throw new Error("Kecamatan wajib dipilih.");

            const body = {
                name: formData.name.trim(),
                type: formData.type,
                address: formData.address.trim() || undefined,
                latitude: formData.latitude !== "" ? Number(formData.latitude) : undefined,
                longitude: formData.longitude !== "" ? Number(formData.longitude) : undefined,
                placeId: formData.placeId.trim() || undefined,
                store: formData.store.trim() || undefined,
                kelurahan: formData.kelurahan.trim() || undefined,
                rating: Number(formData.rating),
                totalRatings: Number(formData.totalRatings),
                permitStatus: formData.permitStatus,
                complianceScore: Number(formData.complianceScore),
                isFlagged: formData.isFlagged,
                districtId: formData.districtId,
            };

            const res = await fetch(`${API_BASE}/entities/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || `HTTP error! status: ${res.status}`);

            setSuccess(`Entitas "${result.data?.name || id}" berhasil diperbarui!`);
        } catch (err) {
            setError(err.message || "Terjadi kesalahan saat memperbarui data.");
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
                    <p className="text-on-surface-variant text-sm font-medium animate-pulse">Memuat data entitas...</p>
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
                        <h1 className="font-headline text-3xl font-bold tracking-tight text-white">Edit Entitas</h1>
                    </div>
                    <p className="text-on-surface-variant text-sm mt-1 ml-12">
                        Perbarui data <span className="text-white font-medium">{formData.name || id}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/20">
                    <span className="material-symbols-outlined text-on-surface-variant text-sm">fingerprint</span>
                    <span className="text-xs text-on-surface-variant font-mono truncate max-w-[180px]">{id}</span>
                </div>
            </div>

            {/* Success */}
            {success && (
                <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
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
                <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-red-400 text-xl">error</span>
                    </div>
                    <p className="flex-1 text-red-400 text-sm font-medium">{error}</p>
                    <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-400 transition-colors">
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
            )}

            {/* Form */}
            <div className="glass-panel rounded-xl overflow-hidden max-w-4xl">
                <div className="px-8 py-5 border-b border-outline-variant/15 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
                        <span className="material-symbols-outlined text-amber-400 text-xl">edit_note</span>
                    </div>
                    <div>
                        <h2 className="text-white font-semibold text-base">Edit Formulir Entitas</h2>
                        <p className="text-on-surface-variant text-xs">Ubah field yang ingin diperbarui</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8">

                    {/* Info Utama */}
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">info</span> Informasi Utama
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label htmlFor="name" className={labelClass}>Nama Entitas <span className="text-red-400">*</span></label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Contoh: Indomaret Tebet" className={inputClass} required />
                        </div>
                        <div>
                            <label htmlFor="type" className={labelClass}>Tipe Entitas <span className="text-red-400">*</span></label>
                            <select id="type" name="type" value={formData.type} onChange={handleChange} className={inputClass}>
                                <option value="MINIMARKET">🏪 Minimarket</option>
                                <option value="PASAR">🏬 Pasar</option>
                                <option value="SUPERMARKET">🛒 Supermarket</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="store" className={labelClass}>Nama Toko / Brand</label>
                            <input type="text" id="store" name="store" value={formData.store} onChange={handleChange} placeholder="Contoh: Indomaret" className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="districtId" className={labelClass}>Kecamatan <span className="text-red-400">*</span></label>
                            <select id="districtId" name="districtId" value={formData.districtId} onChange={handleChange} className={inputClass} required>
                                <option value="">— Pilih Kecamatan —</option>
                                {districts.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="address" className={labelClass}>Alamat</label>
                            <textarea id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Alamat lengkap..." rows={2} className={`${inputClass} resize-none`} />
                        </div>
                        <div>
                            <label htmlFor="kelurahan" className={labelClass}>Kelurahan</label>
                            <input type="text" id="kelurahan" name="kelurahan" value={formData.kelurahan} onChange={handleChange} placeholder="Contoh: Tebet Barat" className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="placeId" className={labelClass}>Place ID <span className="text-on-surface-variant">(Opsional)</span></label>
                            <input type="text" id="placeId" name="placeId" value={formData.placeId} onChange={handleChange} placeholder="Google Maps Place ID" className={inputClass} />
                        </div>
                    </div>

                    {/* Lokasi */}
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">location_on</span> Lokasi
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label htmlFor="latitude" className={labelClass}>Latitude</label>
                            <input type="number" id="latitude" name="latitude" value={formData.latitude} onChange={handleChange} placeholder="-6.2415" step="any" className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="longitude" className={labelClass}>Longitude</label>
                            <input type="number" id="longitude" name="longitude" value={formData.longitude} onChange={handleChange} placeholder="106.7834" step="any" className={inputClass} />
                        </div>
                    </div>

                    {/* Status & Skor */}
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">verified</span> Status & Skor
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div>
                            <label htmlFor="permitStatus" className={labelClass}>Status Izin</label>
                            <select id="permitStatus" name="permitStatus" value={formData.permitStatus} onChange={handleChange} className={inputClass}>
                                <option value="APPROVED">✅ Approved</option>
                                <option value="UNDER_REVIEW">🔍 Under Review</option>
                                <option value="REJECTED">❌ Rejected</option>
                                <option value="EXPIRED">⏰ Expired</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="complianceScore" className={labelClass}>Skor Kepatuhan (0-100)</label>
                            <input type="number" id="complianceScore" name="complianceScore" value={formData.complianceScore} onChange={handleChange} min="0" max="100" className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="rating" className={labelClass}>Rating (0-5)</label>
                            <input type="number" id="rating" name="rating" value={formData.rating} onChange={handleChange} min="0" max="5" step="0.1" className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="totalRatings" className={labelClass}>Jumlah Rating</label>
                            <input type="number" id="totalRatings" name="totalRatings" value={formData.totalRatings} onChange={handleChange} min="0" className={inputClass} />
                        </div>
                        <div className="flex items-center">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative">
                                    <input type="checkbox" name="isFlagged" checked={formData.isFlagged} onChange={handleChange} className="sr-only peer" />
                                    <div className="w-11 h-6 rounded-full bg-surface-container-highest/60 peer-checked:bg-red-500 transition-colors duration-200" />
                                    <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 peer-checked:translate-x-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-white font-medium">Tandai Bermasalah</p>
                                    <p className="text-xs text-on-surface-variant">{formData.isFlagged ? "Flagged" : "Tidak ditandai"}</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-outline-variant/15 pt-6 flex items-center justify-between">
                        <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-on-surface-variant hover:text-white text-sm font-medium transition-all duration-200">
                            <span className="material-symbols-outlined text-sm">arrow_back</span> Kembali
                        </button>
                        <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 focus:ring-2 focus:ring-primary/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            {submitting ? (
                                <><div className="w-4 h-4 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin" /> Menyimpan...</>
                            ) : (
                                <><span className="material-symbols-outlined text-sm">save</span> Perbarui Entitas</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateEntities;
