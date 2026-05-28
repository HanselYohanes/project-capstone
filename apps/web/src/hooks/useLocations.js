import { useEffect, useState } from "react";
import retail from "../retail.json";
import pasar from "../pasar.json";
import zonasi from "../zonasi.json";

export const useLocations = () => {
    const [locations, setLocations] = useState([]);

    useEffect(() => {

        const cleanData = (data, type) => {
            return data
                .map((item, index) => {
                    const lat = parseFloat(item.latitude);
                    const lng = parseFloat(item.longitude);

                    if (isNaN(lat) || isNaN(lng)) {
                        console.warn("❌ DATA INVALID:", item);
                        return null;
                    }

                    return {
                        id: `${type}-${index}`,
                        nama: item.nama_tempat,
                        lat,
                        lng,
                        type,

                        // 🔥 TAMBAH INI
                        kecamatan: item.nama_kecamatan || "-"

                    };
                })
                .filter(Boolean);
        };

        // 🔥 DATA LAMA (AMAN)
        const retailLocations = cleanData(retail, "retail");
        const pasarLocations = cleanData(pasar, "pasar");

        // 🔥 DATA ZONASI (PINDAH KE SINI!)
        const zonasiLocations = zonasi
            .map((item, index) => {
                const lat = parseFloat(item.latitude);
                const lng = parseFloat(item.longitude);

                if (isNaN(lat) || isNaN(lng)) return null;

                return {
                    id: `zonasi-${index}`,
                    nama: item.nama_tempat,
                    lat,
                    lng,
                    type: "zonasi",

                    // 🔥 TAMBAH INI
                    kecamatan: item.nama_kecamatan || "-",

                    // 🔥 tambahan
                    jarak: item.jarak_pasar_meter,
                    pasarTerdekat: item.pasar_terdekat,
                    violation: item["pelanggaran_<500m"] === "Yes",
                };
            })
            .filter(Boolean);

        // 🔥 GABUNG SEMUA (INI KUNCI)
        // 🔥 GABUNG SEMUA (INI KUNCI)
        let localData = [];

        try {
            const raw = JSON.parse(localStorage.getItem("locations")) || [];
            // 🔥 Tambahkan prefix 'local-' agar ID tidak bentrok dengan retail/pasar/zonasi
            localData = raw.map((item, index) => ({
                ...item,
                id: `local-${item.id ?? index}`,
            }));
        } catch (e) {
            console.error("LocalStorage error:", e);
            localData = [];
        }

        const combined = [
            ...retailLocations,
            ...pasarLocations,
            ...zonasiLocations,
            ...localData,
        ];

        // 🔥 Deduplication: buang ID yang sama (ambil yang pertama)
        const seen = new Set();
        const deduped = combined.filter((loc) => {
            if (seen.has(loc.id)) return false;
            seen.add(loc.id);
            return true;
        });

        console.log("✅ FINAL CLEAN LOCATIONS:", deduped);

        setLocations(deduped);

    }, []);

    return locations;
};