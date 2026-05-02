// import React, { useMemo, useState, useEffect } from "react";
// import { useLocations } from "../hooks/useLocations";
// import { useNavigate } from "react-router-dom";

// // 🔥 logic dari MapView
// const getDistance = (lat1, lon1, lat2, lon2) => {
//     const R = 6371e3;
//     const toRad = (x) => (x * Math.PI) / 180;

//     const dLat = toRad(lat2 - lat1);
//     const dLon = toRad(lon2 - lon1);

//     const a =
//         Math.sin(dLat / 2) ** 2 +
//         Math.cos(toRad(lat1)) *
//         Math.cos(toRad(lat2)) *
//         Math.sin(dLon / 2) ** 2;

//     return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
// };

// const checkViolation = (current, all) => {
//     if (current.type !== "retail") return false;

//     return all.some((other) => {
//         if (other.type !== "pasar") return false;
//         return (
//             getDistance(current.lat, current.lng, other.lat, other.lng) < 500
//         );
//     });
// };

// const ViolationsPage = () => {
//     const navigate = useNavigate(); // ✅ BENAR DI SINI

//     const rawLocations = useLocations() || [];
//     const [locations, setLocations] = useState([]);

//     const [deletedItem, setDeletedItem] = useState(null);

//     useEffect(() => {
//         try {
//             const saved = localStorage.getItem("locations");
//             if (saved) setLocations(JSON.parse(saved));
//         } catch (e) {
//             console.error("LocalStorage error:", e);
//         }
//     }, []);

//     useEffect(() => {
//         if (rawLocations.length > 0) {
//             setLocations(prev => (prev.length === 0 ? rawLocations : prev));
//         }
//     }, [rawLocations]);

//     useEffect(() => {
//         if (locations.length > 0) {
//             localStorage.setItem("locations", JSON.stringify(locations));
//         }
//     }, [locations]);

//     const [search, setSearch] = useState("");
//     const [showOnlyViolation, setShowOnlyViolation] = useState(false);
//     const [deleteId, setDeleteId] = useState(null);

//     const handleStatusChange = (id, newStatus) => {
//         setLocations(prev =>
//             prev.map((loc, i) =>
//                 i === id ? { ...loc, manualStatus: newStatus } : loc
//             )
//         );
//     };

//     const handleFieldChange = (id, field, value) => {
//         setLocations(prev =>
//             prev.map((loc, i) =>
//                 i === id ? { ...loc, [field]: value } : loc
//             )
//         );
//     };

//     const handleDelete = (id) => {
//         setLocations((prev) => {
//             const itemToDelete = prev.find((_, i) => i === id);
//             const updated = prev.filter((_, i) => i !== id);

//             setDeletedItem(itemToDelete);

//             localStorage.setItem("locations", JSON.stringify(updated));

//             return updated;
//         });
//     };

//     const handleUndo = () => {
//         if (!deletedItem) return;

//         setLocations((prev) => {
//             const updated = [...prev, deletedItem];

//             localStorage.setItem("locations", JSON.stringify(updated));

//             return updated;
//         });

//         setDeletedItem(null);
//     };

//     const violations = useMemo(() => {
//         return locations
//             .map((loc, i) => {
//                 if (!loc.lat || !loc.lng) return null;

//                 const isViolation =
//                     loc.type === "zonasi"
//                         ? loc.violation
//                         : checkViolation(loc, locations);

//                 const limit = loc.limit || 10;
//                 const saturation = loc.saturation || 0;

//                 let status = "Safe";

//                 if (loc.manualStatus) {
//                     status = loc.manualStatus;
//                 } else if (isViolation || saturation > 100) {
//                     status = "Critical";
//                 } else if (saturation > 80) {
//                     status = "Warning";
//                 }

//                 return {
//                     id: i,
//                     code: `#V-${i}`,
//                     name: loc.nama || "-",
//                     district: loc.kecamatan || "-",
//                     rule: "< 500m from Pasar",
//                     limit,
//                     saturation,
//                     status,
//                     lat: loc.lat, // ✅ TAMBAH INI
//                     lng: loc.lng, // ✅ TAMBAH INI
//                 };
//             })
//             .filter(Boolean);
//     }, [locations]);

//     const filtered = violations
//         .filter((loc) =>
//             (loc?.name || "").toLowerCase().includes(search.toLowerCase())
//         )
//         .filter((loc) =>
//             showOnlyViolation ? loc.status === "Critical" : true
//         );

//     return (
//         <div className="ml-64 p-8 text-white">
//             <h1 className="text-2xl font-bold mb-6">All Violations</h1>

//             {/* 🔥 KPI SUMMARY */}
//             <div className="mb-4 flex gap-4">
//                 <div>Critical: {violations.filter(v => v.status === "Critical").length}</div>
//                 <div>Warning: {violations.filter(v => v.status === "Warning").length}</div>
//                 <div>Safe: {violations.filter(v => v.status === "Safe").length}</div>
//             </div>

//             {/* 🔥 UNDO */}
//             {deletedItem && (
//                 <div className="mb-4 p-3 bg-yellow-500/20 text-yellow-300 rounded flex justify-between">
//                     <span>Data dihapus</span>
//                     <button onClick={handleUndo} className="bg-yellow-500 px-2 rounded text-black">
//                         Undo
//                     </button>
//                 </div>
//             )}

//             <button
//                 onClick={() => setShowOnlyViolation(prev => !prev)}
//                 className="mb-4 px-4 py-2 bg-purple-600 rounded"
//             >
//                 {showOnlyViolation ? "Show All" : "Show Violations Only"}
//             </button>

//             <input
//                 placeholder="Cari lokasi..."
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="mb-4 p-2 rounded bg-[#1f2937] w-full"
//             />

//             <table className="w-full text-sm">
//                 <thead>
//                     <tr>
//                         <th>ID</th>
//                         <th>Entity</th>
//                         <th>District</th>
//                         <th>Rule</th>
//                         <th>Limit</th>
//                         <th>Saturation</th>
//                         <th>Status</th>
//                         <th>Edit</th>
//                         <th>Delete</th>
//                     </tr>
//                 </thead>

//                 <tbody>
//                     {filtered.map((item, i) => (
//                         <tr
//                             key={i}
//                             className={item.status === "Critical" ? "bg-red-500/10 cursor-pointer" : "cursor-pointer"}
//                             onClick={() => navigate(`/map?lat=${item.lat}&lng=${item.lng}`)}
//                         >
//                             <td>{item.code}</td>
//                             <td>{item.name}</td>
//                             <td>{item.district}</td>
//                             <td>{item.rule}</td>

//                             <td>
//                                 <input
//                                     type="number"
//                                     value={item.limit}
//                                     className="w-16 bg-gray-200 text-black rounded px-2"
//                                     onChange={(e) =>
//                                         handleFieldChange(item.id, "limit", Number(e.target.value))
//                                     }
//                                 />
//                             </td>

//                             <td>
//                                 <input
//                                     type="number"
//                                     value={item.saturation}
//                                     className="w-16 bg-gray-200 text-black rounded px-2"
//                                     onChange={(e) =>
//                                         handleFieldChange(item.id, "saturation", Number(e.target.value))
//                                     }
//                                 />
//                             </td>

//                             <td>{item.status}</td>

//                             <td>
//                                 <select
//                                     value={item.status}
//                                     className="bg-gray-200 text-black rounded px-2"
//                                     onChange={(e) =>
//                                         handleStatusChange(item.id, e.target.value)
//                                     }
//                                 >
//                                     <option value="Critical">Critical</option>
//                                     <option value="Resolved">Resolved</option>
//                                 </select>
//                             </td>

//                             <td>
//                                 <button onClick={(e) => {
//                                     e.stopPropagation(); // 🔥 biar ga trigger map
//                                     setDeleteId(item.id);
//                                 }}>
//                                     Delete
//                                 </button>
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>

//             {filtered.length === 0 && <div>Tidak ada data</div>}

//             {/* MODAL DELETE */}
//             {deleteId !== null && (
//                 <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
//                     <div className="bg-white p-4">
//                         <p>Yakin hapus?</p>
//                         <button onClick={() => setDeleteId(null)}>Cancel</button>
//                         <button
//                             onClick={() => {
//                                 handleDelete(deleteId);
//                                 setDeleteId(null);
//                             }}
//                         >
//                             Delete
//                         </button>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default ViolationsPage;









import React, { useMemo, useState, useEffect } from "react";
import { useLocations } from "../hooks/useLocations";
import { useNavigate } from "react-router-dom";

// 🔥 logic dari MapView
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

const checkViolation = (current, all) => {
    if (current.type !== "retail") return false;

    return all.some((other) => {
        if (other.type !== "pasar") return false;
        return (
            getDistance(current.lat, current.lng, other.lat, other.lng) < 500
        );
    });
};

const ViolationsPage = () => {
    const navigate = useNavigate();

    const rawLocations = useLocations() || [];
    const [locations, setLocations] = useState([]);

    const [deletedItem, setDeletedItem] = useState(null);

    // 🔥 ROLE STATE
    const [role, setRole] = useState("user");

    useEffect(() => {
        const savedRole = localStorage.getItem("role");
        if (savedRole) setRole(savedRole);
    }, []);

    useEffect(() => {
        localStorage.setItem("role", role);
    }, [role]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem("locations");
            if (saved) setLocations(JSON.parse(saved));
        } catch (e) {
            console.error("LocalStorage error:", e);
        }
    }, []);

    useEffect(() => {
        if (rawLocations.length > 0) {
            setLocations(prev => (prev.length === 0 ? rawLocations : prev));
        }
    }, [rawLocations]);

    useEffect(() => {
        if (locations.length > 0) {
            localStorage.setItem("locations", JSON.stringify(locations));
        }
    }, [locations]);

    const [search, setSearch] = useState("");
    const [showOnlyViolation, setShowOnlyViolation] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const handleStatusChange = (id, newStatus) => {
        setLocations(prev =>
            prev.map((loc, i) =>
                i === id ? { ...loc, manualStatus: newStatus } : loc
            )
        );
    };

    const handleFieldChange = (id, field, value) => {
        setLocations(prev =>
            prev.map((loc, i) =>
                i === id ? { ...loc, [field]: value } : loc
            )
        );
    };

    const handleDelete = (id) => {
        setLocations((prev) => {
            const itemToDelete = prev.find((_, i) => i === id);
            const updated = prev.filter((_, i) => i !== id);

            setDeletedItem(itemToDelete);

            localStorage.setItem("locations", JSON.stringify(updated));

            return updated;
        });
    };

    const handleUndo = () => {
        if (!deletedItem) return;

        setLocations((prev) => {
            const updated = [...prev, deletedItem];
            localStorage.setItem("locations", JSON.stringify(updated));
            return updated;
        });

        setDeletedItem(null);
    };

    const violations = useMemo(() => {
        return locations
            .map((loc, i) => {
                if (!loc.lat || !loc.lng) return null;

                const isViolation =
                    loc.type === "zonasi"
                        ? loc.violation
                        : checkViolation(loc, locations);

                const limit = loc.limit || 10;
                const saturation = loc.saturation || 0;

                let status = "Safe";

                if (loc.manualStatus) {
                    status = loc.manualStatus;
                } else if (isViolation || saturation > 100) {
                    status = "Critical";
                } else if (saturation > 80) {
                    status = "Warning";
                }

                return {
                    id: i,
                    code: `#V-${i}`,
                    name: loc.nama || "-",
                    district: loc.kecamatan || "-",
                    rule: "< 500m from Pasar",
                    limit,
                    saturation,
                    status,
                    lat: loc.lat,
                    lng: loc.lng,
                };
            })
            .filter(Boolean);
    }, [locations]);

    const filtered = violations
        .filter((loc) =>
            (loc?.name || "").toLowerCase().includes(search.toLowerCase())
        )
        .filter((loc) =>
            showOnlyViolation ? loc.status === "Critical" : true
        );

    return (
        <div className="ml-64 p-8 text-white">
            <h1 className="text-2xl font-bold mb-6">All Violations</h1>

            {/* 🔥 ROLE INFO */}
            <div className="mb-2 text-sm">
                Role: <b>{role.toUpperCase()}</b>
            </div>

            {/* 🔥 TOGGLE ROLE */}
            <button
                onClick={() => setRole(prev => prev === "admin" ? "user" : "admin")}
                className="mb-4 px-4 py-2 bg-blue-600 rounded"
            >
                Switch to {role === "admin" ? "User" : "Admin"}
            </button>

            {/* KPI */}
            <div className="mb-4 flex gap-4">
                <div>Critical: {violations.filter(v => v.status === "Critical").length}</div>
                <div>Warning: {violations.filter(v => v.status === "Warning").length}</div>
                <div>Safe: {violations.filter(v => v.status === "Safe").length}</div>
            </div>

            {deletedItem && (
                <div className="mb-4 p-3 bg-yellow-500/20 text-yellow-300 rounded flex justify-between">
                    <span>Data dihapus</span>
                    <button onClick={handleUndo} className="bg-yellow-500 px-2 rounded text-black">
                        Undo
                    </button>
                </div>
            )}

            <button
                onClick={() => setShowOnlyViolation(prev => !prev)}
                className="mb-4 px-4 py-2 bg-purple-600 rounded"
            >
                {showOnlyViolation ? "Show All" : "Show Violations Only"}
            </button>

            <input
                placeholder="Cari lokasi..."
                onChange={(e) => setSearch(e.target.value)}
                className="mb-4 p-2 rounded bg-[#1f2937] w-full"
            />

            <table className="w-full text-sm">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Entity</th>
                        <th>District</th>
                        <th>Rule</th>
                        <th>Limit</th>
                        <th>Saturation</th>
                        <th>Status</th>
                        <th>Edit</th>
                        <th>Delete</th>
                    </tr>
                </thead>

                <tbody>
                    {filtered.map((item, i) => (
                        <tr
                            key={i}
                            className={item.status === "Critical" ? "bg-red-500/10 cursor-pointer" : "cursor-pointer"}
                            onClick={() => navigate(`/map?lat=${item.lat}&lng=${item.lng}`)}
                        >
                            <td>{item.code}</td>
                            <td>{item.name}</td>
                            <td>{item.district}</td>
                            <td>{item.rule}</td>

                            <td>
                                <input
                                    type="number"
                                    value={item.limit}
                                    disabled={role !== "admin"}
                                    className="w-16 bg-gray-200 text-black rounded px-2 disabled:opacity-50"
                                    onChange={(e) =>
                                        handleFieldChange(item.id, "limit", Number(e.target.value))
                                    }
                                />
                            </td>

                            <td>
                                <input
                                    type="number"
                                    value={item.saturation}
                                    disabled={role !== "admin"}
                                    className="w-16 bg-gray-200 text-black rounded px-2 disabled:opacity-50"
                                    onChange={(e) =>
                                        handleFieldChange(item.id, "saturation", Number(e.target.value))
                                    }
                                />
                            </td>

                            <td>{item.status}</td>

                            <td>
                                <select
                                    value={item.status}
                                    disabled={role !== "admin"}
                                    className="bg-gray-200 text-black rounded px-2 disabled:opacity-50"
                                    onChange={(e) =>
                                        handleStatusChange(item.id, e.target.value)
                                    }
                                >
                                    <option value="Critical">Critical</option>
                                    <option value="Resolved">Resolved</option>
                                </select>
                            </td>

                            <td>
                                {role === "admin" && (
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteId(item.id);
                                    }}>
                                        Delete
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {filtered.length === 0 && <div>Tidak ada data</div>}

            {deleteId !== null && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-white p-4">
                        <p>Yakin hapus?</p>
                        <button onClick={() => setDeleteId(null)}>Cancel</button>
                        <button
                            onClick={() => {
                                handleDelete(deleteId);
                                setDeleteId(null);
                            }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViolationsPage;