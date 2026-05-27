const User = require("../models/User");

const checkAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.headers.userid);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied ❌" });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { checkAdmin };