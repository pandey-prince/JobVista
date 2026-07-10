const getProvidedSecret = (req) => {
  const header = req.headers["x-cron-secret"];
  if (header) return String(header);

  const auth = req.headers.authorization || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : "";
};

export default (req, res, next) => {
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    return res.status(503).json({
      success: false,
      message: "CRON_SECRET is not configured on the server.",
    });
  }

  if (getProvidedSecret(req) !== expected) {
    return res.status(401).json({
      success: false,
      message: "Invalid cron secret.",
    });
  }

  return next();
};
