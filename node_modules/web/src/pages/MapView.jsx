import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { Icon } from 'leaflet';
import { useLocations } from "../hooks/useLocations";

// 🔥 TAMBAHAN CONTEXT
import { useMap } from "../context/MapContext";

// 🔥 TAMBAHAN HEATMAP
// import HeatmapLayer from 'react-leaflet-heatmap-layer';

// 🔥 IMPORT DATA
import alfamart from '../alfamart.json';
import indomaret from '../indomaret.json';

// 🔥 FIX ICON LEAFLET
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// 🔵 NORMAL
const blueIcon = new Icon({
  iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  iconSize: [25, 41],
});

// 🔴 VIOLATION
const redIcon = new Icon({
  iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  iconSize: [25, 41],
});

// 📏 HITUNG JARAK
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const toRad = (x) => (x * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// 🚨 CEK PELANGGARAN
const checkViolation = (current, all) => {
  const lat1 = current.latitude || current.Latitude;
  const lng1 = current.longitude || current.Longitude;

  if (!lat1 || !lng1) return false;

  return all.some((other) => {
    if (current === other) return false;

    const lat2 = other.latitude || other.Latitude;
    const lng2 = other.longitude || other.Longitude;

    if (!lat2 || !lng2) return false;

    const distance = getDistance(lat1, lng1, lat2, lng2);
    return distance < 500;
  });
};

// 📊 STATS
const getStats = (locations) => {
  let violations = 0;

  locations.forEach(loc => {
    if (checkViolation(loc, locations)) {
      violations++;
    }
  });

  return {
    total: locations.length,
    violations,
    safe: locations.length - violations
  };
};

const MapView = () => {
  const locations = useLocations();
  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState("all");
  const [showRadius, setShowRadius] = useState(true);

  const { setSelectedLocation } = useMap();

  const stats = getStats(locations);

  const filteredLocations = locations.filter(loc =>
    loc.nama_tempat?.toLowerCase().includes(search.toLowerCase())
  );

  const finalLocations = filteredLocations.filter(loc => {
    if (filter === "violation") return checkViolation(loc, locations);
    if (filter === "safe") return !checkViolation(loc, locations);
    if (filter === "alfamart") return loc.type === "Alfamart";
    if (filter === "indomaret") return loc.type === "Indomaret";
    return true;
  });

  // 🔥 HEATMAP DATA (AMAN)
  const heatmapData = finalLocations
    .map(loc => ({
      lat: loc.latitude || loc.Latitude,
      lng: loc.longitude || loc.Longitude,
      intensity: 1
    }))
    .filter(p => p.lat && p.lng);

  return (
    <div className="h-screen w-full">

      {/* SEARCH */}
      <input
        placeholder="Cari lokasi..."
        onChange={(e) => setSearch(e.target.value)}
        className="absolute top-4 right-4 z-[1000] p-2 rounded"
      />

      {/* FILTER */}
      <div className="absolute top-16 right-4 z-[1000] bg-white p-2 rounded shadow">
        <select onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="violation">Violation</option>
          <option value="safe">Safe</option>
          <option value="alfamart">Alfamart</option>
          <option value="indomaret">Indomaret</option>
        </select>
      </div>

      {/* TOGGLE RADIUS */}
      <div className="absolute top-28 right-4 z-[1000] bg-white p-2 rounded shadow">
        <button
          onClick={() => setShowRadius(prev => !prev)}
          className="text-sm px-3 py-1 bg-purple-600 text-white rounded"
        >
          {showRadius ? "Hide Radius" : "Show Radius"}
        </button>
      </div>

      {/* STATS */}
      <div className="absolute top-4 left-4 z-[1000] bg-black text-white p-3 rounded">
        <div>Total: {stats.total}</div>
        <div>Violation: {stats.violations}</div>
        <div>Safe: {stats.safe}</div>
      </div>

      {/* BUTTON */}
      <button className="absolute bottom-4 left-4 z-[1000] bg-purple-600 text-white p-2 rounded">
        NEW AUDIT
      </button>

      <MapContainer
        center={[-6.2, 106.8]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* 🔥 HEATMAP (WAJIB DI ATAS MARKER) */}
        {/* <HeatmapLayer
          points={heatmapData}
          longitudeExtractor={m => m.lng}
          latitudeExtractor={m => m.lat}
          intensityExtractor={m => m.intensity}
        /> */}

        {/* MARKER */}
        {finalLocations.map((item, index) => {

          const lat = item.latitude || item.Latitude;
          const lng = item.longitude || item.Longitude;

          if (!lat || !lng) return null;

          const isViolation = checkViolation(item, locations);

          return (
            <React.Fragment key={index}>
              <Marker
                position={[lat, lng]}
                icon={isViolation ? redIcon : blueIcon}
                eventHandlers={{
                  click: () => {
                    setSelectedLocation(item);
                  }
                }}
              >
                <Popup>
                  <b>{item.nama_tempat}</b><br />
                  {item.alamat_tempat}
                  <br />
                  <small>{item.store}</small>
                  <br />
                  <b style={{ color: isViolation ? 'red' : 'green' }}>
                    {isViolation ? 'VIOLATION (<500m)' : 'SAFE'}
                  </b>
                </Popup>
              </Marker>

              {showRadius && (
                <Circle
                  center={[lat, lng]}
                  radius={500}
                  pathOptions={{ color: 'red', fillOpacity: 0.05 }}
                />
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;