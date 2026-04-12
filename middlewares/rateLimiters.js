const rateLimit = require("express-rate-limit");

// Global rate limiter: limits each IP to 100 requests per 15 minutes
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: {
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiter for authentication paths
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login/register attempts per window
  message: {
    message: "Too many authentication attempts from this IP, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
