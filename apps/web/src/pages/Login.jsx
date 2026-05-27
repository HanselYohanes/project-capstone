import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
    const { login, user } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // 🔥 AUTO REDIRECT kalau sudah login
    useEffect(() => {
        if (user) {
            navigate("/");
        }
    }, [user, navigate]);

    // 🔥 HANDLE LOGIN
    const handleLogin = async (e) => {
        e.preventDefault();

        const result = await login(email, password);

        if (result.success) {
            navigate("/"); // 🔥 langsung ke dashboard
        } else {
            alert(result.error || "Email / Password salah ❌");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020817]">
            <div className="bg-[#1e293b] p-6 rounded-xl w-80 shadow-lg">

                <h2 className="text-white text-lg font-bold mb-4 text-center">
                    Login Admin
                </h2>

                {/* EMAIL */}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mb-3 px-3 py-2 rounded bg-gray-300 text-black"
                />

                {/* PASSWORD */}
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full mb-4 px-3 py-2 rounded bg-gray-300 text-black"
                />

                {/* BUTTON LOGIN */}
                <button
                    onClick={handleLogin}
                    className="w-full bg-purple-400 py-2 rounded text-white font-semibold hover:opacity-90 transition"
                >
                    Login
                </button>

                {/* LINK KE REGISTER */}
                <p className="text-center text-sm text-slate-500 mt-4">
                    Belum punya akun?{" "}
                    <Link
                        to="/register"
                        className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                    >
                        Daftar di sini
                    </Link>
                </p>

            </div>
        </div>
    );
};

export default Login;