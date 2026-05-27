const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const Leave = sequelize.define(
  "Leave",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"), // ✅ FIXED
      defaultValue: "pending",
    },
  },
  {
    tableName: "leaves",
    timestamps: true,

    // ✅ prevent duplicate leave for same day
    indexes: [
      {
        unique: true,
        fields: ["userId", "date"],
      },
    ],
  }
);

// ✅ RELATION (IMPORTANT)
Leave.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasMany(Leave, {
  foreignKey: "userId",
});

module.exports = Leave;