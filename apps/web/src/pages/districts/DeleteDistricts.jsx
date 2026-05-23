import React, { useState } from "react";

const API_BASE = "http://localhost:3001/api/v1";

/**
 * DeleteDistricts — Modal konfirmasi hapus distrik.
 *
 * Props:
 *  - districtId   (string)   : ID distrik yang akan dihapus
 *  - districtName (string)   : Nama distrik (untuk tampilan konfirmasi)
 *  - isOpen       (boolean)  : Apakah modal ditampilkan
 *  - onClose      (function) : Callback untuk menutup modal
 *  - onDeleted    (function) : Callback setelah berhasil dihapus (opsional, misal untuk refresh list)
 */
const DeleteDistricts = ({ districtId, districtName, isOpen, onClose, onDeleted }) => {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // --- Handle delete ---
    const handleDelete = async () => {
        setDeleting(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/districts/${districtId}`, {
                method: "DELETE",
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || `Gagal menghapus distrik. Status: ${response.status}`);
            }

            setSuccess(true);

            // Tunggu sebentar agar user bisa lihat pesan sukses, lalu close
            setTimeout(() => {
                setSuccess(false);
                setError(null);
                if (onDeleted) onDeleted(districtId);
                onClose();
            }, 1500);
        } catch (err) {
            setError(err.message || "Terjadi kesalahan saat menghapus distrik.");
        } finally {
            setDeleting(false);
        }
    };

    // --- Handle close (reset state) ---
    const handleClose = () => {
        if (deleting) return; // jangan tutup saat proses delete
        setError(null);
        setSuccess(false);
        onClose();
    };

    // Jangan render jika tidak open
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative glass-panel rounded-2xl w-full max-w-md overflow-hidden shadow-2xl shadow-black/40 animate-[fadeIn_0.2s_ease-out]">

                {/* ====== SUCCESS STATE ====== */}
                {success ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/15 flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-emerald-400">check_circle</span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">Berhasil Dihapus</h3>
                        <p className="text-on-surface-variant text-sm">
                            Distrik <span className="text-white font-medium">{districtName || districtId}</span> telah dihapus dari sistem.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="px-6 pt-6 pb-4 text-center">
                            {/* Warning Icon */}
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-red-400">delete_forever</span>
                            </div>

                            <h3 className="text-lg font-semibold text-white mb-1">
                                Hapus Distrik?
                            </h3>
                            <p className="text-on-surface-variant text-sm leading-relaxed">
                                Anda akan menghapus distrik{" "}
                                <span className="text-white font-medium">
                                    {districtName || districtId}
                                </span>
                                . Tindakan ini tidak dapat dibatalkan.
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mx-6 mb-4 flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
                                <span className="material-symbols-outlined text-red-400 text-lg shrink-0 mt-0.5">warning</span>
                                <div className="flex-1">
                                    <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-0.5">
                                        Gagal Menghapus
                                    </p>
                                    <p className="text-red-300/80 text-sm">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="px-6 pb-6 flex items-center gap-3">
                            {/* Cancel */}
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={deleting}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-medium border border-outline-variant/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Batal
                            </button>

                            {/* Delete */}
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 focus:ring-2 focus:ring-red-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deleting ? (
                                    <>
                                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        Menghapus...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                        Ya, Hapus
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default DeleteDistricts;
