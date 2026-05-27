import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const AuthProvider = ({ children }) => {

    // 🔥 LOAD DARI LOCALSTORAGE (AUTO LOGIN)
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // 🔥 LOGIN — async, panggil API backend
    const login = async (email, password) => {
        if (!email || !password) return { success: false, error: "Email dan password wajib diisi" };

        try {
            const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const json = await res.json();

            if (!res.ok) {
                return { success: false, error: json.message || "Login gagal" };
            }

            // Simpan data lengkap user dari response API
            const userData = {
                id: json.data.id,
                email: json.data.email,
                name: json.data.username,   // field 'name' dipakai di Header
                roleId: json.data.roleId ?? 2,
                role: json.data.role ?? { id: 2, name: 'user' },
                isAdmin: json.data.isAdmin ?? (json.data.roleId === 1),
                avatar: json.data.avatar || null,
                token: json.token,
            };

            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));

            return { success: true };
        } catch (err) {
            console.error("LOGIN ERROR:", err);
            return { success: false, error: "Tidak dapat terhubung ke server" };
        }
    };

    // 🔥 LOGOUT
    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);