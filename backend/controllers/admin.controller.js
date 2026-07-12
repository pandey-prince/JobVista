import { getAdminDashboard, getAdminSourcesList } from "../services/adminDashboard.service.js";

export const fetchAdminDashboard = async (req, res) => {
  try {
    const data = await getAdminDashboard(req.query);
    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("[Admin] dashboard failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load admin dashboard",
    });
  }
};

export const fetchAdminSources = async (req, res) => {
  try {
    const sources = await getAdminSourcesList();
    return res.status(200).json({
      success: true,
      sources,
    });
  } catch (error) {
    console.error("[Admin] sources list failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load sources",
    });
  }
};
