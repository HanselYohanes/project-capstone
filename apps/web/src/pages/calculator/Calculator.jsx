import React, { useState } from 'react';
import Header from '../../components/Header';
import { calculateZoning, predictAI } from '../../services/zoningApi';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const THRESHOLD_METER = 500;

const Calculator = () => {
  const [form, setForm] = useState({
    nama: '',
    lat: '',
    lng: '',
  });

  const [results, setResults] = useState(null);
  const [showFormula, setShowFormula] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleCalculate = async () => {
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

    try {
      setLoading(true);
      setError('');
      setResults(null);

      // Jalankan kedua request secara paralel agar lebih cepat.
      // Promise.allSettled memastikan jika salah satu gagal, yang lain tetap diproses.
      const [zoningResult, aiResult] = await Promise.allSettled([
        calculateZoning({
          name: form.nama || 'Calon Minimarket',
          latitude: lat,
          longitude: lng,
          radiusMeters: THRESHOLD_METER,
        }),
        predictAI({ latitude: lat, longitude: lng }),
      ]);

      // Zoning harus berhasil — jika gagal, lempar error seperti sebelumnya
      if (zoningResult.status === 'rejected') {
        throw new Error(zoningResult.reason?.message || 'Gagal menghitung zonasi.');
      }

      const zoningData = zoningResult.value?.data ?? {};

      // Gabungkan data AI ke dalam state hasil zonasi
      const aiData = aiResult.status === 'fulfilled' ? aiResult.value : {};

      setResults({
        ...zoningData,
        prediction: aiData.prediction ?? null,
        ai_recommendation: aiData.ai_recommendation ?? null,
      });
    } catch (err) {
      setError(err.message || 'Gagal menghitung zonasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({ nama: '', lat: '', lng: '' });
    setResults(null);
    setError('');
  };

  // Mengakses data dari 'results' yang sekarang berasal dari API
  const nearest = results?.result?.nearestPasar;
  const isViolation = results?.result?.isViolation;
  const nearestMarkets = results?.allMarkets || [];

  // Data prediksi AI dari ML API
  const prediction = results?.prediction;
  const aiRecommendation = results?.ai_recommendation;
  const isAiViolation = prediction?.is_violation === 1 || prediction?.verdict === 'Violation';

  return (
    <div className="bg-background text-on-surface font-body min-h-screen antialiased">
      <Header />
      <main className="ml-64 p-8 flex flex-col gap-8 relative z-10">

        {/* Page Header */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                <span className="material-symbols-outlined text-white text-lg">calculate</span>
              </div>
              <h1 className="font-headline text-3xl font-bold text-white tracking-tight">Distance calculator</h1>
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

        {/* Formula Accordion - Tetap Sama */}
        <div className="glass-panel rounded-xl overflow-hidden border border-purple-500/20">
          <button onClick={() => setShowFormula(!showFormula)} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/5 transition-all">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-purple-400">functions</span>
              <span className="font-semibold text-white text-sm tracking-wide">Tentang Formula Haversine</span>
            </div>
            <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 ${showFormula ? 'rotate-180' : ''}`}>expand_more</span>
          </button>
          {showFormula && (
            <div className="px-6 pb-5 border-t border-purple-500/10 pt-4 text-sm text-on-surface-variant">
              <p>Formula Haversine menghitung jarak terpendek antara dua titik di permukaan Bumi.</p>
            </div>
          )}
        </div>

        {/* Input Form - Tetap Sama */}
        <div className="glass-panel rounded-xl p-6 border border-slate-700/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <input type="text" name="nama" value={form.nama} onChange={handleChange} placeholder="Nama Calon Minimarket" className="bg-slate-900/60 border border-slate-700/60 rounded-lg px-4 py-3 text-white text-sm" />
            <input type="number" name="lat" value={form.lat} onChange={handleChange} placeholder="Latitude (cth: -6.2615)" step="any" className="bg-slate-900/60 border border-slate-700/60 rounded-lg px-4 py-3 text-white text-sm" />
            <input type="number" name="lng" value={form.lng} onChange={handleChange} placeholder="Longitude (cth: 106.8120)" step="any" className="bg-slate-900/60 border border-slate-700/60 rounded-lg px-4 py-3 text-white text-sm" />
          </div>
          {error && <div className="mb-4 text-red-400 text-sm">{error}</div>}
          <button onClick={handleCalculate} disabled={loading} className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm uppercase rounded-lg">
            {loading ? 'Menghitung...' : 'Hitung Jarak & Cek Zonasi'}
          </button>
        </div>

        {/* ── Calon Minimarket AI Prediction Container ── */}
        <div
          className={`rounded-xl border transition-all duration-500 overflow-hidden ${loading
            ? 'bg-slate-800/40 border-slate-600/30'
            : prediction && isAiViolation
              ? 'bg-red-950/30 border-red-500/40 shadow-[0_0_30px_rgba(220,38,38,0.12)]'
              : prediction && !isAiViolation
                ? 'bg-green-950/30 border-green-500/40 shadow-[0_0_30px_rgba(34,197,94,0.12)]'
                : 'glass-panel border-slate-700/30'
            }`}
        >
          {/* Container Header */}
          <div
            className={`px-6 py-4 border-b flex items-center gap-3 ${loading
              ? 'border-slate-600/20'
              : prediction && isAiViolation
                ? 'border-red-500/20 bg-red-900/20'
                : prediction && !isAiViolation
                  ? 'border-green-500/20 bg-green-900/20'
                  : 'border-outline-variant/20'
              }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${loading
                ? 'bg-slate-700/50'
                : prediction && isAiViolation
                  ? 'bg-red-500/20'
                  : prediction && !isAiViolation
                    ? 'bg-green-500/20'
                    : 'bg-purple-500/20'
                }`}
            >
              <span
                className={`material-symbols-outlined text-base ${loading
                  ? 'text-slate-400 animate-spin'
                  : prediction && isAiViolation
                    ? 'text-red-400'
                    : prediction && !isAiViolation
                      ? 'text-green-400'
                      : 'text-purple-400'
                  }`}
              >
                {loading
                  ? 'progress_activity'
                  : prediction && isAiViolation
                    ? 'gpp_bad'
                    : prediction && !isAiViolation
                      ? 'verified'
                      : 'storefront'}
              </span>
            </div>
            <span className="text-sm font-semibold text-white uppercase tracking-widest">
              Calon Minimarket
            </span>
            {prediction && (
              <span
                className={`ml-auto text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${isAiViolation
                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                  : 'bg-green-500/20 text-green-400 border-green-500/30'
                  }`}
              >
                {isAiViolation ? '⚠ Melanggar' : '✓ Aman'}
              </span>
            )}
          </div>

          {/* Container Body */}
          <div className="px-6 py-5">
            {/* ─── LOADING STATE ─── */}
            {loading && (
              <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
                <div className="w-10 h-10 rounded-full border-2 border-slate-600 border-t-purple-500 animate-spin" />
                <p className="text-sm text-on-surface-variant animate-pulse">
                  Menganalisis Kepatuhan Tata Ruang...
                </p>
              </div>
            )}

            {/* ─── DEFAULT / IDLE STATE ─── */}
            {!loading && !prediction && (
              <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-600">location_searching</span>
                <div>
                  <p className="text-sm font-medium text-on-surface-variant">Belum ada prediksi</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Masukkan koordinat dan klik{' '}
                    <span className="text-purple-400 font-semibold">Hitung Jarak &amp; Cek Zonasi</span>{' '}
                    untuk mendapatkan analisis AI.
                  </p>
                </div>
              </div>
            )}

            {/* ─── VIOLATION STATE ─── */}
            {!loading && prediction && isAiViolation && (
              <div className="flex flex-col gap-4 animate-[fadeIn_0.4s_ease]">
                {/* Verdict Badge */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <span className="material-symbols-outlined text-3xl text-red-400">cancel</span>
                  <div>
                    <p className="text-lg font-extrabold text-red-400 uppercase tracking-wider leading-tight">
                      MELANGGAR / TIDAK AMAN
                    </p>
                    <p className="text-xs text-red-300/70 mt-0.5">Lokasi ini tidak memenuhi syarat zonasi minimarket</p>
                  </div>
                </div>

                {/* Confidence */}
                <div className="flex items-center justify-between bg-black/20 rounded-lg px-4 py-3">
                  <span className="text-xs text-on-surface-variant uppercase tracking-wider">Tingkat Kepercayaan AI</span>
                  <span className="text-base font-bold text-red-400">{prediction.confidence_percentage}</span>
                </div>

                {/* Mini Map */}
                {results?.input?.latitude && results?.input?.longitude && (
                  <div className="rounded-xl overflow-hidden border border-red-500/20" style={{ height: '220px' }}>
                    <MapContainer
                      key={`map-violation-${results.input.latitude}-${results.input.longitude}`}
                      center={[results.input.latitude, results.input.longitude]}
                      zoom={15}
                      style={{ height: '100%', width: '100%' }}
                      zoomControl={false}
                      scrollWheelZoom={false}
                      attributionControl={false}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      {/* Radius zona 500m */}
                      <Circle
                        center={[results.input.latitude, results.input.longitude]}
                        radius={THRESHOLD_METER}
                        pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.08, weight: 1.5, dashArray: '5, 5' }}
                      />
                      {/* Marker titik calon minimarket */}
                      <CircleMarker
                        center={[results.input.latitude, results.input.longitude]}
                        radius={9}
                        pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 1, weight: 2 }}
                      >
                        <Popup>
                          <div className="text-sm">
                            <strong>{results.input?.name || 'Calon Minimarket'}</strong><br />
                            {results.input.latitude.toFixed(6)}, {results.input.longitude.toFixed(6)}<br />
                            <span style={{ color: '#EF4444', fontWeight: 'bold' }}>⚠ Melanggar Zonasi</span>
                          </div>
                        </Popup>
                      </CircleMarker>
                    </MapContainer>
                  </div>
                )}

                {/* AI Recommendation */}
                {aiRecommendation && (
                  <div className="rounded-xl bg-red-900/10 border border-red-500/15 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-sm text-red-400">smart_toy</span>
                      <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Rekomendasi AI</span>
                    </div>
                    <p className="text-sm text-red-200/80 leading-relaxed">{aiRecommendation}</p>
                  </div>
                )}
              </div>
            )}

            {/* ─── COMPLIANCE STATE ─── */}
            {!loading && prediction && !isAiViolation && (
              <div className="flex flex-col gap-4 animate-[fadeIn_0.4s_ease]">
                {/* Verdict Badge */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <span className="material-symbols-outlined text-3xl text-green-400">check_circle</span>
                  <div>
                    <p className="text-lg font-extrabold text-green-400 uppercase tracking-wider leading-tight">
                      AMAN / PATUH ZONASI
                    </p>
                    <p className="text-xs text-green-300/70 mt-0.5">Lokasi ini memenuhi persyaratan zonasi minimarket</p>
                  </div>
                </div>

                {/* Confidence */}
                <div className="flex items-center justify-between bg-black/20 rounded-lg px-4 py-3">
                  <span className="text-xs text-on-surface-variant uppercase tracking-wider">Tingkat Kepercayaan AI</span>
                  <span className="text-base font-bold text-green-400">{prediction.confidence_percentage}</span>
                </div>

                {/* Mini Map */}
                {results?.input?.latitude && results?.input?.longitude && (
                  <div className="rounded-xl overflow-hidden border border-green-500/20" style={{ height: '220px' }}>
                    <MapContainer
                      key={`map-compliance-${results.input.latitude}-${results.input.longitude}`}
                      center={[results.input.latitude, results.input.longitude]}
                      zoom={15}
                      style={{ height: '100%', width: '100%' }}
                      zoomControl={false}
                      scrollWheelZoom={false}
                      attributionControl={false}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      {/* Radius zona 500m */}
                      <Circle
                        center={[results.input.latitude, results.input.longitude]}
                        radius={THRESHOLD_METER}
                        pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.08, weight: 1.5, dashArray: '5, 5' }}
                      />
                      {/* Marker titik calon minimarket */}
                      <CircleMarker
                        center={[results.input.latitude, results.input.longitude]}
                        radius={9}
                        pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 1, weight: 2 }}
                      >
                        <Popup>
                          <div className="text-sm">
                            <strong>{results.input?.name || 'Calon Minimarket'}</strong><br />
                            {results.input.latitude.toFixed(6)}, {results.input.longitude.toFixed(6)}<br />
                            <span style={{ color: '#10B981', fontWeight: 'bold' }}>✓ Aman / Patuh Zonasi</span>
                          </div>
                        </Popup>
                      </CircleMarker>
                    </MapContainer>
                  </div>
                )}

                {/* AI Recommendation */}
                {aiRecommendation && (
                  <div className="rounded-xl bg-green-900/10 border border-green-500/15 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-sm text-green-400">smart_toy</span>
                      <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Rekomendasi AI</span>
                    </div>
                    <p className="text-sm text-green-200/80 leading-relaxed">{aiRecommendation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Result Cards (Haversine distance summary + markets table) ── */}
        {results && nearest && (
          <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease]">
            <div className={`rounded-xl p-6 border ${isViolation ? 'bg-red-900/20 border-red-500/40' : 'bg-green-900/20 border-green-500/40'}`}>
              <h3 className="text-xl font-bold text-white mb-2">{results.input?.name}</h3>
              <p className="text-sm text-on-surface-variant">{results.result?.message}</p>
            </div>
            {/* Tabel Pasar Tradisional */}
            <div className="glass-panel rounded-xl p-6 border border-slate-700/30">
              <table className="w-full text-left">
                <thead><tr className="text-xs uppercase text-on-surface-variant"><th>Pasar</th><th>Jarak</th><th>Status</th></tr></thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {nearestMarkets.map((pasar, idx) => (
                    <tr key={idx}>
                      <td className="py-3">{pasar.pasarName}</td>
                      <td className="py-3">{Number(pasar.distanceMeters).toLocaleString()} m</td>
                      <td className="py-3">{pasar.status}</td>
                    </tr>
                  ))}
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


// import React, { useState } from 'react';
// import Header from '../../components/Header';
// import { calculateZoning } from '../../services/zoningApi';

// const THRESHOLD_METER = 500;

// const Calculator = () => {
//   const [form, setForm] = useState({
//     nama: '',
//     lat: '',
//     lng: '',
//   });

//   const [results, setResults] = useState(null);
//   const [showFormula, setShowFormula] = useState(false);
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleChange = (e) => {
//     setForm({
//       ...form,
//       [e.target.name]: e.target.value,
//     });

//     setError('');
//   };

//   const handleCalculate = async () => {
//     const lat = parseFloat(form.lat);
//     const lng = parseFloat(form.lng);

//     if (isNaN(lat) || isNaN(lng)) {
//       setError('Harap masukkan nilai Latitude dan Longitude yang valid.');
//       return;
//     }

//     if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
//       setError(
//         'Koordinat di luar rentang valid. Latitude: -90 s/d 90, Longitude: -180 s/d 180.'
//       );
//       return;
//     }

//     try {
//       setLoading(true);
//       setError('');
//       setResults(null);

//       const data = await calculateZoning({
//         name: form.nama || 'Calon Minimarket',
//         latitude: lat,
//         longitude: lng,
//         radiusMeters: THRESHOLD_METER,
//       });

//       setResults(data);
//     } catch (err) {
//       setError(err.message || 'Gagal menghitung zonasi.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleReset = () => {
//     setForm({
//       nama: '',
//       lat: '',
//       lng: '',
//     });

//     setResults(null);
//     setError('');
//   };

//   const nearest = results?.result?.nearestPasar;
//   const isViolation = results?.result?.isViolation;
//   const nearestMarkets = results?.allMarkets || results?.nearestMarkets || [];

//   return (
//     <div className="bg-background text-on-surface font-body min-h-screen antialiased">
//       <Header />

//       <main className="ml-64 p-8 flex flex-col gap-8 relative z-10">
//         {/* ── Page Header ── */}
//         <div className="flex items-end justify-between">
//           <div>
//             <div className="flex items-center gap-3 mb-1">
//               <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)]">
//                 <span className="material-symbols-outlined text-white text-lg">
//                   calculate
//                 </span>
//               </div>

//               <h1 className="font-headline text-3xl font-bold text-white tracking-tight">
//                 Distance calculator
//               </h1>
//             </div>

//             <p className="text-sm text-on-surface-variant mt-1 pl-12">
//               Implementasi{' '}
//               <span className="text-purple-400 font-semibold">
//                 Haversine Formula
//               </span>{' '}
//               untuk cek kelayakan zonasi minimarket.
//             </p>
//           </div>

//           <button
//             onClick={handleReset}
//             className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-medium border border-outline-variant/20 transition-all"
//           >
//             <span className="material-symbols-outlined text-sm">refresh</span>
//             Reset
//           </button>
//         </div>

//         {/* ── Formula Accordion ── */}
//         <div className="glass-panel rounded-xl overflow-hidden border border-purple-500/20">
//           <button
//             onClick={() => setShowFormula(!showFormula)}
//             className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/5 transition-all"
//           >
//             <div className="flex items-center gap-3">
//               <span className="material-symbols-outlined text-purple-400">
//                 functions
//               </span>
//               <span className="font-semibold text-white text-sm tracking-wide">
//                 Tentang Formula Haversine
//               </span>
//             </div>

//             <span
//               className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 ${
//                 showFormula ? 'rotate-180' : ''
//               }`}
//             >
//               expand_more
//             </span>
//           </button>

//           {showFormula && (
//             <div className="px-6 pb-5 border-t border-purple-500/10 pt-4 flex flex-col gap-3 animate-[fadeIn_0.2s_ease]">
//               <p className="text-sm text-on-surface-variant leading-relaxed">
//                 Formula Haversine menghitung{' '}
//                 <span className="text-white">jarak terpendek</span> antara dua
//                 titik di permukaan bola Bumi berdasarkan koordinat lintang dan
//                 bujur.
//               </p>

//               <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700/50 font-mono text-xs text-purple-300 leading-relaxed">
//                 <p className="text-slate-400 mb-2">
//                   // Langkah 1: Hitung selisih koordinat
//                 </p>
//                 <p>Δlat = lat₂ − lat₁ | Δlon = lon₂ − lon₁</p>

//                 <br />

//                 <p className="text-slate-400 mb-2">// Langkah 2: Formula inti</p>
//                 <p>
//                   a = sin²(Δlat/2) + cos(lat₁) × cos(lat₂) × sin²(Δlon/2)
//                 </p>

//                 <br />

//                 <p className="text-slate-400 mb-2">
//                   // Langkah 3: Jarak akhir meter
//                 </p>
//                 <p>c = 2 × atan2(√a, √1−a)</p>
//                 <p>
//                   d = R × c{' '}
//                   <span className="text-slate-500">(R = 6.371.000 m)</span>
//                 </p>
//               </div>

//               <div className="flex items-center gap-2 text-xs text-slate-500">
//                 <span className="material-symbols-outlined text-xs text-red-400">
//                   warning
//                 </span>
//                 Threshold zonasi: minimarket dilarang dalam radius &lt;
//                 <span className="text-white font-semibold mx-1">
//                   {THRESHOLD_METER} meter
//                 </span>
//                 dari pasar tradisional.
//               </div>
//             </div>
//           )}
//         </div>

//         {/* ── Input Form ── */}
//         <div className="glass-panel rounded-xl p-6 border border-slate-700/30">
//           <h2 className="font-semibold text-white mb-5 flex items-center gap-2 text-sm uppercase tracking-widest">
//             <span className="material-symbols-outlined text-sm text-red-400">
//               pin_drop
//             </span>
//             Data Calon Minimarket
//           </h2>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
//             <div className="flex flex-col gap-1.5">
//               <label className="text-xs text-on-surface-variant uppercase tracking-wider">
//                 Nama Calon Minimarket{' '}
//                 <span className="text-slate-600">(opsional)</span>
//               </label>

//               <input
//                 type="text"
//                 name="nama"
//                 value={form.nama}
//                 onChange={handleChange}
//                 placeholder="cth: Indomaret Fatmawati"
//                 className="bg-slate-900/60 border border-slate-700/60 rounded-lg px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/30 transition-all"
//               />
//             </div>

//             <div className="flex flex-col gap-1.5">
//               <label className="text-xs text-on-surface-variant uppercase tracking-wider">
//                 Latitude <span className="text-red-400">*</span>
//               </label>

//               <input
//                 type="number"
//                 name="lat"
//                 value={form.lat}
//                 onChange={handleChange}
//                 placeholder="cth: -6.2615"
//                 step="any"
//                 className="bg-slate-900/60 border border-slate-700/60 rounded-lg px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/30 transition-all"
//               />
//             </div>

//             <div className="flex flex-col gap-1.5">
//               <label className="text-xs text-on-surface-variant uppercase tracking-wider">
//                 Longitude <span className="text-red-400">*</span>
//               </label>

//               <input
//                 type="number"
//                 name="lng"
//                 value={form.lng}
//                 onChange={handleChange}
//                 placeholder="cth: 106.8120"
//                 step="any"
//                 className="bg-slate-900/60 border border-slate-700/60 rounded-lg px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/30 transition-all"
//               />
//             </div>
//           </div>

//           {error && (
//             <div className="mb-4 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
//               <span className="material-symbols-outlined text-sm">error</span>
//               {error}
//             </div>
//           )}

//           <button
//             id="btn-hitung-jarak"
//             onClick={handleCalculate}
//             disabled={loading}
//             className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm tracking-widest uppercase rounded-lg shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all duration-300 flex items-center justify-center gap-2"
//           >
//             <span className="material-symbols-outlined text-sm">route</span>
//             {loading ? 'Menghitung...' : 'Hitung Jarak & Cek Zonasi'}
//           </button>
//         </div>

//         {/* ── Result Cards ── */}
//         {results && nearest && (
//           <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease]">
//             <div
//               className={`rounded-xl p-6 border flex items-start gap-5 ${
//                 isViolation
//                   ? 'bg-red-900/20 border-red-500/40 shadow-[0_0_30px_rgba(220,38,38,0.1)]'
//                   : 'bg-green-900/20 border-green-500/40 shadow-[0_0_30px_rgba(34,197,94,0.1)]'
//               }`}
//             >
//               <div
//                 className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
//                   isViolation ? 'bg-red-500/20' : 'bg-green-500/20'
//                 }`}
//               >
//                 <span
//                   className={`material-symbols-outlined text-2xl ${
//                     isViolation ? 'text-red-400' : 'text-green-400'
//                   }`}
//                 >
//                   {isViolation ? 'gpp_bad' : 'verified'}
//                 </span>
//               </div>

//               <div className="flex-1 min-w-0">
//                 <div className="flex items-center gap-3 mb-1 flex-wrap">
//                   <h3 className="font-headline text-xl font-bold text-white">
//                     {results.input?.name || 'Calon Minimarket'}
//                   </h3>

//                   <span
//                     className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
//                       isViolation
//                         ? 'bg-red-500/20 text-red-400 border border-red-500/30'
//                         : 'bg-green-500/20 text-green-400 border border-green-500/30'
//                     }`}
//                   >
//                     {isViolation ? '⚠ Melanggar Zonasi' : '✓ Aman'}
//                   </span>
//                 </div>

//                 <p className="text-sm text-on-surface-variant mb-3">
//                   Koordinat:{' '}
//                   <span className="text-white font-mono">
//                     {results.input?.latitude}, {results.input?.longitude}
//                   </span>
//                 </p>

//                 <p className="text-sm text-on-surface-variant mb-4">
//                   {results.result?.message}
//                 </p>

//                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
//                   <div className="bg-black/20 rounded-lg px-4 py-3">
//                     <p className="text-xs text-on-surface-variant mb-0.5">
//                       Pasar Terdekat
//                     </p>
//                     <p className="text-white font-semibold text-sm truncate">
//                       {nearest.pasarName}
//                     </p>
//                   </div>

//                   <div className="bg-black/20 rounded-lg px-4 py-3">
//                     <p className="text-xs text-on-surface-variant mb-0.5">
//                       Jarak
//                     </p>
//                     <p
//                       className={`font-bold text-base ${
//                         isViolation ? 'text-red-400' : 'text-green-400'
//                       }`}
//                     >
//                       {Number(nearest.distanceMeters).toLocaleString('id-ID')} m
//                     </p>
//                   </div>

//                   <div className="bg-black/20 rounded-lg px-4 py-3">
//                     <p className="text-xs text-on-surface-variant mb-0.5">
//                       Kecamatan
//                     </p>
//                     <p className="text-white font-semibold text-sm">
//                       {nearest.district?.name || '-'}
//                     </p>
//                   </div>
//                 </div>

//                 {isViolation && (
//                   <p className="mt-3 text-xs text-red-300/80">
//                     Jarak {nearest.distanceMeters} m &lt; batas minimum{' '}
//                     {results.rule?.minimumDistanceMeters || THRESHOLD_METER} m.
//                     Lokasi ini <strong>tidak memenuhi</strong> syarat zonasi
//                     minimarket berdasarkan regulasi.
//                   </p>
//                 )}
//               </div>
//             </div>

//             <div className="glass-panel rounded-xl overflow-hidden border border-slate-700/30">
//               <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center gap-2">
//                 <span className="material-symbols-outlined text-sm text-on-surface-variant">
//                   table_view
//                 </span>

//                 <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
//                   Jarak ke Semua Pasar Tradisional
//                 </h3>
//               </div>

//               <table className="w-full text-left">
//                 <thead>
//                   <tr className="bg-surface-container-low/50 border-b border-outline-variant/20">
//                     <th className="py-3 px-6 text-xs text-on-surface-variant uppercase">
//                       #
//                     </th>
//                     <th className="py-3 px-6 text-xs text-on-surface-variant uppercase">
//                       Nama Pasar
//                     </th>
//                     <th className="py-3 px-6 text-xs text-on-surface-variant uppercase">
//                       Kecamatan
//                     </th>
//                     <th className="py-3 px-6 text-xs text-on-surface-variant uppercase text-right">
//                       Jarak
//                     </th>
//                     <th className="py-3 px-6 text-xs text-on-surface-variant uppercase text-center">
//                       Status
//                     </th>
//                   </tr>
//                 </thead>

//                 <tbody className="divide-y divide-outline-variant/10 text-sm">
//                   {nearestMarkets.map((pasar, idx) => {
//                     const aman = pasar.status === 'AMAN';

//                     return (
//                       <tr
//                         key={pasar.pasarId}
//                         className={`transition-colors hover:bg-white/5 ${
//                           idx === 0 ? 'bg-surface-container-highest/30' : ''
//                         }`}
//                       >
//                         <td className="py-3.5 px-6 text-on-surface-variant">
//                           {idx + 1}
//                         </td>

//                         <td className="py-3.5 px-6 text-white font-medium">
//                           {pasar.pasarName}

//                           {idx === 0 && (
//                             <span className="ml-2 text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
//                               Terdekat
//                             </span>
//                           )}
//                         </td>

//                         <td className="py-3.5 px-6 text-on-surface-variant">
//                           {pasar.district?.name || '-'}
//                         </td>

//                         <td className="py-3.5 px-6 text-right font-mono font-medium text-white">
//                           {Number(pasar.distanceMeters).toLocaleString('id-ID')} m
//                         </td>

//                         <td className="py-3.5 px-6 text-center">
//                           <span
//                             className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
//                               aman
//                                 ? 'bg-green-500/15 text-green-400 border border-green-500/25'
//                                 : 'bg-red-500/15 text-red-400 border border-red-500/25'
//                             }`}
//                           >
//                             {aman ? 'Aman' : 'Melanggar'}
//                           </span>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// };

// export default Calculator;