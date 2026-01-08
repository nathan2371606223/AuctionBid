const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-change-in-production";

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "未授权" });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "无效的令牌" });
  }
}

module.exports = { authMiddleware };
