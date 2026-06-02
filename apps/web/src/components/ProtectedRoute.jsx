import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Helper: ambil token dari object user di localStorage
const getToken = () => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user)?.token : null;
  } catch {
    return null;
  }
};

export const RequireAuth = () => {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export const RequireAdmin = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-white">Loading...</div>;
  }

  if (!user || !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const ProtectedRoute = ({ children }) => {
  // 🔥 FIX: Baca token dari objek "user" di localStorage (sesuai AuthContext)
  const savedUser = localStorage.getItem('user');
  const token = savedUser ? JSON.parse(savedUser)?.token : null;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;