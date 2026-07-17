import rateLimit from "express-rate-limit";

const WINDOW_MS = 15 * 60 * 1000;

const API_MAX = 200;
const AUTH_MAX = 20;
const CHATBOT_MAX = 30;

const rateLimitHandler = (_req, res, _next, options) => {
  res.status(options.statusCode).json({
    success: false,
    message: options.message,
  });
};

const createLimiter = ({ max, message }) =>
  rateLimit({
    windowMs: WINDOW_MS,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message,
    handler: rateLimitHandler,
    skip: () => process.env.NODE_ENV === "test",
  });

export const apiLimiter = createLimiter({
  max: API_MAX,
  message: "Too many requests. Please try again later.",
});

export const authLimiter = createLimiter({
  max: AUTH_MAX,
  message: "Too many auth attempts. Please try again later.",
});

export const chatbotLimiter = createLimiter({
  max: CHATBOT_MAX,
  message: "Too many chatbot requests. Please try again later.",
});
