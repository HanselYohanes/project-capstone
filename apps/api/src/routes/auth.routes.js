// src/routes/auth.routes.js

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

const router = Router();

// ─── REGISTER ───────────────────────────────────────────
router.post('/register', async (req, res) => {
try {
const { email, username, password } = req.body;

// validasi input
if (!email || !username || !password) {
  return res.status(400).json({
    success: false,
    message: 'Semua field wajib diisi',
  });
}

// cek email
const existingEmail = await prisma.user.findUnique({
  where: {
    email,
  },
});

if (existingEmail) {
  return res.status(400).json({
    success: false,
    message: 'Email sudah digunakan',
  });
}

// cek username
const existingUsername = await prisma.user.findUnique({
  where: {
    username,
  },
});

if (existingUsername) {
  return res.status(400).json({
    success: false,
    message: 'Username sudah digunakan',
  });
}

// hash password
const hashedPassword = await bcrypt.hash(password, 10);

// simpan user
const user = await prisma.user.create({
  data: {
    email,
    username,
    password: hashedPassword,
  },
});

res.status(201).json({
  success: true,
  message: 'Register berhasil',
  data: {
    id: user.id,
    email: user.email,
    username: user.username,
    isAdmin: user.isAdmin,
  },
});

} catch (error) {
console.error('REGISTER ERROR:', error);

res.status(500).json({
  success: false,
  message: 'Internal server error',
});

}
});

// ─── LOGIN ──────────────────────────────────────────────
router.post('/login', async (req, res) => {
try {
console.log('BODY:', req.body);

const { email, password } = req.body;

// validasi
if (!email || !password) {
  return res.status(400).json({
    success: false,
    message: 'Email dan password wajib diisi',
  });
}

// cari user
const user = await prisma.user.findUnique({
  where: {
    email,
  },
});

console.log('USER:', user);

if (!user) {
  return res.status(404).json({
    success: false,
    message: 'User tidak ditemukan',
  });
}

// cek password
const isPasswordValid = await bcrypt.compare(
  password,
  user.password
);

console.log('PASSWORD VALID:', isPasswordValid);

if (!isPasswordValid) {
  return res.status(401).json({
    success: false,
    message: 'Password salah',
  });
}

console.log('JWT SECRET:', process.env.JWT_SECRET);

// generate token
const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
  },
  process.env.JWT_SECRET,
  {
    expiresIn: '1d',
  }
);

res.status(200).json({
  success: true,
  message: 'Login berhasil',
  token,
  data: {
    id: user.id,
    email: user.email,
    username: user.username,
    isAdmin: user.isAdmin,
  },
});

} catch (error) {
console.error('LOGIN ERROR FULL:', error);

res.status(500).json({
  success: false,
  message: error.message,
});

}
});

// ─── LOGOUT ─────────────────────────────────────────────
router.post('/logout', async (req, res) => {
try {
res.status(200).json({
success: true,
message: 'Logout berhasil',
});

} catch (error) {
console.error('LOGOUT ERROR:', error);

res.status(500).json({
  success: false,
  message: 'Internal server error',
});

}
});

export default router;
