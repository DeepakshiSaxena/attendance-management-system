const Task = require("../models/tasks");
const User = require("../models/User");

const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, dueDate, priority } = req.body;
    const task = await Task.create({
      title, description: description || null, assignedTo: parseInt(assignedTo),
      assignedBy: req.user?.id || 1, dueDate: dueDate || null, priority: priority || 'medium'
    });
    res.status(201).json({ message: "Task created ✅", task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getEmployeeTasks = async (req, res) => {
  try {
    const { userId } = req.params;
    const tasks = await Task.findAll({ 
      where: { assignedTo: parseInt(userId) },
      order: [['dueDate', 'ASC']]
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    task.status = status;
    await task.save();
    res.json({ message: "Status updated ✅", task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    await Task.destroy({ where: { id } });
    res.json({ message: "Task deleted ✅" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createTask, getEmployeeTasks, updateTaskStatus, getAllTasks, deleteTask };