const express = require("express");
const router = express.Router();
const {
  createTask, getEmployeeTasks, updateTaskStatus, getAllTasks, deleteTask
} = require("../controllers/taskController");

router.post("/", createTask);
router.get("/", getAllTasks);
router.delete("/:id", deleteTask);
router.get("/employee/:userId", getEmployeeTasks);
router.put("/:id/status", updateTaskStatus);

module.exports = router;