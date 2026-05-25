import React, { useState, useEffect } from 'react';
import Header from '../components/Header';

// ─── Corrected fallback data (total violations = 99) ───────────────────────
// Used when the API is unavailable / returns no data.
// Saturation % is proportional: top = 100%, scaled linearly down to ~25%.
// Status logic: >= 70% → Critical | >= 45% → Warning | < 45% → Safe
const FALLBACK_RANKINGS = [
  { position: 1, name: 'Jagakarsa', violationCount: 20, saturationPercent: 100, status: 'CRITICAL' },
  { position: 2, name: 'Cilandak', violationCount: 14, saturationPercent: 70, status: 'CRITICAL' },
  { position: 3, name: 'Pesanggrahan', violationCount: 14, saturationPercent: 70, status: 'CRITICAL' },
  { position: 4, name: 'Pancoran', violationCount: 10, saturationPercent: 50, status: 'WARNING' },
  { position: 5, name: 'Mampang Prapatan', violationCount: 9, saturationPercent: 45, status: 'WARNING' },
  { position: 6, name: 'Kebayoran Baru', violationCount: 8, saturationPercent: 40, status: 'STABLE' },
  { position: 7, name: 'Setiabudi', violationCount: 7, saturationPercent: 35, status: 'STABLE' },
  { position: 8, name: 'Pasar Minggu', violationCount: 6, saturationPercent: 30, status: 'STABLE' },
  { position: 9, name: 'Kebayoran Lama', violationCount: 6, saturationPercent: 30, status: 'STABLE' },
  { position: 10, name: 'Tebet', violationCount: 5, saturationPercent: 25, status: 'STABLE' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function statusLabel(status) {
  const map = {
    CRITICAL: 'Critical',
    WARNING: 'Warning',
    STABLE: 'Safe',
  };
  return map[status?.toUpperCase()] ?? status ?? '-';
}

function statusColorClass(status) {
  const s = status?.toUpperCase();
  if (s === 'CRITICAL') return 'text-error';
  if (s === 'WARNING') return 'text-tertiary';
  return 'text-green-400';
}

function rowBgClass(idx) {
  return idx === 0 ? 'bg-surface-container-highest/40' : '';
}

function pad(n) {
  return String(n).padStart(2, '0');
}

// ─── Component ───────────────────────────────────────────────────────────────
const Rankings = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchRankings = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/districts/rankings`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (!cancelled) {
          const data = json?.data ?? [];
          if (data.length > 0) {
            // Sort by violationCount descending, re-assign positions
            const sorted = [...data]
              .sort((a, b) => (b.violationCount ?? 0) - (a.violationCount ?? 0))
              .map((d, i) => ({ ...d, position: i + 1 }));
            setRankings(sorted);
            setUsingFallback(false);
          } else {
            // API returned empty – use corrected fallback
            setRankings(FALLBACK_RANKINGS);
            setUsingFallback(true);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[Rankings] API fetch failed, using fallback data:', err.message);
          setRankings(FALLBACK_RANKINGS);
          setUsingFallback(true);
          setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRankings();
    return () => { cancelled = true; };
  }, []);

  const totalViolations = rankings.reduce((sum, r) => sum + (r.violationCount ?? 0), 0);

  return (
    <div className="bg-background text-on-surface font-body min-h-screen antialiased">
      <Header />

      <main className="ml-64 p-8 flex flex-col gap-8 items-start relative z-10">
        <section className="flex-1 flex flex-col gap-6 w-full">

          {/* ── Header row ── */}
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-headline text-3xl font-bold text-white tracking-tight">
                District Saturation
              </h2>
              <p className="text-sm text-on-surface-variant mt-1">
                Real-time ranking based on commercial zoning violations.
                {usingFallback && (
                  <span className="ml-2 text-xs text-tertiary italic">
                    (Displaying offline snapshot — API unreachable)
                  </span>
                )}
              </p>
            </div>

            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-medium border border-outline-variant/20 transition-all">
                <span className="material-symbols-outlined text-sm">download</span>
                CSV
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-medium border border-outline-variant/20 transition-all">
                <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                PDF Report
              </button>
            </div>
          </div>

          {/* ── Summary chip ── */}
          {!loading && (
            <div className="text-xs text-on-surface-variant">
              Showing <span className="text-white font-semibold">{rankings.length}</span> districts ·
              Total violations: <span className="text-white font-semibold">{totalViolations}</span>
            </div>
          )}

          {/* ── Table ── */}
          <div className="glass-panel rounded-xl overflow-hidden w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50 border-b border-outline-variant/20">
                  <th className="py-4 px-6 text-xs text-on-surface-variant uppercase">Pos</th>
                  <th className="py-4 px-6 text-xs text-on-surface-variant uppercase">District</th>
                  <th className="py-4 px-6 text-xs text-on-surface-variant uppercase text-right">Violations</th>
                  <th className="py-4 px-6 text-xs text-on-surface-variant uppercase text-right">Saturation %</th>
                  <th className="py-4 px-6 text-xs text-on-surface-variant uppercase text-center">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-outline-variant/10 text-sm">
                {loading && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined animate-spin text-2xl align-middle mr-2">progress_activity</span>
                      Loading rankings…
                    </td>
                  </tr>
                )}

                {!loading && rankings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-on-surface-variant">
                      No data available.
                    </td>
                  </tr>
                )}

                {!loading && rankings.map((district, idx) => {
                  const colorCls = statusColorClass(district.status);
                  return (
                    <tr key={district.id ?? district.name} className={rowBgClass(idx)}>
                      <td className="py-4 px-6 text-primary font-medium">{pad(district.position)}</td>
                      <td className="py-4 px-6 text-white">{district.name}</td>
                      <td className="py-4 px-6 text-right">{(district.violationCount ?? 0).toLocaleString()}</td>
                      <td className={`py-4 px-6 text-right ${colorCls}`}>
                        {(district.saturationPercent ?? 0).toFixed(1)}%
                      </td>
                      <td className={`py-4 px-6 text-center ${colorCls}`}>
                        {statusLabel(district.status)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </section>
      </main>
    </div>
  );
};

export default Rankings;