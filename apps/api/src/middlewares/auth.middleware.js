import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
  try {
    // ambil token dari header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Unauthorized - Token tidak ditemukan",
      });
    }

    // ambil token asli
    const token = authHeader.split(" ")[1];

    // verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // simpan data user ke request
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized - Token invalid",
      error: error.message,
    });
  }
};