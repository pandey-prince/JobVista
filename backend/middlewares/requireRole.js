import { User } from "../models/user.model.js";

const requireRole = (role) => async (req, res, next) => {
  try {
    const user = await User.findById(req.id);

    if (!user || user.role !== role) {
      return res.status(403).json({
        message: `Only ${role}s can access this feature`,
        success: false,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      message: "Authorization failed",
      success: false,
    });
  }
};

export default requireRole;
