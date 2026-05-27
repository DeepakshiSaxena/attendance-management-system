const express = require("express");
const next = require("next");
const cors = require("cors");
const path = require("path");
require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
});

const sequelize = require("./config/db");

// ✅ Models
require("./models/User");
require("./models/attendance");
require("./models/leave");
require("./models/holiday");
require("./models/tasks");

// ✅ Routes
const authRoutes = require("./routes/auth.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const userRoutes = require("./routes/user.routes");
const salaryRoutes = require("./routes/salary.routes");
const tasksRoutes = require("./routes/tasks.routes");

// ✅ Next.js Setup
const dev = process.env.NODE_ENV !== "production";

const nextApp = next({
  dev,
  dir: path.join(__dirname, "../frontend"),
});

const handle = nextApp.getRequestHandler();

// ✅ Start Next + Express
nextApp.prepare().then(() => {
  const app = express();

  // ✅ Middleware
  app.use(express.json());

  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // ✅ API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/attendance", attendanceRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/salary", salaryRoutes);
  app.use("/api/tasks", tasksRoutes);

  // ✅ API Test Route
  app.get("/api", (req, res) => {
    res.send("✅ API Running Successfully");
  });

  // ✅ Handle Frontend Pages
  app.use((req, res) => {
    return handle(req, res);
  });

  // ✅ Database + Server Start
  sequelize
    .authenticate()
    .then(() => {
      console.log("✅ Database Connected");

      return sequelize.sync({ alter: true });
    })
    .then(() => {
      const PORT = process.env.PORT || 5002;

      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🌐 Open: http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.log("❌ Database Error:", err);
    });
});