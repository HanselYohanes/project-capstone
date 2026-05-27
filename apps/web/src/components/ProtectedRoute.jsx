import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─── RequireAuth ──────────────────────────────────────────────────────────────
// Pelindung 1: Cek apakah user sudah login (token ada di localStorage).
// Jika belum → redirect ke /login. Jika sudah → render halaman di dalamnya.
export const RequireAuth = () => {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

// ─── RequireAdmin ─────────────────────────────────────────────────────────────
// Pelindung 2: Cek apakah user yang sudah login punya hak Admin.
// Jika bukan admin → redirect ke /. Jika admin → render halaman di dalamnya.
export const RequireAdmin = () => {
    const { user } = useAuth();

    if (!user?.isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

// ─── Backward-compatible default export ───────────────────────────────────────
// App.jsx yang sudah ada masih menggunakan pola <ProtectedRoute>{children}</ProtectedRoute>
// Komponen ini menjaga kompatibilitas mundur agar routing lama tidak rusak.
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
