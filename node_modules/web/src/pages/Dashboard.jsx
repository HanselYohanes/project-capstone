import React from 'react';
import Header from '../components/Header';
import KPIGrid from '../components/KPIGrid';
import MapSection from '../components/MapSection';
import TopDistrictsChart from '../components/TopDistrictsChart';
import ViolationsTable from '../components/ViolationsTable';

// 🔥 TAMBAHAN
import { useStats } from "../hooks/useStats";
import { useMap } from "../context/MapContext"; // 🔥 TAMBAHAN BARU

const Dashboard = () => {

  // 🔥 DATA STATS
  const stats = useStats();

  // 🔥 AMBIL DATA DARI MAP (INI YANG BIKIN SYNC)
  const { selectedLocation } = useMap();

  return (
    <div className="bg-surface-dim text-on-surface font-body antialiased selection:bg-primary-container/30 selection:text-primary-fixed min-h-screen">
      <Header />
      <main className="ml-64 p-8 min-h-screen">

        {/* 🔥 SELECTED LOCATION (TIDAK MERUSAK UI LAMA) */}
        {selectedLocation && (
          <div className="bg-surface-container p-4 rounded-lg mb-6 border border-primary/20">
            <h2 className="font-bold text-lg mb-1">Selected Location</h2>
            <p className="font-medium">{selectedLocation.nama_tempat}</p>
            <p className="text-sm">{selectedLocation.alamat_tempat}</p>
            <p className="text-xs mt-1 opacity-70">{selectedLocation.store}</p>
          </div>
        )}

        {/* 🔥 STATS MINI */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-surface-container p-4 rounded-lg">
            <h2 className="text-sm text-on-surface-variant">Total Minimarket</h2>
            <h1 className="text-2xl font-bold">{stats.total}</h1>
          </div>

          <div className="bg-surface-container p-4 rounded-lg">
            <h2 className="text-sm text-on-surface-variant">Violations</h2>
            <h1 className="text-2xl font-bold text-red-500">{stats.violations}</h1>
          </div>

          <div className="bg-surface-container p-4 rounded-lg">
            <h2 className="text-sm text-on-surface-variant">Safe</h2>
            <h1 className="text-2xl font-bold text-green-500">{stats.safe}</h1>
          </div>
        </div>

        {/* 🔥 KODE LAMA (TIDAK DIUBAH) */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">Overview</h1>
            <p className="text-on-surface-variant text-sm mt-1">Real-time geospatial zoning analysis.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-lg outline outline-1 outline-outline-variant/20">
            <span className="material-symbols-outlined text-xs text-success">sync</span>
            Live Sync Active
          </div>
        </div>

        <KPIGrid />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          <MapSection />
          <TopDistrictsChart />
        </div>

        <ViolationsTable />
      </main>
    </div>
  );
};

export default Dashboard;