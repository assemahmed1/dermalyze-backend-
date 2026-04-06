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

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

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