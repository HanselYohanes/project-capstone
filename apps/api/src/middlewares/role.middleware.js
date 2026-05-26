export const isAdmin = (req, res, next) => {
  try {
    // pastikan user login
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // cek apakah admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        message: "Access denied - Admin only",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      message: "Role middleware error",
      error: error.message,
    });
  }
};