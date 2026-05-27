const Attendance = require("../models/attendance");
const User = require("../models/User");

// 📅 Today Date (IST SAFE)
const getTodayDate = () => {
  return new Date().toISOString().split("T")[0];
};

// 🆕 Get Attendance History (Last 5 days for dashboard)
const getAttendanceHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    // 🆕 Get last 5 days attendance for this specific user
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const records = await Attendance.findAll({
      where: {
        userId: parseInt(userId),
        date: {
          [require('sequelize').Op.gte]: fiveDaysAgo.toISOString().split("T")[0],
        },
      },
      order: [["date", "DESC"]],
      attributes: ["date", "punchIn", "punchOut", "status", "lateMinutes"],
    });

    // 🆕 Transform for frontend (Mon, Tue format + scores)
    const formattedHistory = records.map((record) => {
      const dayName = new Date(record.date).toLocaleDateString("en-US", { 
        weekday: "short" 
      });
      
      let score = 100; // Default full score

      // 🆕 Calculate score based on status & late minutes
      if (record.status === "Absent") {
        score = 0;
      } else if (record.status === "HalfDay") {
        score = 50;
      } else if (record.status === "Present" && record.lateMinutes > 0) {
        score = Math.max(0, 100 - record.lateMinutes);
      }

      return {
        day: dayName,
        status: record.status || "Present",
        score: Math.round(score),
      };
    });

    return res.json(formattedHistory);
  } catch (error) {
    console.error("Attendance history error:", error);
    return res.status(500).json({ error: "Failed to fetch history" });
  }
};

// ✅ GET TODAY STATUS
const getTodayStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const record = await Attendance.findOne({
      where: {
        userId,
        date: getTodayDate(),
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!record) {
      return res.json({ status: "Not Marked" });
    }

    return res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ PUNCH IN (🔥 UPDATED WITH LATE + HALFDAY LOGIC)
const punchIn = async (req, res) => {
  try {
    const { userId, override } = req.body;
    const today = getTodayDate();

    let record = await Attendance.findOne({
      where: { userId, date: today },
    });

    // ❌ Already present → block
    if (record && record.status === "Present" && !override) {
      return res.json({ message: "Already marked Present ✅" });
    }

    const now = new Date();

    // 🔥 TIME LOGIC
    const hours = now.getHours();
    const minutes = now.getMinutes();

    const totalMinutes = hours * 60 + minutes;

    let status = "Present";
    let lateMinutes = 0;

    // 🟢 Grace till 9:45 AM (585 mins)
    if (totalMinutes > 585 && totalMinutes <= 660) {
      lateMinutes = totalMinutes - 585;
    }

    // 🔴 After 11:00 AM → Half Day
    if (totalMinutes > 660) {
      status = "HalfDay";
    }

    // ✅ First Punch
    if (!record) {
      record = await Attendance.create({
        userId,
        date: today,
        punchIn: now,
        status,
        lateMinutes,
      });

      return res.json({
        message: `Punch In successful ✅ (${status})`,
        record,
      });
    }

    // 🔥 OVERRIDE LOGIC
    if (override) {
      if (record.status === "Leave" || record.status === "Absent") {
        record.status = "Present";
        record.punchIn = now;
        record.lateMinutes = 0;

        await record.save();

        return res.json({
          message: "Override → Marked Present ✅",
          record,
        });
      } else {
        return res.status(400).json({
          message: "Override not allowed ❌",
        });
      }
    }

    return res.json({ message: "Punch already exists" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ PUNCH OUT
const punchOut = async (req, res) => {
  try {
    const { userId } = req.body;
    const today = getTodayDate();

    const record = await Attendance.findOne({
      where: { userId, date: today },
    });

    if (!record) {
      return res.json({ message: "No punch-in found ❌" });
    }

    record.punchOut = new Date();
    await record.save();

    return res.json({ message: "Punch Out successful ✅", record });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ GET ALL ATTENDANCE (ADMIN)
const getAllAttendance = async (req, res) => {
  try {
    const records = await Attendance.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ EXPORT ALL FUNCTIONS
module.exports = {
  punchIn,
  punchOut,
  getTodayStatus,
  getAllAttendance,
  getAttendanceHistory, // 🆕 ADDED
};