import React, { useState } from 'react';
import Header from '../../components/Header';

// ─── Data Mock: Pasar Tradisional Jakarta Selatan ──────────────────────────
const PASAR_DATA = [
  { id: 1, nama: 'Pasar Minggu', kecamatan: 'Pasar Minggu', lat: -6.2883, lng: 106.8376 },
  { id: 2, nama: 'Pasar Santa', kecamatan: 'Kebayoran Baru', lat: -6.2446, lng: 106.7982 },
  { id: 3, nama: 'Pasar Mayestik', kecamatan: 'Kebayoran Baru', lat: -6.2388, lng: 106.7999 },
  { id: 4, nama: 'Pasar Blok M', kecamatan: 'Kebayoran Baru', lat: -6.2443, lng: 106.7987 },
  { id: 5, nama: 'Pasar Cipete', kecamatan: 'Cilandak', lat: -6.2779, lng: 106.7985 },
];

const THRESHOLD_METER = 500;

// ─── Haversine Formula ────────────────────────────────────────────────────────
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Jari-jari bumi dalam meter
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c); // Jarak dalam meter
};

// ─── Component ────────────────────────────────────────────────────────────────
const Calculator = () => {
  const [form, setForm] = useState({ nama: '', lat: '', lng: '' });
  const [results, setResults] = useState(null);
  const [showFormula, setShowFormula] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleCalculate = () => {
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);

    if (isNaN(lat) || isNaN(lng)) {
      setError('Harap masukkan nilai Latitude dan Longitude yang valid.');
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('Koordinat di luar rentang valid. Latitude: -90 s/d 90, Longitude: -180 s/d 180.');
      return;
    }

    const calculated = PASAR_DATA.map((pasar) => ({
      ...pasar,
      jarak: calculateHaversineDistance(lat, lng, pasar.lat, pasar.lng),
    })).sort((a, b) => a.jarak - b.jarak);

    setResults({ input: { nama: form.nama || 'Calon Minimarket', lat, lng }, list: calculated });
  };

  const handleReset = () => {
    setForm({ nama: '', lat: '', lng: '' });
    setResults(null);
    setError('');
  };

  const nearest = results?.list?.[0];
  const isViolation = nearest && nearest.jarak < THRESHOLD_METER;

  return (
    <div className="bg-background text-on-surface font-body min-h-screen antialiased">
      <Header />

      <main className="ml-64 p-8 flex flex-col gap-8 relative z-10">

        {/* ── Page Header ── */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                <span className="material-symbols-outlined text-white text-lg">calculate</span>
              </div>
              <h1 className="font-headline text-3xl font-bold text-white tracking-tight">
                Kalkulator Jarak Otomatis
              </h1>
            </div>
            <p className="text-sm text-on-surface-variant mt-1 pl-12">
              Implementasi <span className="text-purple-400 font-semibold">Haversine Formula</span> untuk cek kelayakan zonasi minimarket.
            </p>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-medium border border-outline-variant/20 transition-all"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Reset
          </button>
        </div>

        {/* ── Formula Accordion ── */}
        <div className="glass-panel rounded-xl overflow-hidden border border-purple-500/20">
          <button
            onClick={() => setShowFormula(!showFormula)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-purple-400">functions</span>
              <span className="font-semibold text-white text-sm tracking-wide">
                Tentang Formula Haversine
              </span>
            </div>
            <span
              className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 ${showFormula ? 'rotate-180' : ''}`}
            >
              expand_more
            </span>
          </button>

          {showFormula && (
            <div className="px-6 pb-5 border-t border-purple-500/10 pt-4 flex flex-col gap-3 animate-[fadeIn_0.2s_ease]">
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Formula Haversine menghitung <span className="text-white">jarak terpendek</span> antara dua titik di permukaan bola (Bumi) berdasarkan koordinat lintang dan bujur.
              </p>
              <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700/50 font-mono text-xs text-purple-300 leading-relaxed">
                <p className="text-slate-400 mb-2">// Langkah 1: Hitung selisih koordinat</p>
                <p>Δlat = lat₂ − lat₁  |  Δlon = lon₂ − lon₁</p>
                <br />
                <p className="text-slate-400 mb-2">// Langkah 2: Formula inti</p>
                <p>a = sin²(Δlat/2) + cos(lat₁) × cos(lat₂) × sin²(Δlon/2)</p>
                <br />
                <p className="text-slate-400 mb-2">// Langkah 3: Jarak akhir (meter)</p>
                <p>c = 2 × atan2(√a, √(1−a))</p>
                <p>d = R × c  <span className="text-slate-500">(R = 6.371.000 m)</span></p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="material-symbols-outlined text-xs text-red-400">warning</span>
                Threshold zonasi: minimarket dilarang dalam radius &lt; <span className="text-white font-semibold mx-1">{THRESHOLD_METER} meter</span> dari pasar tradisional.
              </div>
            </div>
          )}
        </div>

        {/* ── Input Form ── */}
        <div className="glass-panel rounded-xl p-6 border border-slate-700/30">
          <h2 className="font-semibold text-white mb-5 flex items-center gap-2 text-sm uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm text-red-400">pin_drop</span>
            Data Calon Minimarket
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {/* Nama (opsional) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-on-surface-variant uppercase tracking-wider">
                Nama Calon Minimarket <span className="text-slate-600">(opsional)</span>
              </label>
              <input
                type="text"
                name="nama"
                value={form.nama}
                onChange={handleChange}
                placeholder="cth: Indomaret Fatmawati"
                className="bg-slate-900/60 border border-slate-700/60 rounded-lg px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/30 transition-all"
              />
            </div>

            {/* Latitude */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-on-surface-variant uppercase tracking-wider">
                Latitude <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                name="lat"
                value={form.lat}
                onChange={handleChange}
                placeholder="cth: -6.2615"
                step="any"
                className="bg-slate-900/60 border border-slate-700/60 rounded-lg px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/30 transition-all"
              />
            </div>

            {/* Longitude */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-on-surface-variant uppercase tracking-wider">
                Longitude <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                name="lng"
                value={form.lng}
                onChange={handleChange}
                placeholder="cth: 106.8120"
                step="any"
                className="bg-slate-900/60 border border-slate-700/60 rounded-lg px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/30 transition-all"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          {/* Action Button */}
          <button
            id="btn-hitung-jarak"
            onClick={handleCalculate}
            className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm tracking-widest uppercase rounded-lg shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all duration-300 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">route</span>
            Hitung Jarak &amp; Cek Zonasi
          </button>
        </div>

        {/* ── Result Cards ── */}
        {results && (
          <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease]">

            {/* Status Utama */}
            <div
              className={`rounded-xl p-6 border flex items-start gap-5 ${
                isViolation
                  ? 'bg-red-900/20 border-red-500/40 shadow-[0_0_30px_rgba(220,38,38,0.1)]'
                  : 'bg-green-900/20 border-green-500/40 shadow-[0_0_30px_rgba(34,197,94,0.1)]'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isViolation ? 'bg-red-500/20' : 'bg-green-500/20'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-2xl ${
                    isViolation ? 'text-red-400' : 'text-green-400'
                  }`}
                >
                  {isViolation ? 'gpp_bad' : 'verified'}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h3 className="font-headline text-xl font-bold text-white">
                    {results.input.nama}
                  </h3>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                      isViolation
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}
                  >
                    {isViolation ? '⚠ Melanggar Zonasi' : '✓ Aman'}
                  </span>
                </div>

                <p className="text-sm text-on-surface-variant mb-3">
                  Koordinat: <span className="text-white font-mono">{results.input.lat}, {results.input.lng}</span>
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-black/20 rounded-lg px-4 py-3">
                    <p className="text-xs text-on-surface-variant mb-0.5">Pasar Terdekat</p>
                    <p className="text-white font-semibold text-sm truncate">{nearest.nama}</p>
                  </div>
                  <div className="bg-black/20 rounded-lg px-4 py-3">
                    <p className="text-xs text-on-surface-variant mb-0.5">Jarak</p>
                    <p
                      className={`font-bold text-base ${isViolation ? 'text-red-400' : 'text-green-400'}`}
                    >
                      {nearest.jarak.toLocaleString('id-ID')} m
                    </p>
                  </div>
                  <div className="bg-black/20 rounded-lg px-4 py-3">
                    <p className="text-xs text-on-surface-variant mb-0.5">Kecamatan</p>
                    <p className="text-white font-semibold text-sm">{nearest.kecamatan}</p>
                  </div>
                </div>

                {isViolation && (
                  <p className="mt-3 text-xs text-red-300/80">
                    Jarak {nearest.jarak} m &lt; batas minimum {THRESHOLD_METER} m. Lokasi ini <strong>tidak memenuhi</strong> syarat zonasi minimarket berdasarkan regulasi.
                  </p>
                )}
              </div>
            </div>

            {/* Tabel Semua Pasar */}
            <div className="glass-panel rounded-xl overflow-hidden border border-slate-700/30">
              <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-on-surface-variant">table_view</span>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Jarak ke Semua Pasar Tradisional
                </h3>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low/50 border-b border-outline-variant/20">
                    <th className="py-3 px-6 text-xs text-on-surface-variant uppercase">#</th>
                    <th className="py-3 px-6 text-xs text-on-surface-variant uppercase">Nama Pasar</th>
                    <th className="py-3 px-6 text-xs text-on-surface-variant uppercase">Kecamatan</th>
                    <th className="py-3 px-6 text-xs text-on-surface-variant uppercase text-right">Jarak</th>
                    <th className="py-3 px-6 text-xs text-on-surface-variant uppercase text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-sm">
                  {results.list.map((pasar, idx) => {
                    const aman = pasar.jarak >= THRESHOLD_METER;
                    return (
                      <tr
                        key={pasar.id}
                        className={`transition-colors hover:bg-white/5 ${idx === 0 ? 'bg-surface-container-highest/30' : ''}`}
                      >
                        <td className="py-3.5 px-6 text-on-surface-variant">{idx + 1}</td>
                        <td className="py-3.5 px-6 text-white font-medium">
                          {pasar.nama}
                          {idx === 0 && (
                            <span className="ml-2 text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                              Terdekat
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-on-surface-variant">{pasar.kecamatan}</td>
                        <td className="py-3.5 px-6 text-right font-mono font-medium text-white">
                          {pasar.jarak.toLocaleString('id-ID')} m
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              aman
                                ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                                : 'bg-red-500/15 text-red-400 border border-red-500/25'
                            }`}
                          >
                            {aman ? 'Aman' : 'Melanggar'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default Calculator;
