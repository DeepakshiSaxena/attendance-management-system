const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const Attendance = sequelize.define(
  "Attendance",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // 📅 Date
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    // ⏰ Punch In
    punchIn: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // ⏰ Punch Out
    punchOut: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // ✅ STATUS (UPDATED)
    status: {
      type: DataTypes.ENUM("Present", "Leave", "Absent", "HalfDay"),
      defaultValue: "Absent",
    },

    // 🔥 NEW FIELD (IMPORTANT)
    lateMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "attendance",
    timestamps: true,

    // 🔥 Prevent duplicate entry per day
    indexes: [
      {
        unique: true,
        fields: ["userId", "date"],
      },
    ],
  }
);

// 🔗 RELATION
Attendance.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasMany(Attendance, {
  foreignKey: "userId",
});

module.exports = Attendance;