const express = require("express");
const router = express.Router();

const {
  punchIn,
  punchOut,
  getTodayStatus,
  getAllAttendance,
  getAttendanceHistory, // 🆕 ADDED
} = require("../controllers/attendanceController");

// =========================
// 👤 EMPLOYEE ROUTES
// =========================

// 🔹 Get today's attendance status
router.get("/status/:userId", getTodayStatus);

// 🆕 Get attendance history (Last 5 days)
router.get("/history/:userId", getAttendanceHistory); // 🆕 ADDED

// 🔹 Punch In
router.post("/punch-in", punchIn);

// 🔹 Punch Out
router.post("/punch-out", punchOut);

// =========================
// 🧑‍💼 ADMIN ROUTES
// =========================

// 🔥 Get all attendance (IMPORTANT for dashboard)
router.get("/", getAllAttendance);

// =========================
// 🚀 EXPORT
// =========================
module.exports = router;