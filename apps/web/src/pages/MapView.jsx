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

// // 🔥 STATS
// const getStats = (locations = []) => {
//   let violations = 0;

//   locations.forEach(loc => {
//     if (loc.isViolation) violations++;
//   });

//   return {
//     total: locations.length,
//     violations,
//     safe: locations.length - violations
//   };
// };

// const MapView = () => {

//   const locations = useLocations() || [];
//   const { setSelectedLocation } = useMapContext();

//   // 🔥 AMBIL PARAM URL
//   const location = useLocation();
//   const query = new URLSearchParams(location.search);
//   const lat = parseFloat(query.get("lat"));
//   const lng = parseFloat(query.get("lng"));

//   const [search, setSearch] = useState("");
//   const [filter, setFilter] = useState("all");
//   const [showRadius, setShowRadius] = useState(false);
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

//   const filteredLocations = processedLocations.filter(loc =>
//     (loc?.nama || "").toLowerCase().includes(search.toLowerCase())
//   );

//   const finalLocations = filteredLocations
//     .filter(loc => {
//       if (filter === "violation") return loc.isViolation;
//       if (filter === "safe") return !loc.isViolation;
//       if (filter === "retail") return loc.type === "retail";
//       if (filter === "pasar") return loc.type === "pasar";
//       return true;
//     })
//     .slice(0, 200);

//   const stats = getStats(finalLocations);

//   return (
//     <div className="h-screen w-full">

//       {/* 🔥 SEARCH */}
//       <input
//         placeholder="Cari lokasi..."
//         onChange={(e) => setSearch(e.target.value)}
//         className="absolute top-4 right-4 z-[1000] p-2 rounded"
//       />

//       {/* 🔥 FILTER */}
//       <div className="absolute top-16 right-4 z-[1000] bg-white p-2 rounded shadow">
//         <select onChange={(e) => setFilter(e.target.value)}>
//           <option value="all">All</option>
//           <option value="violation">Violation</option>
//           <option value="safe">Safe</option>
//           <option value="retail">Retail</option>
//           <option value="pasar">Pasar</option>
//         </select>
//       </div>

//       {/* 🔥 MAP */}
//       <MapContainer
//         center={[-6.2, 106.8]}
//         zoom={13}
//         preferCanvas={true}
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
//                 item.type === "pasar"
//                   ? blueIcon
//                   : item.isViolation
//                     ? redIcon
//                     : isPredictActive && item.predicted
//                       ? orangeIcon
//                       : blueIcon
//               }
//               eventHandlers={{
//                 click: () => setSelectedLocation(item)
//               }}
//             >
//               <Popup>
//                 <b>{item.nama}</b>
//               </Popup>
//             </Marker>
//           );
//         })}
//       </MapContainer>
//     </div>
//   );
// };

// export default MapView;

import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { Icon } from 'leaflet';
import { useLocations } from "../hooks/useLocations";
import { useMap as useMapContext } from "../context/MapContext";
import { useLocation } from "react-router-dom";

// 🔥 MAP CONTROLLER (AUTO FOCUS)
const MapController = ({ lat, lng }) => {
  const map = useMap();

  useEffect(() => {
    if (!isNaN(lat) && !isNaN(lng)) {
      map.setView([lat, lng], 16);
    }
  }, [lat, lng, map]);

  return null;
};

// 🔥 FIX ICON
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// ICON
const blueIcon = new Icon({
  iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  iconSize: [25, 41],
});

const redIcon = new Icon({
  iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  iconSize: [25, 41],
});

const orangeIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/orange-dot.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// 🔥 NEW ICON (SELECTED)
const greenIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  iconSize: [25, 41],
});

// 🔥 DISTANCE
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

// 🔥 CHECK VIOLATION
const checkViolation = (current, all) => {
  if (current.type !== "retail") return false;

  return all.some((other) => {
    if (other.type !== "pasar") return false;
    return getDistance(current.lat, current.lng, other.lat, other.lng) < 500;
  });
};

// 🔥 CLUSTER
const getClusterLevel = (target, all) => {
  let count = 0;

  all.forEach(loc => {
    if (loc.id === target.id) return;
    const d = getDistance(target.lat, target.lng, loc.lat, loc.lng);
    if (d < 300) count++;
  });

  if (count > 15) return "high";
  if (count > 8) return "medium";
  return "low";
};

const MapView = () => {

  const locations = useLocations() || [];
  const { setSelectedLocation } = useMapContext();

  // 🔥 URL PARAM
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const lat = parseFloat(query.get("lat"));
  const lng = parseFloat(query.get("lng"));

  // 🔥 STATE
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [isPredictActive, setIsPredictActive] = useState(false);

  const handlePredict = () => {
    setIsPredictActive(prev => !prev);
  };

  const processedLocations = useMemo(() => {
    return locations.map(loc => {

      if (!loc.lat || !loc.lng) {
        return {
          ...loc,
          isViolation: false,
          cluster: "low",
          predicted: false
        };
      }

      const isViolation =
        loc.type === "zonasi"
          ? loc.violation
          : checkViolation(loc, locations);

      const cluster = getClusterLevel(loc, locations);

      return {
        ...loc,
        isViolation,
        cluster,
        predicted: cluster === "high" && !isViolation
      };
    });
  }, [locations]);

  const finalLocations = processedLocations;

  return (
    <div className="h-screen w-full">

      <MapContainer
        center={[-6.2, 106.8]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        {/* 🔥 AUTO FOCUS */}
        <MapController lat={lat} lng={lng} />

        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {finalLocations.map((item) => {
          if (isNaN(item.lat) || isNaN(item.lng)) return null;

          return (
            <Marker
              key={item.id}
              position={[item.lat, item.lng]}
              icon={
                item.id === selectedId
                  ? greenIcon
                  : item.type === "pasar"
                    ? blueIcon
                    : item.isViolation
                      ? redIcon
                      : isPredictActive && item.predicted
                        ? orangeIcon
                        : blueIcon
              }
              eventHandlers={{
                click: () => {
                  setSelectedLocation(item);
                  setSelectedId(item.id);
                }
              }}
            >
              <Popup>
                <b>{item.nama}</b>

                {item.id === selectedId && (
                  <>
                    <br />
                    <b style={{ color: "green" }}>SELECTED</b>
                  </>
                )}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;