import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3001/api/v1";

/**
 * UpdateAnalitics — Form untuk mengedit data pelanggaran (violation) yang ada.
 * Endpoint: GET /api/v1/violations/:id  (fetch data lama)
 *           PUT /api/v1/violations/:id  (update)
 */
const UpdateAnalitics = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        code: "",
        description: "",
        ruleType: "PROXIMITY",
        severity: "WARNING",
        status: "ACTIVE",
        distanceM: "",
        entityId: "",
        districtId: "",
        zoningRuleId: "",
    });

    const [districts, setDistricts] = useState([]);
    const [entities, setEntities] = useState([]);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    const [fetchError, setFetchError] = useState(null);

    // Fetch dropdown options + existing violation data
    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);
                setFetchError(null);

                const [distRes, entRes, violRes] = await Promise.all([
                    fetch(`${API_BASE}/districts`),
                    fetch(`${API_BASE}/entities`),
                    fetch(`${API_BASE}/violations/${id}`),
                ]);

                const distData = await distRes.json();
                const entData = await entRes.json();
                const violData = await violRes.json();

                if (distData.success) setDistricts(distData.data);
                if (entData.success) setEntities(entData.data || []);

                if (!violRes.ok || !violData.success) {
                    throw new Error(violData.error || "Data pelanggaran tidak ditemukan.");
                }

                const v = violData.data;
                setFormData({
                    code: v.code || "",
                    description: v.description || "",
                    ruleType: v.ruleType || "PROXIMITY",
                    severity: v.severity || "WARNING",
                    status: v.status || "ACTIVE",
                    distanceM: v.distanceM ?? "",
                    entityId: v.entityId || "",
                    districtId: v.districtId || "",
                    zoningRuleId: v.zoningRuleId || "",
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
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSuccess(null);
        setError(null);

        try {
            if (!formData.entityId) throw new Error("Entity wajib dipilih.");
            if (!formData.districtId) throw new Error("Distrik wajib dipilih.");

            const body = {
                code: formData.code.trim() || undefined,
                description: formData.description.trim() || undefined,
                ruleType: formData.ruleType,
                severity: formData.severity,
                status: formData.status,
                distanceM: formData.distanceM !== "" ? Number(formData.distanceM) : undefined,
                entityId: formData.entityId,
                districtId: formData.districtId,
                zoningRuleId: formData.zoningRuleId || undefined,
            };

            const response = await fetch(`${API_BASE}/violations/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            setSuccess(`Pelanggaran "${result.data?.code || id}" berhasil diperbarui!`);
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
                    <p className="text-on-surface-variant text-sm font-medium animate-pulse">Memuat data pelanggaran...</p>
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
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Kembali
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
                        <h1 className="font-headline text-3xl font-bold tracking-tight text-white">Edit Pelanggaran</h1>
                    </div>
                    <p className="text-on-surface-variant text-sm mt-1 ml-12">
                        Perbarui data pelanggaran <span className="text-white font-medium">{formData.code || id}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/20">
                    <span className="material-symbols-outlined text-on-surface-variant text-sm">fingerprint</span>
                    <span className="text-xs text-on-surface-variant font-mono">{id}</span>
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

            {/* Form Card */}
            <div className="glass-panel rounded-xl overflow-hidden max-w-3xl">
                <div className="px-8 py-5 border-b border-outline-variant/15 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
                        <span className="material-symbols-outlined text-amber-400 text-xl">edit_note</span>
                    </div>
                    <div>
                        <h2 className="text-white font-semibold text-base">Edit Formulir Pelanggaran</h2>
                        <p className="text-on-surface-variant text-xs">Ubah field yang ingin diperbarui</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Distrik */}
                        <div>
                            <label htmlFor="districtId" className={labelClass}>Distrik <span className="text-red-400">*</span></label>
                            <select id="districtId" name="districtId" value={formData.districtId} onChange={handleChange} className={inputClass} required>
                                <option value="">— Pilih Distrik —</option>
                                {districts.map((d) => (
                                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                                ))}
                            </select>
                        </div>

                        {/* Entity */}
                        <div>
                            <label htmlFor="entityId" className={labelClass}>Entity <span className="text-red-400">*</span></label>
                            <select id="entityId" name="entityId" value={formData.entityId} onChange={handleChange} className={inputClass} required>
                                <option value="">— Pilih Entity —</option>
                                {(Array.isArray(entities) ? entities : []).map((e) => (
                                    <option key={e.id} value={e.id}>{e.name} ({e.type})</option>
                                ))}
                            </select>
                        </div>

                        {/* Code */}
                        <div>
                            <label htmlFor="code" className={labelClass}>Kode Pelanggaran</label>
                            <input type="text" id="code" name="code" value={formData.code} onChange={handleChange} placeholder="Contoh: VIO-001" className={inputClass} />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <label htmlFor="description" className={labelClass}>Deskripsi</label>
                            <textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Jelaskan detail pelanggaran..." rows={3} className={`${inputClass} resize-none`} />
                        </div>

                        {/* Rule Type */}
                        <div>
                            <label htmlFor="ruleType" className={labelClass}>Tipe Aturan</label>
                            <select id="ruleType" name="ruleType" value={formData.ruleType} onChange={handleChange} className={inputClass}>
                                <option value="PROXIMITY">📍 Proximity (Jarak)</option>
                                <option value="DENSITY">📊 Density (Kepadatan)</option>
                                <option value="CAPACITY">📦 Capacity (Kapasitas)</option>
                            </select>
                        </div>

                        {/* Severity */}
                        <div>
                            <label htmlFor="severity" className={labelClass}>Severity</label>
                            <select id="severity" name="severity" value={formData.severity} onChange={handleChange} className={inputClass}>
                                <option value="CRITICAL">🔴 Critical</option>
                                <option value="WARNING">🟡 Warning</option>
                                <option value="ELEVATED">🟠 Elevated</option>
                                <option value="STABLE">🟢 Stable</option>
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status" className={labelClass}>Status</label>
                            <select id="status" name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                                <option value="ACTIVE">🔴 Active</option>
                                <option value="UNDER_REVIEW">🟡 Under Review</option>
                                <option value="RESOLVED">🟢 Resolved</option>
                            </select>
                        </div>

                        {/* Distance */}
                        <div>
                            <label htmlFor="distanceM" className={labelClass}>Jarak (meter)</label>
                            <input type="number" id="distanceM" name="distanceM" value={formData.distanceM} onChange={handleChange} placeholder="Contoh: 350" min="0" step="any" className={inputClass} />
                        </div>

                        {/* Zoning Rule ID */}
                        <div className="md:col-span-2">
                            <label htmlFor="zoningRuleId" className={labelClass}>Zoning Rule ID <span className="text-on-surface-variant">(Opsional)</span></label>
                            <input type="text" id="zoningRuleId" name="zoningRuleId" value={formData.zoningRuleId} onChange={handleChange} placeholder="UUID zoning rule jika ada" className={inputClass} />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-outline-variant/15 mt-8 pt-6 flex items-center justify-between">
                        <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-on-surface-variant hover:text-white text-sm font-medium transition-all duration-200">
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            Kembali
                        </button>
                        <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 focus:ring-2 focus:ring-primary/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            {submitting ? (
                                <><div className="w-4 h-4 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin" /> Menyimpan...</>
                            ) : (
                                <><span className="material-symbols-outlined text-sm">save</span> Perbarui Pelanggaran</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateAnalitics;
