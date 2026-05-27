const express = require("express");
const router = express.Router();

const { getAllUsers } = require("../controllers/userController");

// ✅ GET all users
router.get("/", getAllUsers);

module.exports = router;