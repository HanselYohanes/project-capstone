import React, { useState } from "react";

const API_BASE = "http://localhost:3001/api/v1";

/**
 * CreateDashboard — Form untuk menyimpan konfigurasi widget dashboard baru.
 *
 * Backend dashboard.routes.js tidak memiliki POST endpoint.
 * Konfigurasi disimpan sebagai key-value di SystemSetting
 * via PUT /api/v1/settings/:key (upsert).
 *
 * Setiap widget disimpan sebagai setting dengan key:
 *   "dashboard_widget_<timestamp>" dan value berupa JSON string.
 */

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

const CreateDashboard = () => {
    const [formData, setFormData] = useState({
        title: "",
        widgetType: "metric",
        dataSource: "dashboard/kpis",
        description: "",
        refreshInterval: 30,
        isVisible: true,
    });

    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const resetForm = () => {
        setFormData({
            title: "", widgetType: "metric", dataSource: "dashboard/kpis",
            description: "", refreshInterval: 30, isVisible: true,
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
            if (!formData.title.trim()) throw new Error("Judul widget wajib diisi.");

            const settingKey = `dashboard_widget_${Date.now()}`;
            const settingValue = JSON.stringify({
                title: formData.title.trim(),
                widgetType: formData.widgetType,
                dataSource: formData.dataSource,
                description: formData.description.trim(),
                refreshInterval: Number(formData.refreshInterval),
                isVisible: formData.isVisible,
                createdAt: new Date().toISOString(),
            });

            const response = await fetch(`${API_BASE}/settings/${settingKey}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ value: settingValue }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            const savedTitle = formData.title.trim();
            resetForm();
            setSuccess(`Widget "${savedTitle}" berhasil disimpan!`);
        } catch (err) {
            setError(err.message || "Terjadi kesalahan saat menyimpan konfigurasi.");
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass = "w-full px-4 py-3 rounded-xl bg-surface-container-highest/40 border border-outline-variant/20 text-white placeholder-on-surface-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all duration-200";
    const labelClass = "block text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-2";

    const selectedWidget = WIDGET_TYPES.find((w) => w.value === formData.widgetType);

    return (
        <div className="ml-64 p-8 min-h-screen text-on-surface">

            {/* Header */}
            <div className="flex items-end justify-between mb-8">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight text-white">Tambah Widget Dashboard</h1>
                    <p className="text-on-surface-variant text-sm mt-1">Konfigurasikan widget baru untuk ditampilkan di halaman dashboard.</p>
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
                        <span className="material-symbols-outlined text-primary text-xl">dashboard_customize</span>
                    </div>
                    <div>
                        <h2 className="text-white font-semibold text-base">Formulir Widget</h2>
                        <p className="text-on-surface-variant text-xs">Konfigurasi tampilan dan sumber data widget</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Title */}
                        <div className="md:col-span-2">
                            <label htmlFor="title" className={labelClass}>Judul Widget <span className="text-red-400">*</span></label>
                            <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} placeholder="Contoh: Statistik Pelanggaran Harian" className={inputClass} required />
                        </div>

                        {/* Widget Type */}
                        <div>
                            <label htmlFor="widgetType" className={labelClass}>Tipe Widget</label>
                            <select id="widgetType" name="widgetType" value={formData.widgetType} onChange={handleChange} className={inputClass}>
                                {WIDGET_TYPES.map((w) => (
                                    <option key={w.value} value={w.value}>{w.label}</option>
                                ))}
                            </select>
                            {selectedWidget && (
                                <p className="text-xs text-on-surface-variant mt-1.5 ml-1">{selectedWidget.desc}</p>
                            )}
                        </div>

                        {/* Data Source */}
                        <div>
                            <label htmlFor="dataSource" className={labelClass}>Sumber Data</label>
                            <select id="dataSource" name="dataSource" value={formData.dataSource} onChange={handleChange} className={inputClass}>
                                {DATA_SOURCES.map((ds) => (
                                    <option key={ds.value} value={ds.value}>{ds.label}</option>
                                ))}
                            </select>
                            <p className="text-xs text-on-surface-variant mt-1.5 ml-1 font-mono">/api/v1/{formData.dataSource}</p>
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <label htmlFor="description" className={labelClass}>Deskripsi</label>
                            <textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Keterangan singkat tentang widget ini..." rows={3} className={`${inputClass} resize-none`} />
                        </div>

                        {/* Refresh Interval */}
                        <div>
                            <label htmlFor="refreshInterval" className={labelClass}>Interval Refresh (detik)</label>
                            <input type="number" id="refreshInterval" name="refreshInterval" value={formData.refreshInterval} onChange={handleChange} min="5" max="3600" step="5" className={inputClass} />
                            <p className="text-xs text-on-surface-variant mt-1.5 ml-1">Auto-refresh setiap {formData.refreshInterval} detik</p>
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

                    {/* Preview */}
                    <div className="mt-6 p-4 rounded-xl bg-surface-container-highest/20 border border-outline-variant/10">
                        <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-3">Preview Konfigurasi</p>
                        <div className="glass-panel rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{WIDGET_TYPES.find(w => w.value === formData.widgetType)?.label.split(" ")[0]}</span>
                                <span className="text-white font-semibold text-sm">{formData.title || "Judul Widget"}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                                <span>Tipe: {formData.widgetType}</span>
                                <span>·</span>
                                <span>Refresh: {formData.refreshInterval}s</span>
                                <span>·</span>
                                <span className={formData.isVisible ? "text-emerald-400" : "text-red-400"}>
                                    {formData.isVisible ? "Visible" : "Hidden"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-outline-variant/15 mt-8 pt-6 flex items-center justify-end gap-3">
                        <button type="button" onClick={resetForm} disabled={submitting} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-medium border border-outline-variant/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            <span className="material-symbols-outlined text-sm">restart_alt</span> Reset
                        </button>
                        <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 focus:ring-2 focus:ring-primary/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            {submitting ? (
                                <><div className="w-4 h-4 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin" /> Menyimpan...</>
                            ) : (
                                <><span className="material-symbols-outlined text-sm">save</span> Simpan Widget</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateDashboard;
