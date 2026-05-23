import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3001/api/v1";
const SAVED_SEARCHES_KEY = "zonify_saved_searches";

const UpdateSearch = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "", query: "", type: "all",
        entityType: "", permitStatus: "",
        districtId: "", severity: "",
    });

    const [districts, setDistricts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    const [fetchError, setFetchError] = useState(null);

    // Fetch districts & load existing search config from localStorage
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setFetchError(null);

            try {
                // 1. Fetch districts for dropdown
                const res = await fetch(`${API_BASE}/districts`);
                const distResult = await res.json();
                if (distResult.success) setDistricts(distResult.data);

                // 2. Load existing search from localStorage
                const storedSearches = JSON.parse(localStorage.getItem(SAVED_SEARCHES_KEY) || "[]");
                const existingSearch = storedSearches.find(s => s.id === id);

                if (!existingSearch) {
                    throw new Error("Konfigurasi pencarian tidak ditemukan.");
                }

                // Pre-fill form
                setFormData({
                    name: existingSearch.name || "",
                    query: existingSearch.query || "",
                    type: existingSearch.type || "all",
                    entityType: existingSearch.filters?.entityType || "",
                    permitStatus: existingSearch.filters?.permitStatus || "",
                    districtId: existingSearch.filters?.districtId || "",
                    severity: existingSearch.filters?.severity || "",
                });

            } catch (err) {
                setFetchError(err.message || "Gagal memuat data pencarian.");
            } finally {
                // Simulate slight delay for smooth UI transition
                setTimeout(() => setLoading(false), 400);
            }
        };

        if (id) loadData();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const newData = { ...prev, [name]: value };
            // Reset irrelevant filters if type changes
            if (name === "type") {
                if (value !== "entity") {
                    newData.entityType = "";
                    newData.permitStatus = "";
                }
                if (value !== "violation") {
                    newData.severity = "";
                }
            }
            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSuccess(null);
        setError(null);

        try {
            if (!formData.name.trim()) throw new Error("Nama pencarian wajib diisi.");

            // Build filters object
            const filters = {};
            if (formData.entityType) filters.entityType = formData.entityType;
            if (formData.permitStatus) filters.permitStatus = formData.permitStatus;
            if (formData.districtId) filters.districtId = formData.districtId;
            if (formData.severity) filters.severity = formData.severity;

            // Load, update, and save back to localStorage
            await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network

            const storedSearches = JSON.parse(localStorage.getItem(SAVED_SEARCHES_KEY) || "[]");
            const index = storedSearches.findIndex(s => s.id === id);

            if (index === -1) throw new Error("Data asli tidak ditemukan, tidak bisa di-update.");

            // Maintain ID and createdAt, update the rest
            storedSearches[index] = {
                ...storedSearches[index],
                name: formData.name.trim(),
                query: formData.query.trim(),
                type: formData.type,
                filters,
                updatedAt: new Date().toISOString(),
            };

            localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(storedSearches));
            setSuccess(`Pencarian "${formData.name.trim()}" berhasil diperbarui!`);

        } catch (err) {
            setError(err.message || "Terjadi kesalahan saat memperbarui.");
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
                    <p className="text-on-surface-variant text-sm font-medium animate-pulse">Memuat konfigurasi pencarian...</p>
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
                    <h3 className="text-lg font-semibold text-white mb-2">Data Tidak Ditemukan</h3>
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
                        <h1 className="font-headline text-3xl font-bold tracking-tight text-white">Edit Pencarian</h1>
                    </div>
                    <p className="text-on-surface-variant text-sm mt-1 ml-12">
                        Perbarui kriteria filter <span className="text-white font-medium">{formData.name || id}</span>
                    </p>
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
                        <h2 className="text-white font-semibold text-base">Edit Konfigurasi Pencarian</h2>
                        <p className="text-on-surface-variant text-xs">Ubah kata kunci dan parameter filter</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Nama Pencarian */}
                        <div className="md:col-span-2">
                            <label htmlFor="name" className={labelClass}>Nama Pencarian (Alias) <span className="text-red-400">*</span></label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Contoh: Minimarket Belum Berizin" className={inputClass} required />
                        </div>

                        {/* Kata Kunci / Query */}
                        <div className="md:col-span-2">
                            <label htmlFor="query" className={labelClass}>Kata Kunci (Query)</label>
                            <input type="text" id="query" name="query" value={formData.query} onChange={handleChange} placeholder="Kosongkan jika hanya ingin menyimpan filter" className={inputClass} />
                        </div>

                        {/* Tipe Pencarian */}
                        <div>
                            <label htmlFor="type" className={labelClass}>Kategori Pencarian</label>
                            <select id="type" name="type" value={formData.type} onChange={handleChange} className={inputClass}>
                                <option value="all">Semua Kategori</option>
                                <option value="entity">Entitas (Pasar/Minimarket)</option>
                                <option value="district">Distrik/Kecamatan</option>
                                <option value="violation">Pelanggaran</option>
                            </select>
                        </div>

                        {/* District Filter */}
                        <div>
                            <label htmlFor="districtId" className={labelClass}>Filter Kecamatan</label>
                            <select id="districtId" name="districtId" value={formData.districtId} onChange={handleChange} className={inputClass}>
                                <option value="">Semua Kecamatan</option>
                                {districts.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Dynamic Filters */}
                        {(formData.type === "all" || formData.type === "entity") && (
                            <>
                                <div className="border-t border-outline-variant/10 md:col-span-2 mt-2 pt-6">
                                    <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">storefront</span> Filter Entitas Khusus
                                    </p>
                                </div>
                                <div>
                                    <label htmlFor="entityType" className={labelClass}>Tipe Entitas</label>
                                    <select id="entityType" name="entityType" value={formData.entityType} onChange={handleChange} className={inputClass}>
                                        <option value="">Semua Tipe</option>
                                        <option value="MINIMARKET">Minimarket</option>
                                        <option value="PASAR">Pasar</option>
                                        <option value="SUPERMARKET">Supermarket</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="permitStatus" className={labelClass}>Status Izin</label>
                                    <select id="permitStatus" name="permitStatus" value={formData.permitStatus} onChange={handleChange} className={inputClass}>
                                        <option value="">Semua Status</option>
                                        <option value="APPROVED">Approved (Disetujui)</option>
                                        <option value="UNDER_REVIEW">Under Review (Ditinjau)</option>
                                        <option value="REJECTED">Rejected (Ditolak)</option>
                                        <option value="EXPIRED">Expired (Kedaluwarsa)</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {formData.type === "violation" && (
                            <>
                                <div className="border-t border-outline-variant/10 md:col-span-2 mt-2 pt-6">
                                    <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">gavel</span> Filter Pelanggaran Khusus
                                    </p>
                                </div>
                                <div>
                                    <label htmlFor="severity" className={labelClass}>Tingkat Keparahan</label>
                                    <select id="severity" name="severity" value={formData.severity} onChange={handleChange} className={inputClass}>
                                        <option value="">Semua Keparahan</option>
                                        <option value="CRITICAL">Critical (Kritis)</option>
                                        <option value="WARNING">Warning (Peringatan)</option>
                                    </select>
                                </div>
                            </>
                        )}

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
                                <><span className="material-symbols-outlined text-sm">save</span> Perbarui Pencarian</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateSearch;
