const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Task = sequelize.define('Task', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  assignedTo: { type: DataTypes.INTEGER, allowNull: false },
  assignedBy: { type: DataTypes.INTEGER, allowNull: false },
  status: { 
    type: DataTypes.ENUM('pending', 'in_progress', 'completed'), 
    defaultValue: 'pending' 
  },
  dueDate: { type: DataTypes.DATE, allowNull: true },
  priority: { 
    type: DataTypes.ENUM('low', 'medium', 'high'), 
    defaultValue: 'medium' 
  },
}, { tableName: 'tasks', timestamps: true });

Task.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
Task.belongsTo(User, { foreignKey: 'assignedBy', as: 'assigner' });

module.exports = Task;