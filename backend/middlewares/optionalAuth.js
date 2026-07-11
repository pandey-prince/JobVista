import jwt from "jsonwebtoken";

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return next();

    const decode = jwt.verify(token, process.env.SECRET_KEY);
    if (decode?.userId) {
      req.id = decode.userId;
    }
  } catch {
    // Invalid or expired token — treat as guest
  }
  next();
};

export default optionalAuth;
