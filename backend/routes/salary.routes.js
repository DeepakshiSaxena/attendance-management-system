const express = require("express");
const router = express.Router();

const {
  setSalary,
  getSalary,
} = require("../controllers/salaryController");

const auth = require("../middleware/authMiddleware");
const { checkAdmin } = require("../middleware/roleMiddleware");

// 🧑‍💼 ADMIN sets salary
router.post("/set", setSalary);

// 👤 Employee fetch salary
router.get("/:userId", getSalary);

module.exports = router;