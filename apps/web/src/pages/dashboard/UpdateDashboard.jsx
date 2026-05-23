import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3001/api/v1";

const WIDGET_TYPES = [
    { value: "chart", label: "📊 Chart", desc: "Grafik batang, garis, atau pie" },
    { value: "table", label: "📋 Table", desc: "Tabel data ringkasan" },
    { value: "metric", label: "📈 Metric Card", desc: "Kartu KPI angka tunggal" },
    { value: "map", label: "🗺️ Map", desc: "Visualisasi peta geospasial" },
];

const DATA_SOURCES = [
    { value: "dashboard/kpis", label: "Dashboard KPIs" },
    { value: "dashboard/top-districts", label: "Top Districts" },
    { value: "dashboard/recent-violations", label: "Recent Violations" },
    { value: "dashboard/entity-summary", label: "Entity Summary" },
    { value: "dashboard/permit-summary", label: "Permit Summary" },
    { value: "dashboard/violation-summary", label: "Violation Summary" },
    { value: "dashboard/audit-summary", label: "Audit Summary" },
    { value: "dashboard/heatmap", label: "Heatmap Data" },
    { value: "analytics/saturation-by-district", label: "Saturation by District" },
    { value: "analytics/kpis", label: "Analytics KPIs" },
];

/**
 * UpdateDashboard — Edit konfigurasi widget dashboard.
 * GET  /api/v1/settings/:key  → fetch data lama
 * PUT  /api/v1/settings/:key  → update
 */
const UpdateDashboard = () => {
    const { id } = useParams(); // setting key, e.g. "dashboard_widget_1234"
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: "", widgetType: "metric", dataSource: "dashboard/kpis",
        description: "", refreshInterval: 30, isVisible: true,
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    const [fetchError, setFetchError] = useState(null);

    useEffect(() => {
        const fetchSetting = async () => {
            try {
                setLoading(true);
                setFetchError(null);

                const res = await fetch(`${API_BASE}/settings/${id}`);
                const result = await res.json();

                if (!res.ok || !result.success) {
                    throw new Error(result.error || "Konfigurasi tidak ditemukan.");
                }

                const parsed = JSON.parse(result.data.value);
                setFormData({
                    title: parsed.title || "",
                    widgetType: parsed.widgetType || "metric",
                    dataSource: parsed.dataSource || "dashboard/kpis",
                    description: parsed.description || "",
                    refreshInterval: parsed.refreshInterval ?? 30,
                    isVisible: parsed.isVisible ?? true,
                });
            } catch (err) {
                setFetchError(err.message || "Gagal memuat data konfigurasi.");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchSetting();
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
            if (!formData.title.trim()) throw new Error("Judul widget wajib diisi.");

            const settingValue = JSON.stringify({
                title: formData.title.trim(),
                widgetType: formData.widgetType,
                dataSource: formData.dataSource,
                description: formData.description.trim(),
                refreshInterval: Number(formData.refreshInterval),
                isVisible: formData.isVisible,
                updatedAt: new Date().toISOString(),
            });

            const res = await fetch(`${API_BASE}/settings/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ value: settingValue }),
            });

            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || `HTTP error! status: ${res.status}`);

            setSuccess(`Widget "${formData.title.trim()}" berhasil diperbarui!`);
        } catch (err) {
            setError(err.message || "Terjadi kesalahan saat memperbarui konfigurasi.");
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
                    <p className="text-on-surface-variant text-sm font-medium animate-pulse">Memuat konfigurasi widget...</p>
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
    const selectedWidget = WIDGET_TYPES.find((w) => w.value === formData.widgetType);

    return (
        <div className="ml-64 p-8 min-h-screen text-on-surface">

            {/* Header */}
            <div className="flex items-end justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 flex items-center justify-center transition-all duration-200" title="Kembali">
                            <span className="material-symbols-outlined text-on-surface-variant text-lg">arrow_back</span>
                        </button>
                        <h1 className="font-headline text-3xl font-bold tracking-tight text-white">Edit Widget Dashboard</h1>
                    </div>
                    <p className="text-on-surface-variant text-sm mt-1 ml-12">
                        Perbarui konfigurasi widget <span className="text-white font-medium">{formData.title || id}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/20">
                    <span className="material-symbols-outlined text-on-surface-variant text-sm">key</span>
                    <span className="text-xs text-on-surface-variant font-mono truncate max-w-[200px]">{id}</span>
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
                        <h2 className="text-white font-semibold text-base">Edit Formulir Widget</h2>
                        <p className="text-on-surface-variant text-xs">Ubah field yang ingin diperbarui</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Title */}
                        <div className="md:col-span-2">
                            <label htmlFor="title" className={labelClass}>Judul Widget <span className="text-red-400">*</span></label>
                            <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} placeholder="Contoh: Statistik Pelanggaran" className={inputClass} required />
                        </div>

                        {/* Widget Type */}
                        <div>
                            <label htmlFor="widgetType" className={labelClass}>Tipe Widget</label>
                            <select id="widgetType" name="widgetType" value={formData.widgetType} onChange={handleChange} className={inputClass}>
                                {WIDGET_TYPES.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
                            </select>
                            {selectedWidget && <p className="text-xs text-on-surface-variant mt-1.5 ml-1">{selectedWidget.desc}</p>}
                        </div>

                        {/* Data Source */}
                        <div>
                            <label htmlFor="dataSource" className={labelClass}>Sumber Data</label>
                            <select id="dataSource" name="dataSource" value={formData.dataSource} onChange={handleChange} className={inputClass}>
                                {DATA_SOURCES.map((ds) => <option key={ds.value} value={ds.value}>{ds.label}</option>)}
                            </select>
                            <p className="text-xs text-on-surface-variant mt-1.5 ml-1 font-mono">/api/v1/{formData.dataSource}</p>
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <label htmlFor="description" className={labelClass}>Deskripsi</label>
                            <textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Keterangan singkat..." rows={3} className={`${inputClass} resize-none`} />
                        </div>

                        {/* Refresh Interval */}
                        <div>
                            <label htmlFor="refreshInterval" className={labelClass}>Interval Refresh (detik)</label>
                            <input type="number" id="refreshInterval" name="refreshInterval" value={formData.refreshInterval} onChange={handleChange} min="5" max="3600" step="5" className={inputClass} />
                        </div>

                        {/* Visibility Toggle */}
                        <div className="flex items-center">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative">
                                    <input type="checkbox" name="isVisible" checked={formData.isVisible} onChange={handleChange} className="sr-only peer" />
                                    <div className="w-11 h-6 rounded-full bg-surface-container-highest/60 peer-checked:bg-primary transition-colors duration-200" />
                                    <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 peer-checked:translate-x-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-white font-medium">Tampilkan Widget</p>
                                    <p className="text-xs text-on-surface-variant">{formData.isVisible ? "Widget akan terlihat" : "Widget disembunyikan"}</p>
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
                                <><div className="w-4 h-4 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin" /> Menyimpan...</>
                            ) : (
                                <><span className="material-symbols-outlined text-sm">save</span> Perbarui Widget</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateDashboard;
