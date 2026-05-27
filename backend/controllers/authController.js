const User = require("../models/User");
const jwt = require("jsonwebtoken");

// ✅ SIGNUP
const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    return res.status(201).json({
      message: "User registered successfully ✅",
      user,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

// ✅ LOGIN (🔥 TOKEN ADDED)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login API hit");

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        message: "User not found ❌",
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        message: "Invalid password ❌",
      });
    }

    // 🔥 CREATE TOKEN
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET || "secret123", // ⚠️ env me add karo
      { expiresIn: "1d" }
    );

    // ✅ FINAL RESPONSE
    return res.status(200).json({
      message: "Login success ✅",
      token, // 🔥 IMPORTANT
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { signup, login };