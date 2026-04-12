require("dotenv").config();

const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const connectDB = require("./config/db");

const analysisRoutes = require("./routes/analysisRoutes");
const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const patientRoutes = require("./routes/patientRoutes");
const medicationRoutes = require("./routes/medicationRoutes");
const historyRoutes = require("./routes/historyRoutes");
const verifyRoutes = require("./routes/verifyRoutes");
const errorHandler = require("./middlewares/errorHandler");
const { loadModels } = require("./services/faceService");

// Security related dependencies
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const { apiLimiter } = require("./middlewares/rateLimiters");

const app = express();

// 1) Set security HTTP headers
app.use(helmet());

// 2) Enable CORS (restricted in production)
app.use(cors({
  origin: process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : "*"
}));

// 3) Body parser, reading data into req.body with size limit (e.g., 10kb)
app.use(express.json({ limit: "10kb" })); // Prevents large payloads

// 4) Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// 5) Data sanitization against XSS
app.use(xss());

// 6) Prevent parameter pollution
app.use(hpp());

// 7) Apply global rate limiter to all /api routes
app.use("/api", apiLimiter);

connectDB();

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/auth", verifyRoutes);
app.use("/api", protectedRoutes);
app.use("/api", doctorRoutes);
app.use("/api", analysisRoutes);
app.use("/api", patientRoutes);
app.use("/api", medicationRoutes);
app.use("/api", historyRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Dermalyze Backend Running ✅");
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler — must be last middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5050;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
  await loadModels();
});