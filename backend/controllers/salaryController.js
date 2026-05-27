const User = require("../models/User");
const Attendance = require("../models/attendance");
const { Op } = require("sequelize");

// ✅ SET SALARY (Admin) - KEEP AS IS
exports.setSalary = async (req, res) => {
  try {
    const { userId, salaryPerMonth } = req.body;

    if (!userId || !salaryPerMonth) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.salaryPerMonth = salaryPerMonth;
    await user.save();

    res.json({ message: "Salary set successfully ✅" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔥 FIXED GET SALARY - HALF DAY LOGIC ✅
exports.getSalary = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);

    // 🛡️ No salary set? Return zeros
    if (!user || !user.salaryPerMonth || user.salaryPerMonth <= 0) {
      console.log(`No salary set for user ${userId}`);
      return res.json({
        salaryPerMonth: 0,
        dailyRate: 0,           // ✅ Frontend expects this
        fullDays: 0,            // ✅ Frontend expects this  
        halfDays: 0,            // ✅ Frontend expects this
        totalSalary: 0,
        month: new Date().toLocaleDateString("en-US", { month: "long" }),
        fullDayAmount: 0,
        halfDayAmount: 0
      });
    }

    // 📅 Current Month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formatDate = (date) => date.toISOString().split("T")[0];

    // 🔥 COUNT BOTH Present + HalfDay ✅
    const attendance = await Attendance.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [formatDate(startOfMonth), formatDate(endOfMonth)],
        },
      },
    });

    // 🆕 NEW LOGIC: Separate Full + Half Days
    let fullDays = 0;
    let halfDays = 0;

    attendance.forEach(record => {
      if (record.status === 'Present') {
        fullDays++;
      } else if (record.status === 'HalfDay') {
        halfDays++;
      }
    });

    console.log(`User ${userId}: FullDays=${fullDays}, HalfDays=${halfDays}`);

    // 🛡️ Safe calculations
    const workingDays = endOfMonth.getDate();
    const dailyRate = user.salaryPerMonth / workingDays;

    const fullDayAmount = fullDays * dailyRate;
    const halfDayAmount = halfDays * (dailyRate * 0.5); // 🔥 50% for HalfDay
    const totalSalary = fullDayAmount + halfDayAmount;

    const response = {
      salaryPerMonth: Number(user.salaryPerMonth),
      dailyRate: Math.round(dailyRate),        // ✅ Frontend needs this
      fullDays,                                // ✅ Frontend needs this
      halfDays,                                // ✅ Frontend needs this
      totalSalary: Math.round(totalSalary),    // ✅ Full + Half
      month: startOfMonth.toLocaleDateString("en-US", { month: "long" }),
      fullDayAmount: Math.round(fullDayAmount),
      halfDayAmount: Math.round(halfDayAmount),
    };

    console.log("Salary response:", response);
    res.json(response);

  } catch (err) {
    console.error("Salary error:", err);
    res.status(500).json({ 
      message: "Server error", 
      error: err.message,
      salaryPerMonth: 0,
      dailyRate: 0,
      fullDays: 0,
      halfDays: 0,
      totalSalary: 0 
    });
  }
};