import React, { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Popup,
  CircleMarker,
  Circle,
  ZoomControl, // 🔥 Import ZoomControl
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import * as turf from "@turf/turf";
import { useLocations } from "../hooks/useLocations";

// 🔥 KOMPONEN KETERANGAN (LEGEND)
const MapLegend = () => {
  return (
    <div className="absolute top-4 right-4 z-[1000] bg-surface-container-highest/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-outline-variant/20 text-on-surface">
      <h3 className="font-bold text-sm mb-3 font-headline border-b border-outline-variant/20 pb-2">
        Keterangan Peta
      </h3>
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 rounded-full bg-[#3B82F6] shadow-sm"></span>
          <span>Retail / Indomaret Aman</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 rounded-full bg-[#F59E0B] shadow-sm"></span>
          <span>Alfamart Aman</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 rounded-full bg-[#EF4444] shadow-sm"></span>
          <span>Melanggar (Zona 500m)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 rounded-full bg-[#10B981] shadow-sm"></span>
          <span>Pasar Tradisional</span>
        </div>
        <div className="flex items-center gap-3 mt-1 pt-2 border-t border-outline-variant/20">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-[#10B981] border-dashed bg-[#10B981]/20"></div>
          <span className="text-xs text-on-surface-variant italic">Radius Pasar 500m</span>
        </div>
      </div>
    </div>
  );
};

// 🔥 SEARCH HANDLER
const MapSearchHandler = ({ searchQuery, locations }) => {
  const map = useMap();

  useEffect(() => {
    if (!searchQuery || locations.length === 0) return;

    const found = locations.find(
      (loc) =>
        loc.nama?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !isNaN(Number(loc.lat)) &&
        !isNaN(Number(loc.lng))
    );

    if (found) {
      map.setView([Number(found.lat), Number(found.lng)], 15, {
        animate: true,
      });
    }
  }, [searchQuery, locations, map]);

  return null;
};

// 🔥 HELPER FUNCTIONS UNTUK HITUNG JARAK & OVERLAP
const createCircle = (lat, lng) => {
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (isNaN(latNum) || isNaN(lngNum)) return null;
  return turf.circle([lngNum, latNum], 0.5, { units: "kilometers", steps: 64 });
};

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const checkOverlap = (loc1, loc2) => {
  if (
    isNaN(Number(loc1.lat)) ||
    isNaN(Number(loc1.lng)) ||
    isNaN(Number(loc2.lat)) ||
    isNaN(Number(loc2.lng))
  ) return false;
  
  return getDistance(Number(loc1.lat), Number(loc1.lng), Number(loc2.lat), Number(loc2.lng)) < 500;
};

// 🔥 OPTIMASI RENDERING & ZONING SMART HIGHLIGHT
const LazyLoadFeatures = ({ locations }) => {
  const map = useMap();
  const [bounds, setBounds] = useState(() => map.getBounds());

  useMapEvents({
    moveend() { setBounds(map.getBounds()); },
    zoomend() { setBounds(map.getBounds()); },
  });

  const visibleLocations = useMemo(() => {
    if (!bounds) return [];
    const extendedBounds = bounds.pad(0.2);
    return locations.filter((loc) => {
      const latLng = L.latLng(Number(loc.lat), Number(loc.lng));
      return extendedBounds.contains(latLng);
    });
  }, [locations, bounds]);

  return (
    <>
      {visibleLocations.map((loc) => {
        const isOverlapping = visibleLocations.some((other) => {
          if (other.id === loc.id) return false;
          
          // 🔥 KODE YANG SUDAH DIPERBAIKI ADA DI SINI
          if (loc.type !== "pasar" && other.type === "pasar") {
            return checkOverlap(loc, other);
          }
          return false;
        });

        // Logika Warna
        let dotColor = "#3B82F6"; // Biru
        if (isOverlapping && loc.type !== "pasar") dotColor = "#EF4444"; // Merah (Kena Pelanggaran)
        else if (loc.type === "pasar") dotColor = "#10B981"; // Hijau
        else if (loc.nama?.toLowerCase().includes("alfamart")) dotColor = "#F59E0B"; // Orange

        return (
          <React.Fragment key={`fullmap-loc-${loc.id || Math.random()}`}>
            {/* TITIK KECIL */}
            <CircleMarker
              center={[Number(loc.lat), Number(loc.lng)]}
              radius={5}
              pathOptions={{
                color: dotColor,
                fillColor: dotColor,
                fillOpacity: 1,
                weight: 1,
              }}
            >
              <Popup>
                <strong>{loc.nama}</strong>
                <br />
                Tipe: {loc.type === "pasar" ? "Pasar Tradisional" : "Minimarket"}
                <br />
                Status: {isOverlapping && loc.type !== "pasar" ? "Violation ❌" : "Safe ✅"}
              </Popup>
            </CircleMarker>

            {/* RADIUS 500M KHUSUS PASAR */}
            {loc.type === "pasar" && (
              <Circle
                center={[Number(loc.lat), Number(loc.lng)]}
                radius={500}
                pathOptions={{
                  color: "#10B981",
                  fillColor: "#10B981",
                  fillOpacity: 0.08,
                  weight: 1,
                  dashArray: "5, 5"
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

// 🔥 MAIN COMPONENT FULL PAGE MAP
const MapView = ({ searchQuery }) => {
  const rawLocations = useLocations();

  const locations = useMemo(() => {
    return rawLocations.filter(
      (loc) => loc && !isNaN(Number(loc.lat)) && !isNaN(Number(loc.lng))
    );
  }, [rawLocations]);

  return (
    <div className="flex flex-col w-full h-[calc(100vh-80px)] md:h-screen relative bg-surface-container-lowest">
      
      {/* HEADER KECIL KIRI ATAS */}
      <div className="absolute top-4 left-4 z-[1000] bg-surface-container-highest/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-outline-variant/20 pointer-events-none">
        <h1 className="text-xl font-bold font-headline text-on-surface">Peta Zonasi Zonify</h1>
        <p className="text-sm text-on-surface-variant">Menampilkan {locations.length} titik lokasi</p>
      </div>

      {/* RENDER KETERANGAN (LEGEND) KANAN ATAS */}
      <MapLegend />

      <MapContainer
        center={[-6.25, 106.8]}
        zoom={13}
        minZoom={11}
        className="w-full h-full z-0"
        zoomControl={false} // 🔥 Matikan zoom Leaflet yang menabrak header
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* 🔥 Pindahkan tombol Zoom ke kiri bawah agar aman */}
        <ZoomControl position="bottomleft" />
        
        <MapSearchHandler searchQuery={searchQuery} locations={locations} />
        <LazyLoadFeatures locations={locations} />
      </MapContainer>
    </div>
  );
};

export default MapView;

// import React, { useEffect, useMemo, useState } from "react";
// import {
//   MapContainer,
//   TileLayer,
//   Popup,
//   CircleMarker,
//   Circle,
//   useMap,
//   useMapEvents,
// } from "react-leaflet";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";
// import * as turf from "@turf/turf";
// import { useLocations } from "../hooks/useLocations";

// // 🔥 KOMPONEN KETERANGAN (LEGEND) BARU
// const MapLegend = () => {
//   return (
//     <div className="absolute top-4 right-4 z-[1000] bg-surface-container-highest/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-outline-variant/20 text-on-surface">
//       <h3 className="font-bold text-sm mb-3 font-headline border-b border-outline-variant/20 pb-2">
//         Keterangan Peta
//       </h3>
//       <div className="flex flex-col gap-3 text-sm">
//         <div className="flex items-center gap-3">
//           <span className="w-3.5 h-3.5 rounded-full bg-[#3B82F6] shadow-sm"></span>
//           <span>Retail / Indomaret Aman</span>
//         </div>
//         <div className="flex items-center gap-3">
//           <span className="w-3.5 h-3.5 rounded-full bg-[#F59E0B] shadow-sm"></span>
//           <span>Alfamart Aman</span>
//         </div>
//         <div className="flex items-center gap-3">
//           <span className="w-3.5 h-3.5 rounded-full bg-[#EF4444] shadow-sm"></span>
//           <span>Melanggar (Zona 500m)</span>
//         </div>
//         <div className="flex items-center gap-3">
//           <span className="w-3.5 h-3.5 rounded-full bg-[#10B981] shadow-sm"></span>
//           <span>Pasar Tradisional</span>
//         </div>
        
//         {/* Keterangan tambahan untuk radius batas wilayah */}
//         <div className="flex items-center gap-3 mt-1 pt-2 border-t border-outline-variant/20">
//           <div className="w-3.5 h-3.5 rounded-full border-2 border-[#10B981] border-dashed bg-[#10B981]/20"></div>
//           <span className="text-xs text-on-surface-variant italic">Radius Pasar 500m</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// // 🔥 SEARCH HANDLER
// const MapSearchHandler = ({ searchQuery, locations }) => {
//   const map = useMap();

//   useEffect(() => {
//     if (!searchQuery || locations.length === 0) return;

//     const found = locations.find(
//       (loc) =>
//         loc.nama?.toLowerCase().includes(searchQuery.toLowerCase()) &&
//         !isNaN(Number(loc.lat)) &&
//         !isNaN(Number(loc.lng))
//     );

//     if (found) {
//       map.setView([Number(found.lat), Number(found.lng)], 15, {
//         animate: true,
//       });
//     }
//   }, [searchQuery, locations, map]);

//   return null;
// };

// // 🔥 HELPER FUNCTIONS UNTUK HITUNG JARAK & OVERLAP
// const createCircle = (lat, lng) => {
//   const latNum = Number(lat);
//   const lngNum = Number(lng);
//   if (isNaN(latNum) || isNaN(lngNum)) return null;
//   return turf.circle([lngNum, latNum], 0.5, { units: "kilometers", steps: 64 });
// };

// const getDistance = (lat1, lon1, lat2, lon2) => {
//   const R = 6371000;
//   const toRad = (x) => (x * Math.PI) / 180;
//   const dLat = toRad(lat2 - lat1);
//   const dLon = toRad(lon2 - lon1);
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(toRad(lat1)) *
//     Math.cos(toRad(lat2)) *
//     Math.sin(dLon / 2) ** 2;
//   return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// };

// const checkOverlap = (loc1, loc2) => {
//   if (
//     isNaN(Number(loc1.lat)) ||
//     isNaN(Number(loc1.lng)) ||
//     isNaN(Number(loc2.lat)) ||
//     isNaN(Number(loc2.lng))
//   ) return false;
  
//   return getDistance(Number(loc1.lat), Number(loc1.lng), Number(loc2.lat), Number(loc2.lng)) < 500;
// };

// // 🔥 OPTIMASI RENDERING & ZONING SMART HIGHLIGHT
// const LazyLoadFeatures = ({ locations }) => {
//   const map = useMap();
//   const [bounds, setBounds] = useState(() => map.getBounds());

//   useMapEvents({
//     moveend() { setBounds(map.getBounds()); },
//     zoomend() { setBounds(map.getBounds()); },
//   });

//   const visibleLocations = useMemo(() => {
//     if (!bounds) return [];
//     const extendedBounds = bounds.pad(0.2);
//     return locations.filter((loc) => {
//       const latLng = L.latLng(Number(loc.lat), Number(loc.lng));
//       return extendedBounds.contains(latLng);
//     });
//   }, [locations, bounds]);

//   return (
//     <>
//       {visibleLocations.map((loc) => {
//         const isOverlapping = visibleLocations.some((other) => {
//           if (other.id === loc.id) return false;
//           if (loc.type === "retail" && other.type === "pasar") {
//             return checkOverlap(loc, other);
//           }
//           return false;
//         });

//         // Logika Warna (Disamakan dengan Legend)
//         let dotColor = "#3B82F6"; // Biru
//         if (isOverlapping && loc.type !== "pasar") dotColor = "#EF4444"; // Merah
//         else if (loc.type === "pasar") dotColor = "#10B981"; // Hijau
//         else if (loc.nama?.toLowerCase().includes("alfamart")) dotColor = "#F59E0B"; // Orange

//         return (
//           <React.Fragment key={`fullmap-loc-${loc.id || Math.random()}`}>
//             {/* TITIK KECIL */}
//             <CircleMarker
//               center={[Number(loc.lat), Number(loc.lng)]}
//               radius={5}
//               pathOptions={{
//                 color: dotColor,
//                 fillColor: dotColor,
//                 fillOpacity: 1,
//                 weight: 1,
//               }}
//             >
//               <Popup>
//                 <strong>{loc.nama}</strong>
//                 <br />
//                 Tipe: {loc.type === "pasar" ? "Pasar Tradisional" : "Minimarket"}
//                 <br />
//                 Status: {isOverlapping && loc.type !== "pasar" ? "Violation ❌" : "Safe ✅"}
//               </Popup>
//             </CircleMarker>

//             {/* RADIUS 500M KHUSUS PASAR */}
//             {loc.type === "pasar" && (
//               <Circle
//                 center={[Number(loc.lat), Number(loc.lng)]}
//                 radius={500}
//                 pathOptions={{
//                   color: "#10B981",
//                   fillColor: "#10B981",
//                   fillOpacity: 0.08, // Opacity sangat tipis sesuai request
//                   weight: 1,
//                   dashArray: "5, 5"
//                 }}
//               />
//             )}
//           </React.Fragment>
//         );
//       })}
//     </>
//   );
// };

// // 🔥 MAIN COMPONENT FULL PAGE MAP
// const MapView = ({ searchQuery }) => {
//   const rawLocations = useLocations();

//   const locations = useMemo(() => {
//     return rawLocations.filter(
//       (loc) => loc && !isNaN(Number(loc.lat)) && !isNaN(Number(loc.lng))
//     );
//   }, [rawLocations]);

//   return (
//     <div className="flex flex-col w-full h-[calc(100vh-80px)] md:h-screen relative bg-surface-container-lowest">
      
//       {/* HEADER KECIL KIRI ATAS */}
//       <div className="absolute top-4 left-4 z-[1000] bg-surface-container-highest/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-outline-variant/20 pointer-events-none">
//         <h1 className="text-xl font-bold font-headline text-on-surface">Peta Zonasi Zonify</h1>
//         <p className="text-sm text-on-surface-variant">Menampilkan {locations.length} titik lokasi</p>
//       </div>

//       {/* RENDER KETERANGAN (LEGEND) KANAN ATAS */}
//       <MapLegend />

//       <MapContainer
//         center={[-6.25, 106.8]}
//         zoom={13}
//         minZoom={11}
//         className="w-full h-full z-0"
//       >
//         <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//         <MapSearchHandler searchQuery={searchQuery} locations={locations} />
//         <LazyLoadFeatures locations={locations} />
//       </MapContainer>
//     </div>
//   );
// };

// export default MapView;

// import React, { useEffect, useMemo, useState } from "react";
// import {
//   MapContainer,
//   TileLayer,
//   Popup,
//   CircleMarker,
//   Circle,
//   useMap,
//   useMapEvents,
// } from "react-leaflet";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";
// import * as turf from "@turf/turf";
// import { useLocations } from "../hooks/useLocations";

// // 🔥 SEARCH HANDLER
// const MapSearchHandler = ({ searchQuery, locations }) => {
//   const map = useMap();

//   useEffect(() => {
//     if (!searchQuery || locations.length === 0) return;

//     const found = locations.find(
//       (loc) =>
//         loc.nama?.toLowerCase().includes(searchQuery.toLowerCase()) &&
//         !isNaN(Number(loc.lat)) &&
//         !isNaN(Number(loc.lng))
//     );

//     if (found) {
//       map.setView([Number(found.lat), Number(found.lng)], 15, {
//         animate: true,
//       });
//     }
//   }, [searchQuery, locations, map]);

//   return null;
// };

// // 🔥 HELPER FUNCTIONS UNTUK HITUNG JARAK & OVERLAP
// const createCircle = (lat, lng) => {
//   const latNum = Number(lat);
//   const lngNum = Number(lng);
//   if (isNaN(latNum) || isNaN(lngNum)) return null;
//   return turf.circle([lngNum, latNum], 0.5, { units: "kilometers", steps: 64 });
// };

// const getDistance = (lat1, lon1, lat2, lon2) => {
//   const R = 6371000;
//   const toRad = (x) => (x * Math.PI) / 180;
//   const dLat = toRad(lat2 - lat1);
//   const dLon = toRad(lon2 - lon1);
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(toRad(lat1)) *
//     Math.cos(toRad(lat2)) *
//     Math.sin(dLon / 2) ** 2;
//   return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// };

// const checkOverlap = (loc1, loc2) => {
//   if (
//     isNaN(Number(loc1.lat)) ||
//     isNaN(Number(loc1.lng)) ||
//     isNaN(Number(loc2.lat)) ||
//     isNaN(Number(loc2.lng))
//   ) return false;
  
//   return getDistance(Number(loc1.lat), Number(loc1.lng), Number(loc2.lat), Number(loc2.lng)) < 500;
// };

// // 🔥 OPTIMASI RENDERING & ZONING SMART HIGHLIGHT (SAMA SEPERTI DASHBOARD)
// const LazyLoadFeatures = ({ locations }) => {
//   const map = useMap();
//   const [bounds, setBounds] = useState(() => map.getBounds());

//   useMapEvents({
//     moveend() { setBounds(map.getBounds()); },
//     zoomend() { setBounds(map.getBounds()); },
//   });

//   const visibleLocations = useMemo(() => {
//     if (!bounds) return [];
//     const extendedBounds = bounds.pad(0.2);
//     return locations.filter((loc) => {
//       const latLng = L.latLng(Number(loc.lat), Number(loc.lng));
//       return extendedBounds.contains(latLng);
//     });
//   }, [locations, bounds]);

//   return (
//     <>
//       {visibleLocations.map((loc) => {
//         const isOverlapping = visibleLocations.some((other) => {
//           if (other.id === loc.id) return false;
//           if (loc.type === "retail" && other.type === "pasar") {
//             return checkOverlap(loc, other);
//           }
//           return false;
//         });

//         // Logika Warna
//         let dotColor = "#3B82F6"; // Biru
//         if (isOverlapping && loc.type !== "pasar") dotColor = "#EF4444"; // Merah
//         else if (loc.type === "pasar") dotColor = "#10B981"; // Hijau
//         else if (loc.nama?.toLowerCase().includes("alfamart")) dotColor = "#F59E0B"; // Orange

//         return (
//           <React.Fragment key={`fullmap-loc-${loc.id || Math.random()}`}>
//             {/* TITIK KECIL */}
//             <CircleMarker
//               center={[Number(loc.lat), Number(loc.lng)]}
//               radius={5}
//               pathOptions={{
//                 color: dotColor,
//                 fillColor: dotColor,
//                 fillOpacity: 1,
//                 weight: 1,
//               }}
//             >
//               <Popup>
//                 <strong>{loc.nama}</strong>
//                 <br />
//                 Tipe: {loc.type === "pasar" ? "Pasar Tradisional" : "Minimarket"}
//                 <br />
//                 Status: {isOverlapping && loc.type !== "pasar" ? "Violation ❌" : "Safe ✅"}
//               </Popup>
//             </CircleMarker>

//             {/* RADIUS 500M KHUSUS PASAR */}
//             {loc.type === "pasar" && (
//               <Circle
//                 center={[Number(loc.lat), Number(loc.lng)]}
//                 radius={500}
//                 pathOptions={{
//                   color: "#10B981",
//                   fillColor: "#10B981",
//                   fillOpacity: 0.08,
//                   weight: 1,
//                   dashArray: "5, 5"
//                 }}
//               />
//             )}
//           </React.Fragment>
//         );
//       })}
//     </>
//   );
// };

// // 🔥 MAIN COMPONENT FULL PAGE MAP
// const MapView = ({ searchQuery }) => {
//   const rawLocations = useLocations();

//   const locations = useMemo(() => {
//     return rawLocations.filter(
//       (loc) => loc && !isNaN(Number(loc.lat)) && !isNaN(Number(loc.lng))
//     );
//   }, [rawLocations]);

//   return (
//     // Wrapper diset supaya memenuhi layar (h-screen) dikurangi tinggi header/sidebar jika ada
//     <div className="flex flex-col w-full h-[calc(100vh-80px)] md:h-screen relative bg-surface-container-lowest">
      
//       {/* HEADER KECIL (Opsional, kalau sebelumnya ngga ada, bagian ini bisa dihapus) */}
//       <div className="absolute top-4 left-4 z-[400] bg-surface-container-highest/90 backdrop-blur p-4 rounded-xl shadow-lg border border-outline-variant/20">
//         <h1 className="text-xl font-bold font-headline">Peta Zonasi Interaktif</h1>
//         <p className="text-sm text-on-surface-variant">Memuat {locations.length} titik lokasi</p>
//       </div>

//       <MapContainer
//         center={[-6.25, 106.8]}
//         zoom={13}
//         minZoom={11}
//         className="w-full h-full z-0"
//       >
//         <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//         <MapSearchHandler searchQuery={searchQuery} locations={locations} />
//         <LazyLoadFeatures locations={locations} />
//       </MapContainer>
//     </div>
//   );
// };

// export default MapView;

// ini kode lama
// import React, { useState, useMemo, useEffect } from 'react';
// import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import L, { Icon } from 'leaflet';
// import { useLocations } from "../hooks/useLocations";
// import { useMap as useMapContext } from "../context/MapContext";
// import { useLocation } from "react-router-dom";

// // 🔥 MAP CONTROLLER (AUTO FOCUS)
// const MapController = ({ lat, lng }) => {
//   const map = useMap();

//   useEffect(() => {
//     if (!isNaN(lat) && !isNaN(lng)) {
//       map.setView([lat, lng], 16);
//     }
//   }, [lat, lng, map]);

//   return null;
// };

// // 🔥 FIX ICON
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
//   iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
//   shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
// });

// // ICON
// const blueIcon = new Icon({
//   iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
//   iconSize: [25, 41],
// });

// const redIcon = new Icon({
//   iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
//   iconSize: [25, 41],
// });

// const orangeIcon = new L.Icon({
//   iconUrl: "https://maps.google.com/mapfiles/ms/icons/orange-dot.png",
//   iconSize: [25, 41],
//   iconAnchor: [12, 41]
// });

// // 🔥 NEW ICON (SELECTED)
// const greenIcon = new L.Icon({
//   iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
//   iconSize: [25, 41],
// });

// // 🔥 DISTANCE
// const getDistance = (lat1, lon1, lat2, lon2) => {
//   const R = 6371e3;
//   const toRad = (x) => (x * Math.PI) / 180;

//   const dLat = toRad(lat2 - lat1);
//   const dLon = toRad(lon2 - lon1);

//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(toRad(lat1)) *
//     Math.cos(toRad(lat2)) *
//     Math.sin(dLon / 2) ** 2;

//   return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
// };

// // 🔥 CHECK VIOLATION
// const checkViolation = (current, all) => {
//   if (current.type !== "retail") return false;

//   return all.some((other) => {
//     if (other.type !== "pasar") return false;
//     return getDistance(current.lat, current.lng, other.lat, other.lng) < 500;
//   });
// };

// // 🔥 CLUSTER
// const getClusterLevel = (target, all) => {
//   let count = 0;

//   all.forEach(loc => {
//     if (loc.id === target.id) return;
//     const d = getDistance(target.lat, target.lng, loc.lat, loc.lng);
//     if (d < 300) count++;
//   });

//   if (count > 15) return "high";
//   if (count > 8) return "medium";
//   return "low";
// };

// const MapView = () => {

//   const locations = useLocations() || [];
//   const { setSelectedLocation } = useMapContext();

//   // 🔥 URL PARAM
//   const location = useLocation();
//   const query = new URLSearchParams(location.search);
//   const lat = parseFloat(query.get("lat"));
//   const lng = parseFloat(query.get("lng"));

//   // 🔥 STATE
//   const [selectedId, setSelectedId] = useState(null);
//   const [search, setSearch] = useState("");
//   const [filter, setFilter] = useState("all");
//   const [isPredictActive, setIsPredictActive] = useState(false);

//   const handlePredict = () => {
//     setIsPredictActive(prev => !prev);
//   };

//   const processedLocations = useMemo(() => {
//     return locations.map(loc => {

//       if (!loc.lat || !loc.lng) {
//         return {
//           ...loc,
//           isViolation: false,
//           cluster: "low",
//           predicted: false
//         };
//       }

//       const isViolation =
//         loc.type === "zonasi"
//           ? loc.violation
//           : checkViolation(loc, locations);

//       const cluster = getClusterLevel(loc, locations);

//       return {
//         ...loc,
//         isViolation,
//         cluster,
//         predicted: cluster === "high" && !isViolation
//       };
//     });
//   }, [locations]);

//   const finalLocations = processedLocations;

//   return (
//     <div className="h-screen w-full">

//       <MapContainer
//         center={[-6.2, 106.8]}
//         zoom={13}
//         style={{ height: "100%", width: "100%" }}
//       >
//         {/* 🔥 AUTO FOCUS */}
//         <MapController lat={lat} lng={lng} />

//         <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

//         {finalLocations.map((item) => {
//           if (isNaN(item.lat) || isNaN(item.lng)) return null;

//           return (
//             <Marker
//               key={item.id}
//               position={[item.lat, item.lng]}
//               icon={
//                 item.id === selectedId
//                   ? greenIcon
//                   : item.type === "pasar"
//                     ? blueIcon
//                     : item.isViolation
//                       ? redIcon
//                       : isPredictActive && item.predicted
//                         ? orangeIcon
//                         : blueIcon
//               }
//               eventHandlers={{
//                 click: () => {
//                   setSelectedLocation(item);
//                   setSelectedId(item.id);
//                 }
//               }}
//             >
//               <Popup>
//                 <b>{item.nama}</b>

//                 {item.id === selectedId && (
//                   <>
//                     <br />
//                     <b style={{ color: "green" }}>SELECTED</b>
//                   </>
//                 )}
//               </Popup>
//             </Marker>
//           );
//         })}
//       </MapContainer>
//     </div>
//   );
// };

// export default MapView;