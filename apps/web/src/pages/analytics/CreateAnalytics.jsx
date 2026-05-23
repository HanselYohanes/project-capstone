import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:3001/api/v1";

/**
 * CreateAnalytics — Form untuk membuat pelanggaran (violation) baru,
 * yang merupakan data utama penggerak seluruh metrik analitik.
 *
 * Endpoint: POST /api/v1/violations
 * Fields: code, description, ruleType, severity, status, distanceM, entityId, districtId, zoningRuleId
 */
const CreateAnalytics = () => {
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

    // Dropdown options fetched from API
    const [districts, setDistricts] = useState([]);
    const [entities, setEntities] = useState([]);

    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    // Fetch districts & entities for select dropdowns
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [distRes, entRes] = await Promise.all([
                    fetch(`${API_BASE}/districts`),
                    fetch(`${API_BASE}/entities`),
                ]);
                const distData = await distRes.json();
                const entData = await entRes.json();
                if (distData.success) setDistricts(distData.data);
                if (entData.success) setEntities(entData.data || entData.data?.data || []);
            } catch (err) {
                console.error("Gagal memuat opsi dropdown:", err);
            }
        };
        fetchOptions();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            code: "", description: "", ruleType: "PROXIMITY", severity: "WARNING",
            status: "ACTIVE", distanceM: "", entityId: "", districtId: "", zoningRuleId: "",
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
            if (!formData.entityId) throw new Error("Entity wajib dipilih.");
            if (!formData.districtId) throw new Error("Distrik wajib dipilih.");

            const body = {
                code: formData.code.trim() || undefined,
                description: formData.description.trim() || undefined,
                ruleType: formData.ruleType,
                severity: formData.severity,
                status: formData.status,
                distanceM: formData.distanceM ? Number(formData.distanceM) : undefined,
                entityId: formData.entityId,
                districtId: formData.districtId,
                zoningRuleId: formData.zoningRuleId || undefined,
            };

            const response = await fetch(`${API_BASE}/violations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            const savedName = result.data?.entity?.name || result.data?.code || "Baru";
            setSuccess(`Pelanggaran "${savedName}" berhasil ditambahkan!`);
            resetForm();
            setSuccess(`Pelanggaran "${savedName}" berhasil ditambahkan!`);
        } catch (err) {
            setError(err.message || "Terjadi kesalahan saat menyimpan data.");
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
                    <h1 className="font-headline text-3xl font-bold tracking-tight text-white">Tambah Data Analitik</h1>
                    <p className="text-on-surface-variant text-sm mt-1">Buat catatan pelanggaran baru yang akan terintegrasi ke dashboard analitik.</p>
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
                    <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-xl">add_chart</span>
                    </div>
                    <div>
                        <h2 className="text-white font-semibold text-base">Formulir Pelanggaran</h2>
                        <p className="text-on-surface-variant text-xs">Lengkapi field untuk menambah data pelanggaran baru</p>
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

                        {/* Zoning Rule ID (opsional) */}
                        <div className="md:col-span-2">
                            <label htmlFor="zoningRuleId" className={labelClass}>Zoning Rule ID <span className="text-on-surface-variant">(Opsional)</span></label>
                            <input type="text" id="zoningRuleId" name="zoningRuleId" value={formData.zoningRuleId} onChange={handleChange} placeholder="UUID zoning rule jika ada" className={inputClass} />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-outline-variant/15 mt-8 pt-6 flex items-center justify-end gap-3">
                        <button type="button" onClick={resetForm} disabled={submitting} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-medium border border-outline-variant/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            <span className="material-symbols-outlined text-sm">restart_alt</span>
                            Reset
                        </button>
                        <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 focus:ring-2 focus:ring-primary/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            {submitting ? (
                                <><div className="w-4 h-4 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin" /> Menyimpan...</>
                            ) : (
                                <><span className="material-symbols-outlined text-sm">save</span> Simpan Pelanggaran</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateAnalytics;
