// src/routes/auth.routes.js

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

const router = Router();

// ─── REGISTER USER ──────────────────────────────────────
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

    // simpan user biasa
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        roleId: 2,
        isAdmin: false,
      },
      include: {
        role: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Register user berhasil',
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        roleId: user.roleId,
        role: user.role,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error('REGISTER ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// ─── REGISTER ADMIN ─────────────────────────────────────
// Route ini untuk testing/development.
// Kalau sudah production, sebaiknya jangan dibuka bebas.
router.post('/register-admin', async (req, res) => {
  try {
    const { email, username, password, adminSecret } = req.body;

    // optional security
    // isi ADMIN_SECRET di .env, misalnya:
    // ADMIN_SECRET=superadmin123
    if (process.env.ADMIN_SECRET) {
      if (adminSecret !== process.env.ADMIN_SECRET) {
        return res.status(403).json({
          success: false,
          message: 'Admin secret salah',
        });
      }
    }

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

    // simpan admin
    const admin = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        roleId: 1,
        isAdmin: true,
      },
      include: {
        role: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Register admin berhasil',
      data: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        roleId: admin.roleId,
        role: admin.role,
        isAdmin: admin.isAdmin,
      },
    });
  } catch (error) {
    console.error('REGISTER ADMIN ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
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

    // cari user dengan role relationship
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        role: true,
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
    const isPasswordValid = await bcrypt.compare(password, user.password);

    console.log('PASSWORD VALID:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Password salah',
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'JWT_SECRET belum disetting di .env',
      });
    }

    // pastikan admin terbaca benar
    const isAdmin = user.roleId === 1 || user.isAdmin === true;

    // generate token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        roleId: user.roleId,
        isAdmin,
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
        roleId: user.roleId,
        role: user.role,
        isAdmin,
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
      error: error.message,
    });
  }
});

export default router;