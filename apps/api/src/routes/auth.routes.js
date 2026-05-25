// src/routes/auth.routes.js

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

const router = Router();

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // validasi input
    if (!email || !username || !password) {
      return res.status(400).json({
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
      message: 'Register berhasil',
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Internal server error',
    });
  }
});

router.post('/login', async (req, res) => {
try {
console.log('BODY:', req.body);

const { email, password } = req.body;

if (!email || !password) {
  return res.status(400).json({
    message: 'Email dan password wajib diisi',
  });
}

const user = await prisma.user.findUnique({
  where: {
    email,
  },
});

console.log('USER:', user);

if (!user) {
  return res.status(404).json({
    message: 'User tidak ditemukan',
  });
}

const isPasswordValid = await bcrypt.compare(
  password,
  user.password
);

console.log('PASSWORD VALID:', isPasswordValid);

if (!isPasswordValid) {
  return res.status(401).json({
    message: 'Password salah',
  });
}

console.log('JWT SECRET:', process.env.JWT_SECRET);

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
  message: error.message,
});

}
});


export default router;