import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3001/api/v1";
const SAVED_SEARCHES_KEY = "zonify_saved_searches";

const CreateSearch = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        query: "",
        type: "all",
        entityType: "",
        permitStatus: "",
        districtId: "",
        severity: "",
    });

    const [districts, setDistricts] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    // Fetch districts for dropdown filter
    useEffect(() => {
        const fetchDistricts = async () => {
            try {
                const res = await fetch(`${API_BASE}/districts`);
                const result = await res.json();
                if (result.success) setDistricts(result.data);
            } catch (err) {
                console.error("Gagal memuat distrik:", err);
            }
        };
        fetchDistricts();
    }, []);

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

    const resetForm = () => {
        setFormData({
            name: "", query: "", type: "all", entityType: "",
            permitStatus: "", districtId: "", severity: "",
        });
        setSuccess(null);
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSuccess(null);
        setError(null);

        try {
            if (!formData.name.trim()) throw new Error("Nama pencarian wajib diisi.");

            // Susun filters objek hanya dengan field yang memiliki value
            const filters = {};
            if (formData.entityType) filters.entityType = formData.entityType;
            if (formData.permitStatus) filters.permitStatus = formData.permitStatus;
            if (formData.districtId) filters.districtId = formData.districtId;
            if (formData.severity) filters.severity = formData.severity;

            const newSavedSearch = {
                id: `search_${Date.now()}`,
                name: formData.name.trim(),
                query: formData.query.trim(),
                type: formData.type,
                filters,
                createdAt: new Date().toISOString(),
            };

            // Simpan ke localStorage (karena backend tidak ada tabel khusus)
            // Simulasi network delay untuk UI loading
            await new Promise(resolve => setTimeout(resolve, 800));

            const existing = JSON.parse(localStorage.getItem(SAVED_SEARCHES_KEY) || "[]");
            const updated = [newSavedSearch, ...existing];
            localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated));

            setSuccess(`Pencarian "${newSavedSearch.name}" berhasil disimpan!`);

            // Opsional: Langsung reset form setelah sukses
            setTimeout(() => {
                resetForm();
            }, 2000);

        } catch (err) {
            setError(err.message || "Terjadi kesalahan saat menyimpan.");
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass = "w-full px-4 py-3 rounded-xl bg-surface-container-highest/40 border border-outline-variant/20 text-white placeholder-on-surface-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all duration-200";
    const labelClass = "block text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-2";

    return (
        <div className="ml-64 p-8 min-h-screen text-on-surface">

            {/* Header */}
            <div className="flex items-end justify-between mb-8">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight text-white">Simpan Pencarian Baru</h1>
                    <p className="text-on-surface-variant text-sm mt-1">Buat filter *custom* agar mudah digunakan di lain waktu.</p>
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
                    <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-xl">bookmark_add</span>
                    </div>
                    <div>
                        <h2 className="text-white font-semibold text-base">Konfigurasi Pencarian</h2>
                        <p className="text-on-surface-variant text-xs">Atur kata kunci dan parameter filter</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Nama Pencarian */}
                        <div className="md:col-span-2">
                            <label htmlFor="name" className={labelClass}>Nama Pencarian (Alias) <span className="text-red-400">*</span></label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Contoh: Minimarket Belum Berizin di Tebet" className={inputClass} required />
                        </div>

                        {/* Kata Kunci / Query */}
                        <div className="md:col-span-2">
                            <label htmlFor="query" className={labelClass}>Kata Kunci (Query)</label>
                            <input type="text" id="query" name="query" value={formData.query} onChange={handleChange} placeholder="Kosongkan jika hanya ingin menyimpan filter (Misal: Indomaret)" className={inputClass} />
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

                        {/* District Filter (Berlaku untuk semua) */}
                        <div>
                            <label htmlFor="districtId" className={labelClass}>Filter Kecamatan</label>
                            <select id="districtId" name="districtId" value={formData.districtId} onChange={handleChange} className={inputClass}>
                                <option value="">Semua Kecamatan</option>
                                {districts.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Dynamic Filters berdasarkan Type */}
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
                                    <label htmlFor="severity" className={labelClass}>Tingkat Keparahan (Severity)</label>
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
                            <span className="material-symbols-outlined text-sm">arrow_back</span> Batal
                        </button>
                        <div className="flex gap-3">
                            <button type="button" onClick={resetForm} disabled={submitting} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-medium border border-outline-variant/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                Reset
                            </button>
                            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 focus:ring-2 focus:ring-primary/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                {submitting ? (
                                    <><div className="w-4 h-4 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin" /> Menyimpan...</>
                                ) : (
                                    <><span className="material-symbols-outlined text-sm">save</span> Simpan</>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateSearch;
