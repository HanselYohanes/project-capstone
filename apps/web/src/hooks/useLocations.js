import { useEffect, useState } from "react";

// 🔧 Sesuaikan URL base dengan env kamu
const API_BASE = `${import.meta.env.VITE_API_URL ?? "http://localhost:3001"}/api/v1`;

export const useLocations = () => {
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                // 1. Ambil token untuk Authorization
                const savedUser = localStorage.getItem("user");
                const token = savedUser ? JSON.parse(savedUser)?.token : null;
                const headers = token
                    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
                    : { "Content-Type": "application/json" };

                // 2. Tembak endpoint Map Entities (sesuai Postman Hansel)
                const res = await fetch(`${API_BASE}/dashboard/map-entities`, { headers });

                if (!res.ok) throw new Error("Gagal mengambil data peta dari server");

                const json = await res.json();

                // 3. Mapping data dari Backend agar cocok dengan MapSection.jsx
                const cleanedData = json.data.map((item) => {
                    const lat = parseFloat(item.latitude);
                    const lng = parseFloat(item.longitude);

                    // Buang titik yang kordinatnya error/kosong
                    if (isNaN(lat) || isNaN(lng)) return null;

                    return {
                        id: item.id,
                        nama: item.name,          // Backend: 'name' -> Frontend: 'nama'
                        lat: lat,                 // Backend: 'latitude' -> Frontend: 'lat'
                        lng: lng,                 // Backend: 'longitude' -> Frontend: 'lng'

                        // Backend mengirim "MINIMARKET" / "PASAR". 
                        // Kita jadikan huruf kecil agar cocok dengan logika loc.type === "pasar" di MapSection
                        type: item.type ? item.type.toLowerCase() : "retail",

                        kecamatan: item.district?.name || "-",
                        violation: item.isFlagged // Mengambil status pelanggaran dari backend
                    };
                }).filter(Boolean); // Hapus array yang bernilai null

                // 4. Update state peta
                setLocations(cleanedData);

            } catch (err) {
                console.error("❌ MAP FETCH ERROR:", err);
            }
        };

        fetchLocations();
    }, []);

    return locations;
};

// import { useEffect, useState } from "react";
// import retail from "../retail.json";
// import pasar from "../pasar.json";
// import zonasi from "../zonasi.json";

// export const useLocations = () => {
//     const [locations, setLocations] = useState([]);

//     useEffect(() => {

//         const cleanData = (data, type) => {
//             return data
//                 .map((item, index) => {
//                     const lat = parseFloat(item.latitude);
//                     const lng = parseFloat(item.longitude);

//                     if (isNaN(lat) || isNaN(lng)) {
//                         console.warn("❌ DATA INVALID:", item);
//                         return null;
//                     }

//                     return {
//                         id: `${type}-${index}`,
//                         nama: item.nama_tempat,
//                         lat,
//                         lng,
//                         type,

//                         // 🔥 TAMBAH INI
//                         kecamatan: item.nama_kecamatan || "-"

//                     };
//                 })
//                 .filter(Boolean);
//         };

//         // 🔥 DATA LAMA (AMAN)
//         const retailLocations = cleanData(retail, "retail");
//         const pasarLocations = cleanData(pasar, "pasar");

//         // 🔥 DATA ZONASI (PINDAH KE SINI!)
//         const zonasiLocations = zonasi
//             .map((item, index) => {
//                 const lat = parseFloat(item.latitude);
//                 const lng = parseFloat(item.longitude);

//                 if (isNaN(lat) || isNaN(lng)) return null;

//                 return {
//                     id: `zonasi-${index}`,
//                     nama: item.nama_tempat,
//                     lat,
//                     lng,
//                     type: "zonasi",

//                     // 🔥 TAMBAH INI
//                     kecamatan: item.nama_kecamatan || "-",

//                     // 🔥 tambahan
//                     jarak: item.jarak_pasar_meter,
//                     pasarTerdekat: item.pasar_terdekat,
//                     violation: item["pelanggaran_<500m"] === "Yes",
//                 };
//             })
//             .filter(Boolean);

//         // 🔥 GABUNG SEMUA (INI KUNCI)
//         // 🔥 GABUNG SEMUA (INI KUNCI)
//         let localData = [];

//         try {
//             const raw = JSON.parse(localStorage.getItem("locations")) || [];
//             // 🔥 Tambahkan prefix 'local-' agar ID tidak bentrok dengan retail/pasar/zonasi
//             localData = raw.map((item, index) => ({
//                 ...item,
//                 id: `local-${item.id ?? index}`,
//             }));
//         } catch (e) {
//             console.error("LocalStorage error:", e);
//             localData = [];
//         }

//         const combined = [
//             ...retailLocations,
//             ...pasarLocations,
//             ...zonasiLocations,
//             ...localData,
//         ];

//         // 🔥 Deduplication: buang ID yang sama (ambil yang pertama)
//         const seen = new Set();
//         const deduped = combined.filter((loc) => {
//             if (seen.has(loc.id)) return false;
//             seen.add(loc.id);
//             return true;
//         });

//         console.log("✅ FINAL CLEAN LOCATIONS:", deduped);

//         setLocations(deduped);

//     }, []);

//     return locations;
// };