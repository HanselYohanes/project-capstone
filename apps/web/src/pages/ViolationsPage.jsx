import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Constants ---
const API_BASE = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}`;
const PAGE_SIZE = 15;

// KPI fallback
const FALLBACK_SUMMARY = {
    critical: 99,
    warning: 0,
    safe: 563,
    total: 662,
};

// Data Fallback
const FALLBACK_VIOLATIONS = [
    { id: 'F-001', code: '#V-001', entityName: 'Indomaret Jagakarsa I', district: 'Jagakarsa', rule: '< 500m dari Pasar', distanceM: 210, severity: 'CRITICAL', status: 'ACTIVE', detectedAt: '2025-11-10' },
    { id: 'F-002', code: '#V-002', entityName: 'Alfamart Cilandak IV', district: 'Cilandak', rule: '< 500m dari Pasar', distanceM: 720, severity: 'STABLE', status: 'RESOLVED', detectedAt: '2025-10-05' },
];

// ─── Token Helper ────────────────────────────────────────────────────────
// Pindahkan ke atas agar bisa dipakai oleh semua fungsi fetch!
const getAuthHeader = () => {
    try {
        const token = JSON.parse(localStorage.getItem('user'))?.token;
        return token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };
    } catch {
        return { 'Content-Type': 'application/json' };
    }
};

// --- Helpers ---
function severityLabel(s) {
    const map = { CRITICAL: 'Critical', WARNING: 'Warning', ELEVATED: 'Elevated', STABLE: 'Safe', SAFE: 'Safe' };
    return map[s?.toUpperCase()] ?? s ?? '-';
}

function statusLabel(s) {
    const map = { ACTIVE: 'Active', UNDER_REVIEW: 'Under Review', RESOLVED: 'Resolved' };
    return map[s?.toUpperCase()] ?? s ?? '-';
}

function severityBadgeBg(s) {
    const u = s?.toUpperCase();
    if (u === 'CRITICAL') return 'bg-error/15 text-error border border-error/30';
    if (u === 'WARNING' || u === 'ELEVATED') return 'bg-tertiary/15 text-tertiary border border-tertiary/30';
    return 'bg-green-400/10 text-green-400 border border-green-400/30';
}

function statusBadgeBg(s) {
    const u = s?.toUpperCase();
    if (u === 'ACTIVE') return 'bg-error/10 text-error border border-error/30';
    if (u === 'UNDER_REVIEW') return 'bg-tertiary/10 text-tertiary border border-tertiary/30';
    return 'bg-surface-container text-on-surface-variant border border-outline-variant/30';
}

// 🛡️ TAMENG MAPPING DATA (Mengantisipasi format backend Hansel)
function normaliseRow(v) {
    const displayEntity = typeof v.name === 'object' ? v.name?.name : (v.name || v.entityName || v.entity?.name || '-');
    const displayDistrict = typeof v.district === 'object' ? v.district?.name : (v.district || '-');
    const displayId = v.id ? (typeof v.id === 'string' ? v.id.substring(0, 6).toUpperCase() : String(v.id)) : "000";

    return {
        id: v.id,
        code: v.code ?? `#${displayId}`,
        entityName: displayEntity,
        entityType: v.type ?? v.entity?.type ?? v.entityType ?? '-',
        district: displayDistrict,
        rule: v.rule ?? v.zoningRule?.name ?? `< ${v.distanceToMarket || v.distanceM || 500}m dari Pasar`,
        distanceM: v.distanceToMarket ?? v.jarak ?? v.distanceM ?? null, // Ambil distanceToMarket dari backend
        severity: v.severity ?? (v.isFlagged ? 'CRITICAL' : 'STABLE'),
        status: v.status ?? 'ACTIVE',
        detectedAt: v.createdAt ? new Date(v.createdAt).toLocaleDateString('id-ID') : (v.detectedAt || '-'),
        description: v.description ?? '',
    };
}

// ─── EditModal Component ────────────────────────────────────────────────────
const SEVERITY_OPTIONS = ['CRITICAL', 'WARNING', 'ELEVATED', 'STABLE'];
const STATUS_OPTIONS = ['ACTIVE', 'UNDER_REVIEW', 'RESOLVED'];

const EditModal = ({ item, onClose, onSaved }) => {
    const [form, setForm] = React.useState({
        severity: item.severity ?? 'STABLE',
        status: item.status ?? 'ACTIVE',
        distanceM: item.distanceM ?? '',
        description: item.description ?? '',
    });
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleChange = (e) =>
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.severity || !form.status) {
            setError('Severity dan Status wajib diisi.');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/v1/violations/${item.id}`, {
                method: 'PATCH',
                headers: getAuthHeader(),
                body: JSON.stringify({
                    severity: form.severity,
                    status: form.status,
                    distanceM: form.distanceM !== '' ? Number(form.distanceM) : undefined,
                    description: form.description || undefined,
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.message ?? `HTTP ${res.status}`);
            }
            onSaved();
        } catch (err) {
            setError(err.message ?? 'Gagal menyimpan perubahan. Coba lagi.');
        } finally {
            setSaving(false);
        }
    };

    const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleOverlayClick}>
            <div className="glass-panel rounded-2xl p-8 w-full max-w-lg shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-white">Edit Pelanggaran</h3>
                        <p className="text-xs text-on-surface-variant mt-0.5">{item.code} — {item.entityName}</p>
                    </div>
                    <button onClick={onClose} className="text-on-surface-variant hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {error && <div className="mb-4 px-4 py-2.5 rounded-lg bg-error/15 border border-error/30 text-error text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-on-surface-variant uppercase tracking-wide">Severity *</label>
                        <select name="severity" value={form.severity} onChange={handleChange} className="px-4 py-2.5 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50">
                            {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{severityLabel(s)}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-on-surface-variant uppercase tracking-wide">Status *</label>
                        <select name="status" value={form.status} onChange={handleChange} className="px-4 py-2.5 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50">
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-on-surface-variant uppercase tracking-wide">Jarak (M)</label>
                        <input type="number" name="distanceM" value={form.distanceM} onChange={handleChange} min="0" placeholder="Opsional" className="px-4 py-2.5 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary/50" />
                    </div>
                    <div className="flex justify-end gap-3 mt-2">
                        <button type="button" onClick={onClose} disabled={saving} className="px-5 py-2 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface text-sm font-medium hover:bg-surface-container-high transition-all disabled:opacity-50">Batal</button>
                        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition-all disabled:opacity-60">
                            {saving && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
                            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Main Page Component ---
const ViolationsPage = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState(FALLBACK_SUMMARY);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [tableLoading, setTableLoading] = useState(true);
    const [usingFallback, setUsingFallback] = useState(false);
    const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
    const [search, setSearch] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [page, setPage] = useState(1);
    const [selectedViolation, setSelectedViolation] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    // --- Fetch KPI summary ---
    useEffect(() => {
        let cancelled = false;
        setSummaryLoading(true);

        // 🚨 UPDATE: Menggunakan header JWT untuk mengambil KPI
        fetch(`${API_BASE}/api/v1/violations/summary`, { headers: getAuthHeader() })
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(json => {
                if (cancelled) return;
                const d = json?.data ?? {};

                // Menghandle mapping data jika API mengirim object berbeda
                const byStatus = {};
                (d.byStatus ?? []).forEach(item => { byStatus[item.status] = item.count; });
                const bySeverity = {};
                (d.bySeverity ?? []).forEach(item => { bySeverity[item.severity] = item.count; });

                setSummary({
                    critical: bySeverity['CRITICAL'] ?? d.critical ?? 0,
                    warning: (bySeverity['WARNING'] ?? 0) + (bySeverity['ELEVATED'] ?? d.warning ?? 0),
                    safe: bySeverity['STABLE'] ?? d.safe ?? 0,
                    total: (d.totalActive ?? 0) + (d.totalResolved ?? 0) || d.total || 0,
                });
            })
            .catch(err => {
                if (!cancelled) {
                    setSummary(FALLBACK_SUMMARY);
                }
            })
            .finally(() => { if (!cancelled) setSummaryLoading(false); });

        return () => { cancelled = true; };
    }, []);

    // --- Fetch table rows ---
    const fetchRows = useCallback(() => {
        let cancelled = false;
        setTableLoading(true);

        const params = new URLSearchParams({
            page,
            limit: PAGE_SIZE,
            ...(filterSeverity && { severity: filterSeverity }),
            ...(filterStatus && { status: filterStatus }),
            ...(search && { search }),
        });

        // 🚨 UPDATE: Menggunakan header JWT untuk memanggil API tabel
        fetch(`${API_BASE}/api/v1/violations?${params}`, { headers: getAuthHeader() })
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(json => {
                if (cancelled) return;
                const data = json?.data ?? [];

                if (data.length > 0 || json?.meta?.total > 0) {
                    setRows(data.map(normaliseRow));
                    setMeta({
                        total: json.meta?.total ?? data.length,
                        page: json.meta?.page ?? page,
                        totalPages: json.meta?.totalPages ?? 1,
                    });
                    setUsingFallback(false);
                } else {
                    setRows([]);
                    setMeta({ total: 0, page: 1, totalPages: 1 });
                    setUsingFallback(false);
                }
            })
            .catch(err => {
                if (!cancelled) {
                    const filtered = FALLBACK_VIOLATIONS.filter(v => {
                        const matchSearch = !search || v.entityName.toLowerCase().includes(search.toLowerCase()) || v.district.toLowerCase().includes(search.toLowerCase());
                        const matchSeverity = !filterSeverity || v.severity === filterSeverity;
                        const matchStatus = !filterStatus || v.status === filterStatus;
                        return matchSearch && matchSeverity && matchStatus;
                    });
                    setRows(filtered);
                    setMeta({ total: filtered.length, page: 1, totalPages: 1 });
                    setUsingFallback(true);
                }
            })
            .finally(() => { if (!cancelled) setTableLoading(false); });

    }, [page, filterSeverity, filterStatus, search]);

    useEffect(() => { fetchRows(); }, [fetchRows]);
    useEffect(() => { setPage(1); }, [filterSeverity, filterStatus, search]);

    // --- Export handlers ---
    const CSV_HEADERS = ['Kode', 'Entitas', 'Kecamatan', 'Aturan Zonasi', 'Jarak (M)', 'Severity', 'Status', 'Terdeteksi'];

    const getAllExportData = async () => {
        if (usingFallback) return rows; // Gunakan data yang ada di UI jika fallback

        try {
            const params = new URLSearchParams({
                page: 1,
                limit: 9999,
                ...(filterSeverity && { severity: filterSeverity }),
                ...(filterStatus && { status: filterStatus }),
                ...(search && { search }),
            });
            // 🚨 UPDATE: Tambahkan Token JWT pada ekspor!
            const res = await fetch(`${API_BASE}/api/v1/violations?${params}`, { headers: getAuthHeader() });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            const data = json?.data ?? [];
            return data.length > 0 ? data.map(normaliseRow) : rows;
        } catch (err) {
            return rows;
        }
    };

    const handleExportCSV = async () => {
        const exportData = await getAllExportData();
        const escapeCell = (val) => {
            const str = val == null ? '' : String(val);
            return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
        };
        const headerRow = CSV_HEADERS.join(',');
        const dataRows = exportData.map(r => [
            r.code, r.entityName, r.district, r.rule, r.distanceM ?? '', severityLabel(r.severity), statusLabel(r.status), r.detectedAt,
        ].map(escapeCell).join(','));
        const csvContent = [headerRow, ...dataRows].join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Laporan_Pelanggaran_Zonify.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportPDF = async () => {
        const exportData = await getAllExportData();
        const doc = new jsPDF({ orientation: 'landscape' });
        const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

        doc.setFontSize(16);
        doc.setTextColor(40);
        doc.text('Laporan Pelanggaran Zonasi - Zonify', 14, 16);
        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text(`Diunduh pada: ${today}  |  Total data: ${exportData.length} baris`, 14, 23);

        const tableBody = exportData.map(r => [
            r.code, r.entityName, r.district, r.rule, r.distanceM ?? '-', severityLabel(r.severity), statusLabel(r.status), r.detectedAt,
        ]);

        autoTable(doc, {
            startY: 28,
            head: [CSV_HEADERS],
            body: tableBody,
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [30, 30, 60], textColor: 255 },
            alternateRowStyles: { fillColor: [245, 245, 250] },
        });

        doc.save('Laporan_Pelanggaran_Zonify.pdf');
    };

    // --- Action handlers ---
    const handleOpenEdit = (item) => setSelectedViolation(item);
    const handleSaveEdit = () => { setSelectedViolation(null); fetchRows(); };

    const handleDeleteViolation = async (id, code) => {
        if (!window.confirm(`Hapus pelanggaran ${code}? Tindakan ini tidak dapat dibatalkan.`)) return;
        setActionLoading(id);
        try {
            const res = await fetch(`${API_BASE}/api/v1/violations/${id}`, { method: 'DELETE', headers: getAuthHeader() });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            fetchRows();
        } catch (err) {
            alert(`Gagal menghapus ${code}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRestoreViolation = async (id, code) => {
        if (!window.confirm(`Pulihkan pelanggaran ${code}?`)) return;
        setActionLoading(id);
        try {
            const res = await fetch(`${API_BASE}/api/v1/violations/${id}/restore`, { method: 'PATCH', headers: getAuthHeader() });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            fetchRows();
        } catch (err) {
            alert(`Gagal memulihkan ${code}`);
        } finally {
            setActionLoading(null);
        }
    };

    // --- Render ---
    return (
        <div className="bg-background text-on-surface font-body min-h-screen antialiased">
            <Header />
            <main className="ml-64 p-8 flex flex-col gap-8 relative z-10">

                {/* -- Page heading -- */}
                <div className="flex items-end justify-between">
                    <div>
                        <h2 className="font-headline text-3xl font-bold text-white tracking-tight">All Violations</h2>
                        <p className="text-sm text-on-surface-variant mt-1">
                            Daftar pelanggaran zonasi komersial berdasarkan data database.
                            {usingFallback && <span className="ml-2 text-xs text-tertiary italic">(Menampilkan snapshot offline — API tidak terjangkau)</span>}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-medium border border-outline-variant/20 transition-all">
                            <span className="material-symbols-outlined text-sm">download</span> CSV
                        </button>
                        <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-medium border border-outline-variant/20 transition-all">
                            <span className="material-symbols-outlined text-sm">picture_as_pdf</span> PDF Report
                        </button>
                    </div>
                </div>

                {/* -- KPI Summary chips -- */}
                <div className="flex flex-wrap gap-4">
                    <div className="glass-panel rounded-xl px-6 py-4 flex items-center gap-4 min-w-[160px]">
                        {summaryLoading ? <div className="w-8 h-8 rounded-lg bg-white/10 animate-pulse flex-shrink-0" /> : <span className="material-symbols-outlined text-2xl text-on-surface-variant">store</span>}
                        <div className="flex flex-col gap-1.5">
                            <p className="text-xs text-on-surface-variant uppercase tracking-wide">Total Minimarket</p>
                            {summaryLoading ? <div className="h-7 w-16 rounded-md bg-white/10 animate-pulse" /> : <p className="text-2xl font-bold text-white">{summary.total.toLocaleString()}</p>}
                        </div>
                    </div>
                    <div className="glass-panel rounded-xl px-6 py-4 flex items-center gap-4 min-w-[160px] border border-error/20">
                        {summaryLoading ? <div className="w-8 h-8 rounded-lg bg-error/10 animate-pulse flex-shrink-0" /> : <span className="material-symbols-outlined text-2xl text-error">report</span>}
                        <div className="flex flex-col gap-1.5">
                            <p className="text-xs text-on-surface-variant uppercase tracking-wide">Critical</p>
                            {summaryLoading ? <div className="h-7 w-12 rounded-md bg-error/15 animate-pulse" /> : <p className="text-2xl font-bold text-error">{summary.critical.toLocaleString()}</p>}
                        </div>
                    </div>
                    <div className="glass-panel rounded-xl px-6 py-4 flex items-center gap-4 min-w-[160px] border border-tertiary/20">
                        {summaryLoading ? <div className="w-8 h-8 rounded-lg bg-tertiary/10 animate-pulse flex-shrink-0" /> : <span className="material-symbols-outlined text-2xl text-tertiary">warning</span>}
                        <div className="flex flex-col gap-1.5">
                            <p className="text-xs text-on-surface-variant uppercase tracking-wide">Warning</p>
                            {summaryLoading ? <div className="h-7 w-10 rounded-md bg-tertiary/15 animate-pulse" /> : <p className="text-2xl font-bold text-tertiary">{summary.warning.toLocaleString()}</p>}
                        </div>
                    </div>
                    <div className="glass-panel rounded-xl px-6 py-4 flex items-center gap-4 min-w-[160px] border border-green-400/20">
                        {summaryLoading ? <div className="w-8 h-8 rounded-lg bg-green-400/10 animate-pulse flex-shrink-0" /> : <span className="material-symbols-outlined text-2xl text-green-400">check_circle</span>}
                        <div className="flex flex-col gap-1.5">
                            <p className="text-xs text-on-surface-variant uppercase tracking-wide">Safe</p>
                            {summaryLoading ? <div className="h-7 w-14 rounded-md bg-green-400/10 animate-pulse" /> : <p className="text-2xl font-bold text-green-400">{summary.safe.toLocaleString()}</p>}
                        </div>
                    </div>
                </div>

                {/* -- Filters -- */}
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[220px]">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">search</span>
                        <input id="violations-search" type="text" placeholder="Cari entitas atau kecamatan..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary/50" />
                    </div>
                    <select id="violations-filter-severity" value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="px-4 py-2.5 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50">
                        <option value="">Semua Severity</option>
                        <option value="CRITICAL">Critical</option>
                        <option value="WARNING">Warning</option>
                        <option value="STABLE">Safe</option>
                    </select>
                    <select id="violations-filter-status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2.5 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50">
                        <option value="">Semua Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="RESOLVED">Resolved</option>
                    </select>
                    {!tableLoading && <span className="text-xs text-on-surface-variant ml-auto">{meta.total.toLocaleString()} baris ditemukan</span>}
                </div>

                {/* -- Table -- */}
                <div className="glass-panel rounded-xl overflow-x-auto w-full">
                    <table className="w-full min-w-[1000px] text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-low/50 border-b border-outline-variant/20">
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase">Kode</th>
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase">Entitas</th>
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase">Kecamatan</th>
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase">Aturan Zonasi</th>
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase text-right w-24">Jarak (m)</th>
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase text-center">Severity</th>
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase text-center">Status</th>
                                <th className="py-4 px-5 text-xs text-on-surface-variant uppercase">Terdeteksi</th>
                                {user?.isAdmin && <th className="py-4 pl-5 pr-6 text-xs text-on-surface-variant uppercase text-center w-[260px] whitespace-nowrap">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10 text-sm">
                            {tableLoading && Array.from({ length: 8 }).map((_, i) => (
                                <tr key={`sk-${i}`} className="animate-pulse border-b border-outline-variant/10">
                                    <td className="py-3.5 px-5"><div className="h-3 w-14 rounded bg-white/10" /></td>
                                    <td className="py-3.5 px-5"><div className="h-3 rounded bg-white/10" style={{ width: `${110 + (i * 17) % 60}px` }} /></td>
                                    <td className="py-3.5 px-5"><div className="h-3 w-28 rounded bg-white/10" /></td>
                                    <td className="py-3.5 px-5"><div className="h-3 w-32 rounded bg-white/10" /></td>
                                    <td className="py-3.5 px-5 text-right"><div className="h-3 w-10 rounded bg-white/10 ml-auto" /></td>
                                    <td className="py-3.5 px-5 text-center"><div className="h-5 w-16 rounded-full bg-white/10 mx-auto" /></td>
                                    <td className="py-3.5 px-5 text-center"><div className="h-5 w-20 rounded-full bg-white/10 mx-auto" /></td>
                                    <td className="py-3.5 px-5"><div className="h-3 w-20 rounded bg-white/10" /></td>
                                    {user?.isAdmin && <td className="py-3.5 px-5"><div className="h-6 w-48 rounded bg-white/10 mx-auto" /></td>}
                                </tr>
                            ))}

                            {!tableLoading && rows.length === 0 && (
                                <tr>
                                    <td colSpan={user?.isAdmin ? 9 : 8} className="py-12 text-center text-on-surface-variant">Tidak ada data yang cocok dengan filter ini.</td>
                                </tr>
                            )}

                            {!tableLoading && rows.map(item => (
                                <tr key={item.id} className="hover:bg-surface-container-high/30 transition-colors cursor-default">
                                    <td className="py-3.5 px-5 font-mono text-xs text-on-surface-variant">{item.code}</td>
                                    <td className="py-3.5 px-5 text-white font-medium max-w-[200px] truncate" title={item.entityName}>{item.entityName}</td>
                                    <td className="py-3.5 px-5 text-on-surface-variant">{item.district}</td>
                                    <td className="py-3.5 px-5 text-on-surface-variant max-w-[180px] truncate" title={item.rule}>{item.rule}</td>
                                    <td className="py-3.5 px-5 text-right tabular-nums">{item.distanceM != null ? item.distanceM.toLocaleString() : '-'}</td>
                                    <td className="py-3.5 px-5 text-center">
                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${severityBadgeBg(item.severity)}`}>{severityLabel(item.severity)}</span>
                                    </td>
                                    <td className="py-3.5 px-5 text-center">
                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeBg(item.status)}`}>{statusLabel(item.status)}</span>
                                    </td>
                                    <td className="py-3.5 px-5 text-on-surface-variant tabular-nums">{item.detectedAt}</td>

                                    {user?.isAdmin && (
                                        <td className="py-3.5 pl-5 pr-6 text-center w-[260px] whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleOpenEdit(item)} disabled={actionLoading === item.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/25 text-xs font-medium hover:bg-blue-500/30 transition-colors disabled:opacity-50">
                                                    <span className="material-symbols-outlined text-[14px]">edit</span> Edit
                                                </button>
                                                <button onClick={() => handleDeleteViolation(item.id, item.code)} disabled={actionLoading === item.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-error/15 text-error border border-error/25 text-xs font-medium hover:bg-error/30 transition-colors disabled:opacity-50">
                                                    {actionLoading === item.id ? <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-[14px]">delete</span>} Hapus
                                                </button>
                                                <button onClick={() => handleRestoreViolation(item.id, item.code)} disabled={actionLoading === item.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-500/15 text-green-400 border border-green-500/25 text-xs font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50">
                                                    {actionLoading === item.id ? <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-[14px]">restore</span>} Restore
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* -- Pagination -- */}
                {!tableLoading && meta.totalPages > 1 && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-on-surface-variant">Halaman {meta.page} dari {meta.totalPages}</span>
                        <div className="flex gap-2">
                            <button disabled={meta.page <= 1} onClick={() => setPage(p => Math.max(p - 1, 1))} className="px-4 py-2 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface disabled:opacity-40 hover:bg-surface-container-high transition-all">← Prev</button>
                            <button disabled={meta.page >= meta.totalPages} onClick={() => setPage(p => Math.min(p + 1, meta.totalPages))} className="px-4 py-2 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface disabled:opacity-40 hover:bg-surface-container-high transition-all">Next →</button>
                        </div>
                    </div>
                )}
            </main>

            {selectedViolation && <EditModal item={selectedViolation} onClose={() => setSelectedViolation(null)} onSaved={handleSaveEdit} />}
        </div>
    );
};

export default ViolationsPage;


// import React, { useState, useEffect, useCallback } from 'react';
// import { useAuth } from '../context/AuthContext';
// import Header from '../components/Header';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';

// // --- Constants ---
// const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
// const PAGE_SIZE = 15;

// // KPI fallback
// const FALLBACK_SUMMARY = {
//     critical: 99,
//     warning: 0,
//     safe: 563,
//     total: 662,
// };

// // Data Fallback
// const FALLBACK_VIOLATIONS = [
//     { id: 'F-001', code: '#V-001', entityName: 'Indomaret Jagakarsa I', district: 'Jagakarsa', rule: '< 500m dari Pasar', distanceM: 210, severity: 'CRITICAL', status: 'ACTIVE', detectedAt: '2025-11-10' },
//     { id: 'F-002', code: '#V-002', entityName: 'Alfamart Jagakarsa III', district: 'Jagakarsa', rule: '< 500m dari Pasar', distanceM: 340, severity: 'CRITICAL', status: 'ACTIVE', detectedAt: '2025-11-12' },
//     { id: 'F-003', code: '#V-003', entityName: 'Indomaret Cilandak II', district: 'Cilandak', rule: '< 500m dari Pasar', distanceM: 125, severity: 'CRITICAL', status: 'ACTIVE', detectedAt: '2025-11-15' },
//     { id: 'F-004', code: '#V-004', entityName: 'Alfamidi Pesanggrahan I', district: 'Pesanggrahan', rule: '< 500m dari Pasar', distanceM: 290, severity: 'CRITICAL', status: 'ACTIVE', detectedAt: '2025-11-20' },
//     { id: 'F-005', code: '#V-005', entityName: 'Indomaret Pancoran IV', district: 'Pancoran', rule: '< 500m dari Pasar', distanceM: 410, severity: 'CRITICAL', status: 'ACTIVE', detectedAt: '2025-11-22' },
//     { id: 'F-006', code: '#V-006', entityName: 'Alfamart Mampang II', district: 'Mampang Prapatan', rule: '< 500m dari Pasar', distanceM: 180, severity: 'CRITICAL', status: 'ACTIVE', detectedAt: '2025-11-25' },
//     { id: 'F-007', code: '#V-007', entityName: 'Indomaret Kebayoran Baru', district: 'Kebayoran Baru', rule: '< 500m dari Pasar', distanceM: 320, severity: 'CRITICAL', status: 'ACTIVE', detectedAt: '2025-12-01' },
//     { id: 'F-008', code: '#V-008', entityName: 'Lawson Setiabudi I', district: 'Setiabudi', rule: '< 500m dari Pasar', distanceM: 460, severity: 'CRITICAL', status: 'ACTIVE', detectedAt: '2025-12-03' },
//     { id: 'F-009', code: '#V-009', entityName: 'Alfamart Pasar Minggu II', district: 'Pasar Minggu', rule: '< 500m dari Pasar', distanceM: 390, severity: 'CRITICAL', status: 'ACTIVE', detectedAt: '2025-12-05' },
//     { id: 'F-010', code: '#V-010', entityName: 'Indomaret Tebet VI', district: 'Tebet', rule: '< 500m dari Pasar', distanceM: 480, severity: 'CRITICAL', status: 'ACTIVE', detectedAt: '2025-12-07' },
//     { id: 'F-011', code: '#V-011', entityName: 'Indomaret Jagakarsa VII', district: 'Jagakarsa', rule: '< 500m dari Pasar', distanceM: 610, severity: 'STABLE', status: 'RESOLVED', detectedAt: '2025-10-01' },
//     { id: 'F-012', code: '#V-012', entityName: 'Alfamart Cilandak IV', district: 'Cilandak', rule: '< 500m dari Pasar', distanceM: 720, severity: 'STABLE', status: 'RESOLVED', detectedAt: '2025-10-05' },
//     { id: 'F-013', code: '#V-013', entityName: 'Alfamidi Kebayoran Lama', district: 'Kebayoran Lama', rule: '< 500m dari Pasar', distanceM: 850, severity: 'STABLE', status: 'RESOLVED', detectedAt: '2025-10-10' },
//     { id: 'F-014', code: '#V-014', entityName: 'Indomaret Pancoran VIII', district: 'Pancoran', rule: '< 500m dari Pasar', distanceM: 980, severity: 'STABLE', status: 'RESOLVED', detectedAt: '2025-10-15' },
//     { id: 'F-015', code: '#V-015', entityName: 'Lawson Setiabudi III', district: 'Setiabudi', rule: '< 500m dari Pasar', distanceM: 560, severity: 'STABLE', status: 'RESOLVED', detectedAt: '2025-10-20' },
// ];

// // --- Helpers ---
// function severityLabel(s) {
//     const map = { CRITICAL: 'Critical', WARNING: 'Warning', ELEVATED: 'Elevated', STABLE: 'Safe' };
//     return map[s?.toUpperCase()] ?? s ?? '-';
// }

// function statusLabel(s) {
//     const map = { ACTIVE: 'Active', UNDER_REVIEW: 'Under Review', RESOLVED: 'Resolved' };
//     return map[s?.toUpperCase()] ?? s ?? '-';
// }

// function severityBadgeBg(s) {
//     const u = s?.toUpperCase();
//     if (u === 'CRITICAL') return 'bg-error/15 text-error border border-error/30';
//     if (u === 'WARNING' || u === 'ELEVATED') return 'bg-tertiary/15 text-tertiary border border-tertiary/30';
//     return 'bg-green-400/10 text-green-400 border border-green-400/30';
// }

// function statusBadgeBg(s) {
//     const u = s?.toUpperCase();
//     if (u === 'ACTIVE') return 'bg-error/10 text-error border border-error/30';
//     if (u === 'UNDER_REVIEW') return 'bg-tertiary/10 text-tertiary border border-tertiary/30';
//     return 'bg-surface-container text-on-surface-variant border border-outline-variant/30';
// }

// function normaliseRow(v) {
//     return {
//         id: v.id,
//         code: v.code ?? `#V-${v.id?.slice(-4)}`,
//         entityName: v.entity?.name ?? v.entityName ?? '-',
//         entityType: v.entity?.type ?? v.entityType ?? '-',
//         district: v.district?.name ?? v.district ?? '-',
//         rule: v.zoningRule?.name ?? v.rule ?? `< ${v.zoningRule?.minDistanceMeters ?? 500}m dari Pasar`,
//         distanceM: v.distanceM ?? null,
//         severity: v.severity ?? 'STABLE',
//         status: v.status ?? 'RESOLVED',
//         detectedAt: v.detectedAt ? new Date(v.detectedAt).toLocaleDateString('id-ID') : '-',
//         description: v.description ?? '',
//     };
// }

// // ─── EditModal Component ────────────────────────────────────────────────────
// // Kerangka modal edit. Tampilkan saat selectedViolation terisi.
// const SEVERITY_OPTIONS = ['CRITICAL', 'WARNING', 'ELEVATED', 'STABLE'];
// const STATUS_OPTIONS = ['ACTIVE', 'UNDER_REVIEW', 'RESOLVED'];

// const EditModal = ({ item, onClose, onSaved }) => {
//     const [form, setForm] = React.useState({
//         severity: item.severity ?? 'STABLE',
//         status: item.status ?? 'RESOLVED',
//         distanceM: item.distanceM ?? '',
//         description: item.description ?? '',
//     });
//     const [saving, setSaving] = React.useState(false);
//     const [error, setError] = React.useState('');

//     const handleChange = (e) =>
//         setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setError('');
//         if (!form.severity || !form.status) {
//             setError('Severity dan Status wajib diisi.');
//             return;
//         }
//         setSaving(true);
//         try {
//             const token = (() => {
//                 try { return JSON.parse(localStorage.getItem('user'))?.token ?? ''; }
//                 catch { return ''; }
//             })();
//             const res = await fetch(`${API_BASE}/api/v1/violations/${item.id}`, {
//                 method: 'PATCH',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     ...(token && { Authorization: `Bearer ${token}` }),
//                 },
//                 body: JSON.stringify({
//                     severity: form.severity,
//                     status: form.status,
//                     distanceM: form.distanceM !== '' ? Number(form.distanceM) : undefined,
//                     description: form.description || undefined,
//                 }),
//             });
//             if (!res.ok) {
//                 const body = await res.json().catch(() => ({}));
//                 throw new Error(body?.message ?? `HTTP ${res.status}`);
//             }
//             onSaved(); // refresh tabel, tutup modal
//         } catch (err) {
//             console.error('[EditModal] PATCH gagal:', err);
//             setError(err.message ?? 'Gagal menyimpan perubahan. Coba lagi.');
//         } finally {
//             setSaving(false);
//         }
//     };

//     // Tutup modal jika klik overlay
//     const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

//     return (
//         <div
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
//             onClick={handleOverlayClick}
//             role="dialog"
//             aria-modal="true"
//             aria-labelledby="edit-modal-title"
//         >
//             <div className="glass-panel rounded-2xl p-8 w-full max-w-lg shadow-2xl">
//                 {/* Header */}
//                 <div className="flex items-center justify-between mb-6">
//                     <div>
//                         <h3 id="edit-modal-title" className="text-lg font-bold text-white">
//                             Edit Pelanggaran
//                         </h3>
//                         <p className="text-xs text-on-surface-variant mt-0.5">{item.code} — {item.entityName}</p>
//                     </div>
//                     <button
//                         onClick={onClose}
//                         className="text-on-surface-variant hover:text-white transition-colors"
//                         aria-label="Tutup modal"
//                     >
//                         <span className="material-symbols-outlined">close</span>
//                     </button>
//                 </div>

//                 {/* Error banner */}
//                 {error && (
//                     <div className="mb-4 px-4 py-2.5 rounded-lg bg-error/15 border border-error/30 text-error text-sm">
//                         {error}
//                     </div>
//                 )}

//                 {/* Form */}
//                 <form onSubmit={handleSubmit} className="flex flex-col gap-4">
//                     {/* Severity */}
//                     <div className="flex flex-col gap-1.5">
//                         <label className="text-xs text-on-surface-variant uppercase tracking-wide">Severity *</label>
//                         <select
//                             name="severity"
//                             value={form.severity}
//                             onChange={handleChange}
//                             className="px-4 py-2.5 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
//                         >
//                             {SEVERITY_OPTIONS.map(s => (
//                                 <option key={s} value={s}>{severityLabel(s)}</option>
//                             ))}
//                         </select>
//                     </div>

//                     {/* Status */}
//                     <div className="flex flex-col gap-1.5">
//                         <label className="text-xs text-on-surface-variant uppercase tracking-wide">Status *</label>
//                         <select
//                             name="status"
//                             value={form.status}
//                             onChange={handleChange}
//                             className="px-4 py-2.5 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
//                         >
//                             {STATUS_OPTIONS.map(s => (
//                                 <option key={s} value={s}>{statusLabel(s)}</option>
//                             ))}
//                         </select>
//                     </div>

//                     {/* Jarak */}
//                     <div className="flex flex-col gap-1.5">
//                         <label className="text-xs text-on-surface-variant uppercase tracking-wide">Jarak (M)</label>
//                         <input
//                             type="number"
//                             name="distanceM"
//                             value={form.distanceM}
//                             onChange={handleChange}
//                             min="0"
//                             placeholder="Opsional"
//                             className="px-4 py-2.5 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
//                         />
//                     </div>

//                     {/* Actions */}
//                     <div className="flex justify-end gap-3 mt-2">
//                         <button
//                             type="button"
//                             onClick={onClose}
//                             disabled={saving}
//                             className="px-5 py-2 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface text-sm font-medium hover:bg-surface-container-high transition-all disabled:opacity-50"
//                         >
//                             Batal
//                         </button>
//                         <button
//                             type="submit"
//                             disabled={saving}
//                             className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition-all disabled:opacity-60"
//                         >
//                             {saving && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
//                             {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// };

// // --- Component ---
// const ViolationsPage = () => {
//     const { user } = useAuth();

//     // -- KPI state --
//     const [summary, setSummary] = useState(FALLBACK_SUMMARY);
//     const [summaryLoading, setSummaryLoading] = useState(true);

//     // -- Table state --
//     const [rows, setRows] = useState([]);
//     const [tableLoading, setTableLoading] = useState(true);
//     const [usingFallback, setUsingFallback] = useState(false);
//     const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });

//     // -- Filter state --
//     const [search, setSearch] = useState('');
//     const [filterSeverity, setFilterSeverity] = useState('');
//     const [filterStatus, setFilterStatus] = useState('');
//     const [page, setPage] = useState(1);

//     // -- Action / modal state --
//     const [selectedViolation, setSelectedViolation] = useState(null); // item yang sedang diedit
//     const [actionLoading, setActionLoading] = useState(null);          // id baris yang sedang diproses

//     // --- Fetch KPI summary ---
//     useEffect(() => {
//         let cancelled = false;
//         setSummaryLoading(true);

//         fetch(`${API_BASE}/api/v1/violations/summary`)
//             .then(r => r.ok ? r.json() : Promise.reject(r.status))
//             .then(json => {
//                 if (cancelled) return;
//                 const d = json?.data ?? {};
//                 const byStatus = {};
//                 (d.byStatus ?? []).forEach(item => { byStatus[item.status] = item.count; });
//                 const bySeverity = {};
//                 (d.bySeverity ?? []).forEach(item => { bySeverity[item.severity] = item.count; });

//                 setSummary({
//                     critical: bySeverity['CRITICAL'] ?? 0,
//                     warning: (bySeverity['WARNING'] ?? 0) + (bySeverity['ELEVATED'] ?? 0),
//                     safe: bySeverity['STABLE'] ?? 0,
//                     total: (d.totalActive ?? 0) + (d.totalResolved ?? 0),
//                 });
//             })
//             .catch(err => {
//                 if (!cancelled) {
//                     console.warn('[Violations] summary API failed, using fallback:', err);
//                     setSummary(FALLBACK_SUMMARY);
//                 }
//             })
//             .finally(() => { if (!cancelled) setSummaryLoading(false); });

//         return () => { cancelled = true; };
//     }, []);

//     // --- Fetch table rows ---
//     const fetchRows = useCallback(() => {
//         let cancelled = false;
//         setTableLoading(true);

//         const params = new URLSearchParams({
//             page,
//             limit: PAGE_SIZE,
//             ...(filterSeverity && { severity: filterSeverity }),
//             ...(filterStatus && { status: filterStatus }),
//             ...(search && { search }),
//         });

//         fetch(`${API_BASE}/api/v1/violations?${params}`)
//             .then(r => r.ok ? r.json() : Promise.reject(r.status))
//             .then(json => {
//                 if (cancelled) return;
//                 const data = json?.data ?? [];
//                 if (data.length > 0 || json?.meta?.total > 0) {
//                     setRows(data.map(normaliseRow));
//                     setMeta({
//                         total: json.meta?.total ?? data.length,
//                         page: json.meta?.page ?? page,
//                         totalPages: json.meta?.totalPages ?? 1,
//                     });
//                     setUsingFallback(false);
//                 } else {
//                     const filtered = FALLBACK_VIOLATIONS.filter(v => {
//                         const matchSearch = !search || v.entityName.toLowerCase().includes(search.toLowerCase()) || v.district.toLowerCase().includes(search.toLowerCase());
//                         const matchSeverity = !filterSeverity || v.severity === filterSeverity;
//                         const matchStatus = !filterStatus || v.status === filterStatus;
//                         return matchSearch && matchSeverity && matchStatus;
//                     });
//                     setRows(filtered);
//                     setMeta({ total: filtered.length, page: 1, totalPages: 1 });
//                     setUsingFallback(true);
//                 }
//             })
//             .catch(err => {
//                 if (!cancelled) {
//                     console.warn('[Violations] table API failed, using fallback:', err);
//                     const filtered = FALLBACK_VIOLATIONS.filter(v => {
//                         const matchSearch = !search || v.entityName.toLowerCase().includes(search.toLowerCase()) || v.district.toLowerCase().includes(search.toLowerCase());
//                         const matchSeverity = !filterSeverity || v.severity === filterSeverity;
//                         const matchStatus = !filterStatus || v.status === filterStatus;
//                         return matchSearch && matchSeverity && matchStatus;
//                     });
//                     setRows(filtered);
//                     setMeta({ total: filtered.length, page: 1, totalPages: 1 });
//                     setUsingFallback(true);
//                 }
//             })
//             .finally(() => { if (!cancelled) setTableLoading(false); });

//         return () => { cancelled = true; };
//     }, [page, filterSeverity, filterStatus, search]);

//     useEffect(() => { fetchRows(); }, [fetchRows]);
//     useEffect(() => { setPage(1); }, [filterSeverity, filterStatus, search]);

//     // --- Export handlers ---
//     const CSV_HEADERS = ['Kode', 'Entitas', 'Kecamatan', 'Aturan Zonasi', 'Jarak (M)', 'Severity', 'Status', 'Terdeteksi'];

//     const getAllExportData = async () => {
//         if (usingFallback) {
//             return FALLBACK_VIOLATIONS.filter(v => {
//                 const matchSearch = !search || v.entityName.toLowerCase().includes(search.toLowerCase()) || v.district.toLowerCase().includes(search.toLowerCase());
//                 const matchSeverity = !filterSeverity || v.severity === filterSeverity;
//                 const matchStatus = !filterStatus || v.status === filterStatus;
//                 return matchSearch && matchSeverity && matchStatus;
//             });
//         }
//         try {
//             const params = new URLSearchParams({
//                 page: 1,
//                 limit: 9999,
//                 ...(filterSeverity && { severity: filterSeverity }),
//                 ...(filterStatus && { status: filterStatus }),
//                 ...(search && { search }),
//             });
//             const res = await fetch(`${API_BASE}/api/v1/violations?${params}`);
//             if (!res.ok) throw new Error(`HTTP ${res.status}`);
//             const json = await res.json();
//             const data = json?.data ?? [];
//             return data.length > 0 ? data.map(normaliseRow) : rows;
//         } catch (err) {
//             console.warn('[Export] Gagal fetch semua data, menggunakan halaman aktif:', err);
//             return rows;
//         }
//     };

//     const handleExportCSV = async () => {
//         const exportData = await getAllExportData();
//         const escapeCell = (val) => {
//             const str = val == null ? '' : String(val);
//             return str.includes(',') || str.includes('"') || str.includes('\n')
//                 ? `"${str.replace(/"/g, '""')}"`
//                 : str;
//         };
//         const headerRow = CSV_HEADERS.join(',');
//         const dataRows = exportData.map(r => [
//             r.code,
//             r.entityName,
//             r.district,
//             r.rule,
//             r.distanceM ?? '',
//             severityLabel(r.severity),
//             statusLabel(r.status),
//             r.detectedAt,
//         ].map(escapeCell).join(','));
//         const csvContent = [headerRow, ...dataRows].join('\n');
//         const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
//         const url = URL.createObjectURL(blob);
//         const link = document.createElement('a');
//         link.href = url;
//         link.setAttribute('download', 'Laporan_Pelanggaran_Zonify.csv');
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//         URL.revokeObjectURL(url);
//     };

//     const handleExportPDF = async () => {
//         const exportData = await getAllExportData();
//         const doc = new jsPDF({ orientation: 'landscape' });
//         const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

//         doc.setFontSize(16);
//         doc.setTextColor(40);
//         doc.text('Laporan Pelanggaran Zonasi - Zonify', 14, 16);
//         doc.setFontSize(9);
//         doc.setTextColor(120);
//         doc.text(`Diunduh pada: ${today}  |  Total data: ${exportData.length} baris`, 14, 23);

//         const tableBody = exportData.map(r => [
//             r.code,
//             r.entityName,
//             r.district,
//             r.rule,
//             r.distanceM ?? '-',
//             severityLabel(r.severity),
//             statusLabel(r.status),
//             r.detectedAt,
//         ]);

//         autoTable(doc, {
//             startY: 28,
//             head: [CSV_HEADERS],
//             body: tableBody,
//             styles: { fontSize: 8, cellPadding: 3 },
//             headStyles: { fillColor: [30, 30, 60], textColor: 255 },
//             alternateRowStyles: { fillColor: [245, 245, 250] },
//         });

//         doc.save('Laporan_Pelanggaran_Zonify.pdf');
//     };

//     // --- Action handlers (Admin only) ─────────────────────────────────────

//     /** Baca JWT token dari localStorage (sesuai pola AuthContext proyek ini) */
//     const getAuthHeader = () => {
//         try {
//             const token = JSON.parse(localStorage.getItem('user'))?.token;
//             return token ? { Authorization: `Bearer ${token}` } : {};
//         } catch {
//             return {};
//         }
//     };

//     /** Edit — simpan item ke state agar EditModal muncul */
//     const handleOpenEdit = (item) => {
//         setSelectedViolation(item);
//     };

//     /** Dipanggil oleh EditModal setelah PATCH berhasil */
//     const handleSaveEdit = () => {
//         setSelectedViolation(null);
//         fetchRows(); // refresh tabel tanpa reload halaman
//     };

//     /** Hapus (soft-delete) — DELETE /api/v1/violations/:id */
//     const handleDeleteViolation = async (id, code) => {
//         if (!window.confirm(`Hapus pelanggaran ${code}? Tindakan ini tidak dapat dibatalkan.`)) return;

//         setActionLoading(id);
//         try {
//             const res = await fetch(`${API_BASE}/api/v1/violations/${id}`, {
//                 method: 'DELETE',
//                 headers: { ...getAuthHeader() },
//             });
//             if (!res.ok) {
//                 const body = await res.json().catch(() => ({}));
//                 throw new Error(body?.message ?? `HTTP ${res.status}`);
//             }
//             fetchRows(); // refresh tabel
//         } catch (err) {
//             console.error('[Delete] gagal:', err);
//             alert(`Gagal menghapus ${code}: ${err.message}`);
//         } finally {
//             setActionLoading(null);
//         }
//     };

//     /** Restore — PATCH /api/v1/violations/:id/restore */
//     const handleRestoreViolation = async (id, code) => {
//         if (!window.confirm(`Pulihkan pelanggaran ${code}?`)) return;

//         setActionLoading(id);
//         try {
//             const res = await fetch(`${API_BASE}/api/v1/violations/${id}/restore`, {
//                 method: 'PATCH',
//                 headers: { ...getAuthHeader() },
//             });
//             if (!res.ok) {
//                 const body = await res.json().catch(() => ({}));
//                 throw new Error(body?.message ?? `HTTP ${res.status}`);
//             }
//             fetchRows(); // refresh tabel
//         } catch (err) {
//             console.error('[Restore] gagal:', err);
//             alert(`Gagal memulihkan ${code}: ${err.message}`);
//         } finally {
//             setActionLoading(null);
//         }
//     };

//     // --- Render ---
//     return (
//         <div className="bg-background text-on-surface font-body min-h-screen antialiased">
//             <Header />

//             <main className="ml-64 p-8 flex flex-col gap-8 relative z-10">

//                 {/* -- Page heading -- */}
//                 <div className="flex items-end justify-between">
//                     <div>
//                         <h2 className="font-headline text-3xl font-bold text-white tracking-tight">
//                             All Violations
//                         </h2>
//                         <p className="text-sm text-on-surface-variant mt-1">
//                             Daftar pelanggaran zonasi komersial berdasarkan data database.
//                             {usingFallback && (
//                                 <span className="ml-2 text-xs text-tertiary italic">
//                                     (Menampilkan snapshot offline — API tidak terjangkau)
//                                 </span>
//                             )}
//                         </p>
//                     </div>

//                     <div className="flex gap-3">
//                         <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-medium border border-outline-variant/20 transition-all">
//                             <span className="material-symbols-outlined text-sm">download</span>
//                             CSV
//                         </button>
//                         <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-medium border border-outline-variant/20 transition-all">
//                             <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
//                             PDF Report
//                         </button>
//                     </div>
//                 </div>

//                 {/* -- KPI Summary chips -- */}
//                 <div className="flex flex-wrap gap-4">
//                     {/* Total */}
//                     <div className="glass-panel rounded-xl px-6 py-4 flex items-center gap-4 min-w-[160px]">
//                         {summaryLoading
//                             ? <div className="w-8 h-8 rounded-lg bg-white/10 animate-pulse flex-shrink-0" />
//                             : <span className="material-symbols-outlined text-2xl text-on-surface-variant">store</span>
//                         }
//                         <div className="flex flex-col gap-1.5">
//                             <p className="text-xs text-on-surface-variant uppercase tracking-wide">Total Minimarket</p>
//                             {summaryLoading
//                                 ? <div className="h-7 w-16 rounded-md bg-white/10 animate-pulse" />
//                                 : <p className="text-2xl font-bold text-white">{summary.total.toLocaleString()}</p>
//                             }
//                         </div>
//                     </div>

//                     {/* Critical */}
//                     <div className="glass-panel rounded-xl px-6 py-4 flex items-center gap-4 min-w-[160px] border border-error/20">
//                         {summaryLoading
//                             ? <div className="w-8 h-8 rounded-lg bg-error/10 animate-pulse flex-shrink-0" />
//                             : <span className="material-symbols-outlined text-2xl text-error">report</span>
//                         }
//                         <div className="flex flex-col gap-1.5">
//                             <p className="text-xs text-on-surface-variant uppercase tracking-wide">Critical</p>
//                             {summaryLoading
//                                 ? <div className="h-7 w-12 rounded-md bg-error/15 animate-pulse" />
//                                 : <p className="text-2xl font-bold text-error">{summary.critical.toLocaleString()}</p>
//                             }
//                         </div>
//                     </div>

//                     {/* Warning */}
//                     <div className="glass-panel rounded-xl px-6 py-4 flex items-center gap-4 min-w-[160px] border border-tertiary/20">
//                         {summaryLoading
//                             ? <div className="w-8 h-8 rounded-lg bg-tertiary/10 animate-pulse flex-shrink-0" />
//                             : <span className="material-symbols-outlined text-2xl text-tertiary">warning</span>
//                         }
//                         <div className="flex flex-col gap-1.5">
//                             <p className="text-xs text-on-surface-variant uppercase tracking-wide">Warning</p>
//                             {summaryLoading
//                                 ? <div className="h-7 w-10 rounded-md bg-tertiary/15 animate-pulse" />
//                                 : <p className="text-2xl font-bold text-tertiary">{summary.warning.toLocaleString()}</p>
//                             }
//                         </div>
//                     </div>

//                     {/* Safe */}
//                     <div className="glass-panel rounded-xl px-6 py-4 flex items-center gap-4 min-w-[160px] border border-green-400/20">
//                         {summaryLoading
//                             ? <div className="w-8 h-8 rounded-lg bg-green-400/10 animate-pulse flex-shrink-0" />
//                             : <span className="material-symbols-outlined text-2xl text-green-400">check_circle</span>
//                         }
//                         <div className="flex flex-col gap-1.5">
//                             <p className="text-xs text-on-surface-variant uppercase tracking-wide">Safe</p>
//                             {summaryLoading
//                                 ? <div className="h-7 w-14 rounded-md bg-green-400/10 animate-pulse" />
//                                 : <p className="text-2xl font-bold text-green-400">{summary.safe.toLocaleString()}</p>
//                             }
//                         </div>
//                     </div>
//                 </div>

//                 {/* -- Filters -- */}
//                 <div className="flex flex-wrap gap-3 items-center">
//                     {/* Search */}
//                     <div className="relative flex-1 min-w-[220px]">
//                         <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">search</span>
//                         <input
//                             id="violations-search"
//                             type="text"
//                             placeholder="Cari entitas atau kecamatan..."
//                             value={search}
//                             onChange={e => setSearch(e.target.value)}
//                             className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
//                         />
//                     </div>

//                     {/* Severity filter */}
//                     <select
//                         id="violations-filter-severity"
//                         value={filterSeverity}
//                         onChange={e => setFilterSeverity(e.target.value)}
//                         className="px-4 py-2.5 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
//                     >
//                         <option value="">Semua Severity</option>
//                         <option value="CRITICAL">Critical</option>
//                         <option value="WARNING">Warning</option>
//                         <option value="ELEVATED">Elevated</option>
//                         <option value="STABLE">Safe</option>
//                     </select>

//                     {/* Status filter */}
//                     <select
//                         id="violations-filter-status"
//                         value={filterStatus}
//                         onChange={e => setFilterStatus(e.target.value)}
//                         className="px-4 py-2.5 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
//                     >
//                         <option value="">Semua Status</option>
//                         <option value="ACTIVE">Active</option>
//                         <option value="UNDER_REVIEW">Under Review</option>
//                         <option value="RESOLVED">Resolved</option>
//                     </select>

//                     {/* Row count hint */}
//                     {!tableLoading && (
//                         <span className="text-xs text-on-surface-variant ml-auto">
//                             {meta.total.toLocaleString()} baris ditemukan
//                         </span>
//                     )}
//                 </div>

//                 {/* -- Table -- */}
//                 <div className="glass-panel rounded-xl overflow-x-auto w-full">
//                     <table className="w-full min-w-[1000px] text-left border-collapse">
//                         <thead>
//                             <tr className="bg-surface-container-low/50 border-b border-outline-variant/20">
//                                 <th className="py-4 px-5 text-xs text-on-surface-variant uppercase">Kode</th>
//                                 <th className="py-4 px-5 text-xs text-on-surface-variant uppercase">Entitas</th>
//                                 <th className="py-4 px-5 text-xs text-on-surface-variant uppercase">Kecamatan</th>
//                                 <th className="py-4 px-5 text-xs text-on-surface-variant uppercase">Aturan Zonasi</th>
//                                 <th className="py-4 px-5 text-xs text-on-surface-variant uppercase text-right w-24">Jarak (m)</th>
//                                 <th className="py-4 px-5 text-xs text-on-surface-variant uppercase text-center">Severity</th>
//                                 <th className="py-4 px-5 text-xs text-on-surface-variant uppercase text-center">Status</th>
//                                 <th className="py-4 px-5 text-xs text-on-surface-variant uppercase">Terdeteksi</th>
//                                 {/* 🔒 RBAC: header Aksi hanya untuk Admin */}
//                                 {user?.isAdmin && (
//                                     <th className="py-4 pl-5 pr-6 text-xs text-on-surface-variant uppercase text-center w-[260px] whitespace-nowrap">
//                                         Aksi
//                                     </th>
//                                 )}
//                             </tr>
//                         </thead>

//                         <tbody className="divide-y divide-outline-variant/10 text-sm">
//                             {/* Loading skeleton */}
//                             {tableLoading && Array.from({ length: 8 }).map((_, i) => (
//                                 <tr key={`sk-${i}`} className="animate-pulse border-b border-outline-variant/10">
//                                     <td className="py-3.5 px-5"><div className="h-3 w-14 rounded bg-white/10" /></td>
//                                     <td className="py-3.5 px-5"><div className="h-3 rounded bg-white/10" style={{ width: `${110 + (i * 17) % 60}px` }} /></td>
//                                     <td className="py-3.5 px-5"><div className="h-3 w-28 rounded bg-white/10" /></td>
//                                     <td className="py-3.5 px-5"><div className="h-3 w-32 rounded bg-white/10" /></td>
//                                     <td className="py-3.5 px-5 text-right"><div className="h-3 w-10 rounded bg-white/10 ml-auto" /></td>
//                                     <td className="py-3.5 px-5 text-center"><div className="h-5 w-16 rounded-full bg-white/10 mx-auto" /></td>
//                                     <td className="py-3.5 px-5 text-center"><div className="h-5 w-20 rounded-full bg-white/10 mx-auto" /></td>
//                                     <td className="py-3.5 px-5"><div className="h-3 w-20 rounded bg-white/10" /></td>
//                                     {/* Aksi: skeleton hanya untuk Admin */}
//                                     {user?.isAdmin && (
//                                         <td className="py-3.5 px-5"><div className="h-6 w-48 rounded bg-white/10 mx-auto" /></td>
//                                     )}
//                                 </tr>
//                             ))}

//                             {/* No data */}
//                             {!tableLoading && rows.length === 0 && (
//                                 <tr>
//                                     <td colSpan={user?.isAdmin ? 9 : 8} className="py-12 text-center text-on-surface-variant">
//                                         Tidak ada data yang cocok dengan filter ini.
//                                     </td>
//                                 </tr>
//                             )}

//                             {/* Data rows */}
//                             {!tableLoading && rows.map(item => (
//                                 <tr
//                                     key={item.id}
//                                     className="hover:bg-surface-container-high/30 transition-colors cursor-default"
//                                 >
//                                     <td className="py-3.5 px-5 font-mono text-xs text-on-surface-variant">{item.code}</td>
//                                     <td className="py-3.5 px-5 text-white font-medium max-w-[200px] truncate" title={item.entityName}>
//                                         {item.entityName}
//                                     </td>
//                                     <td className="py-3.5 px-5 text-on-surface-variant">{item.district}</td>
//                                     <td className="py-3.5 px-5 text-on-surface-variant max-w-[180px] truncate" title={item.rule}>
//                                         {item.rule}
//                                     </td>
//                                     <td className="py-3.5 px-5 text-right tabular-nums">
//                                         {item.distanceM != null ? item.distanceM.toLocaleString() : '-'}
//                                     </td>
//                                     <td className="py-3.5 px-5 text-center">
//                                         <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${severityBadgeBg(item.severity)}`}>
//                                             {severityLabel(item.severity)}
//                                         </span>
//                                     </td>
//                                     <td className="py-3.5 px-5 text-center">
//                                         <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeBg(item.status)}`}>
//                                             {statusLabel(item.status)}
//                                         </span>
//                                     </td>
//                                     <td className="py-3.5 px-5 text-on-surface-variant tabular-nums">{item.detectedAt}</td>

//                                     {/* 🔒 RBAC: kolom Aksi hanya untuk Admin */}
//                                     {user?.isAdmin && (
//                                         <td className="py-3.5 pl-5 pr-6 text-center w-[260px] whitespace-nowrap">
//                                             <div className="flex items-center justify-center gap-2">

//                                                 {/* Tombol Edit (Biru) */}
//                                                 <button
//                                                     onClick={() => handleOpenEdit(item)}
//                                                     disabled={actionLoading === item.id}
//                                                     title="Edit pelanggaran ini"
//                                                     className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/25 text-xs font-medium hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                                                 >
//                                                     <span className="material-symbols-outlined text-[14px]">edit</span>
//                                                     Edit
//                                                 </button>

//                                                 {/* Tombol Hapus (Merah) */}
//                                                 <button
//                                                     onClick={() => handleDeleteViolation(item.id, item.code)}
//                                                     disabled={actionLoading === item.id}
//                                                     title="Hapus pelanggaran ini"
//                                                     className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-error/15 text-error border border-error/25 text-xs font-medium hover:bg-error/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                                                 >
//                                                     {actionLoading === item.id
//                                                         ? <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
//                                                         : <span className="material-symbols-outlined text-[14px]">delete</span>
//                                                     }
//                                                     Hapus
//                                                 </button>

//                                                 {/* Tombol Restore (Hijau) */}
//                                                 <button
//                                                     onClick={() => handleRestoreViolation(item.id, item.code)}
//                                                     disabled={actionLoading === item.id}
//                                                     title="Pulihkan pelanggaran ini"
//                                                     className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-500/15 text-green-400 border border-green-500/25 text-xs font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                                                 >
//                                                     {actionLoading === item.id
//                                                         ? <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
//                                                         : <span className="material-symbols-outlined text-[14px]">restore</span>
//                                                     }
//                                                     Restore
//                                                 </button>

//                                             </div>
//                                         </td>
//                                     )}
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>

//                 {/* -- Pagination -- */}
//                 {!tableLoading && meta.totalPages > 1 && (
//                     <div className="flex items-center justify-between text-sm">
//                         <span className="text-on-surface-variant">
//                             Halaman {meta.page} dari {meta.totalPages}
//                         </span>
//                         <div className="flex gap-2">
//                             <button
//                                 id="violations-prev-page"
//                                 disabled={meta.page <= 1}
//                                 onClick={() => setPage(p => Math.max(p - 1, 1))}
//                                 className="px-4 py-2 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface disabled:opacity-40 hover:bg-surface-container-high transition-all"
//                             >
//                                 ← Prev
//                             </button>
//                             <button
//                                 id="violations-next-page"
//                                 disabled={meta.page >= meta.totalPages}
//                                 onClick={() => setPage(p => Math.min(p + 1, meta.totalPages))}
//                                 className="px-4 py-2 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface disabled:opacity-40 hover:bg-surface-container-high transition-all"
//                             >
//                                 Next →
//                             </button>
//                         </div>
//                     </div>
//                 )}

//             </main>

//             {/* ── EditModal: tampil jika selectedViolation terisi ─────────── */}
//             {selectedViolation && (
//                 <EditModal
//                     item={selectedViolation}
//                     onClose={() => setSelectedViolation(null)}
//                     onSaved={handleSaveEdit}
//                 />
//             )}
//         </div>
//     );
// };

// export default ViolationsPage;
