"use client";

import { useState, useEffect } from "react";
import {
  punchIn,
  punchOut,
  getTodayStatus,
  getSalary,           // This will now return salary breakdown
  getAttendanceHistory,
  getEmployeeTasks,
  updateTaskStatus,
} from "@/services/api";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function EmployeeDashboard() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Loading...");
  const [attendance, setAttendance] = useState(null);
  const [user, setUser] = useState(null);
  const [salary, setSalary] = useState(null);
  const [history, setHistory] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const userId = user?.id;

  // 🆕 Enhanced fetchData with salary breakdown
  const fetchData = async () => {
    if (!userId) return;

    try {
      const [todayRes, salRes, historyRes, tasksRes] = await Promise.all([
        getTodayStatus(userId),
        getSalary(userId),           // Now returns detailed salary info
        getAttendanceHistory(userId),
        getEmployeeTasks(userId),
      ]);

      setAttendance(todayRes);
      setStatus(todayRes.status ?? "Not Marked");
      setSalary(salRes);
      setHistory(historyRes || []);
      setTasks(tasksRes || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setHistory([]);
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const goToProfile = () => {
    router.push("/dashboard/profile");
  };

  const handlePunchIn = async () => {
    setLoading(true);
    try {
      const res = await punchIn(userId);
      alert(res.message);
      await fetchData();
    } catch (error) {
      alert("Punch In failed!");
    }
    setLoading(false);
  };

  const handlePunchOut = async () => {
    setLoading(true);
    try {
      const res = await punchOut(userId);
      alert(res.message);
      await fetchData();
    } catch (error) {
      alert("Punch Out failed!");
    }
    setLoading(false);
  };

  const toggleTaskStatus = async (taskId, currentStatus) => {
    try {
      let newStatus;
      if (currentStatus === 'completed') newStatus = 'pending';
      else if (currentStatus === 'in_progress') newStatus = 'completed';
      else newStatus = 'in_progress';

      await updateTaskStatus(taskId, newStatus);
      await fetchData();
      alert(`Task updated to ${newStatus.replace('_', ' ')}! ✅`);
    } catch (error) {
      alert("Failed to update task status!");
    }
  };

  // 🆕 Calculate productivity score with Half Day logic
  const productivityScore = (() => {
    if (status === "Present") {
      return 100 - (attendance?.lateMinutes || 0);
    } else if (status === "HalfDay") {
      return 50;
    }
    return 0;
  })();

  // 🆕 Enhanced salary display with breakdown
  const getSalaryDisplay = () => {
    if (!salary) return { total: 0, breakdown: {} };

    const { totalSalary, fullDays, halfDays, dailyRate } = salary;
    
    return {
      total: totalSalary || 0,
      breakdown: {
        fullDays: fullDays || 0,
        halfDays: halfDays || 0,
        dailyRate: dailyRate || 0,
        fullDayAmount: (fullDays * dailyRate).toFixed(0),
        halfDayAmount: (halfDays * dailyRate * 0.5).toFixed(0),
      }
    };
  };

  const salaryDisplay = getSalaryDisplay();
  const getStatusColor = (taskStatus) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      pending: 'bg-gray-100 text-gray-800',
    };
    return colors[taskStatus] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* NAVBAR */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow">
        <h1 className="text-3xl font-bold text-gray-800">Employee Dashboard</h1>
        <div className="flex gap-3">
          <button 
            onClick={goToProfile} 
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-all"
          >
            Profile
          </button>
          <button 
            onClick={handleLogout} 
            className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg transition-all"
          >
            Logout
          </button>
        </div>
      </div>

      {/* 🔥 TOP CARDS - Enhanced with Half Day info */}
      <div className="grid md:grid-cols-4 gap-6 mb-6">
        <Card title="Today Status" value={status} color="blue" />
        <Card title="Late Minutes" value={attendance?.lateMinutes || 0} color="orange" />
        <Card 
          title="Full Days" 
          value={salaryDisplay.breakdown.fullDays} 
          color="green"
          subtitle={`₹${salaryDisplay.breakdown.fullDayAmount}`}
        />
        <Card 
          title="Half Days" 
          value={salaryDisplay.breakdown.halfDays} 
          color="yellow"
          subtitle={`₹${salaryDisplay.breakdown.halfDayAmount}`}
        />
      </div>

      {/* 🔥 TOTAL EARNED CARD */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-2xl shadow-xl mb-6 border-4 border-green-200">
        <div className="text-center">
          <h2 className="text-4xl font-black text-green-800 mb-2">💰 Total Earned</h2>
          <div className="text-5xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            ₹{salaryDisplay.total.toLocaleString()}
          </div>
          <div className="text-sm text-green-700 font-medium">
            Full: {salaryDisplay.breakdown.fullDays} days | Half: {salaryDisplay.breakdown.halfDays} days
          </div>
        </div>
      </div>

      {/* 🔥 PRODUCTIVITY GRAPH */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-6">
        <h2 className="font-bold text-xl mb-4 text-gray-800">📈 Productivity Trend</h2>
        {history.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={history}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3B82F6" 
                  strokeWidth={4}
                  dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 flex items-center justify-center bg-gray-50 rounded-xl">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <p>No attendance history yet</p>
              <p className="text-sm">Punch in daily to see trends!</p>
            </div>
          </div>
        )}
      </div>

      {/* 🔥 ATTENDANCE HISTORY - Enhanced with salary info */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-6">
        <h2 className="font-bold text-xl mb-4 text-gray-800">📋 Attendance History</h2>
        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left font-medium">Day</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-right font-medium">Score</th>
                  <th className="p-3 text-right font-medium">Earnings</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => {
                  const dailyEarning = h.status === 'HalfDay' 
                    ? (salaryDisplay.breakdown.dailyRate * 0.5).toFixed(0)
                    : salaryDisplay.breakdown.dailyRate.toFixed(0);
                  
                  return (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-semibold">{h.day}</td>
                      <td>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          h.status === 'Present' ? 'bg-green-100 text-green-800' :
                          h.status === 'HalfDay' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {h.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-lg text-blue-600">
                        {h.score}%
                      </td>
                      <td className="p-3 text-right font-bold text-green-600">
                        ₹{dailyEarning}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="text-4xl mb-4 text-gray-400">📅</div>
            <p className="text-lg font-medium text-gray-600 mb-1">No attendance records</p>
            <p className="text-sm text-gray-500">Punch in today to start tracking!</p>
          </div>
        )}
      </div>

      {/* ASSIGNED TASKS */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-6">
        <h2 className="font-bold text-xl mb-6 text-gray-800 flex items-center">
          📋 Assigned Tasks 
          {loadingTasks && <div className="ml-2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
        </h2>
        
        {loadingTasks ? (
          <div className="text-center py-12 text-gray-500">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
            <div className="text-5xl mb-4 text-gray-300">📭</div>
            <p className="text-xl font-semibold text-gray-600 mb-2">No tasks assigned</p>
            <p className="text-gray-500">Check back later for new assignments!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all bg-gradient-to-r from-gray-50 to-white">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 text-lg">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                    <div className="flex gap-2 mt-2 text-xs text-gray-500">
                      {task.dueDate && (
                        <span>📅 Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      )}
                      <span>🎯 Priority: <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>{task.priority.toUpperCase()}</span></span>
                    </div>
                  </div>
                  
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                <div className="flex gap-2 pt-2 border-t">
                  <button
                    onClick={() => toggleTaskStatus(task.id, task.status)}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all text-sm ${
                      task.status === 'completed'
                        ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-md'
                    }`}
                  >
                    {task.status === 'completed' ? 'Undo' : 
                     task.status === 'in_progress' ? 'Mark Completed' : 'Start Task'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🔥 PUNCH BUTTONS */}
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
        <div className="text-2xl font-bold mb-4 text-gray-800">Today's Action</div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={handlePunchIn} 
            disabled={loading || status === "Present"}
            className={`px-8 py-4 rounded-2xl font-bold text-lg shadow-lg transform transition-all ${
              loading || status === "Present"
                ? 'bg-green-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:scale-105 text-white shadow-xl hover:shadow-2xl'
            }`}
          >
            {loading ? "⏳ Processing..." : "✅ Punch In"}
          </button>
          <button 
            onClick={handlePunchOut}
            disabled={loading || status !== "Present"}
            className={`px-8 py-4 rounded-2xl font-bold text-lg shadow-lg transform transition-all ${
              loading || status !== "Present"
                ? 'bg-red-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:scale-105 text-white shadow-xl hover:shadow-2xl'
            }`}
          >
            {loading ? "⏳ Processing..." : "🚪 Punch Out"}
          </button>
        </div>
      </div>
    </div>
  );
}

// 🔥 Enhanced Card Component with subtitle support
function Card({ title, value, color = "blue", subtitle }) {
  const colors = {
    blue: { bg: "bg-blue-50", text: "text-blue-800", ring: "ring-blue-200" },
    orange: { bg: "bg-orange-50", text: "text-orange-800", ring: "ring-orange-200" },
    green: { bg: "bg-green-50", text: "text-green-800", ring: "ring-green-200" },
    yellow: { bg: "bg-yellow-50", text: "text-yellow-800", ring: "ring-yellow-200" },
  };

  return (
    <div className={`bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border ${colors[color]?.bg || 'bg-gray-50'} ${colors[color]?.ring || 'ring-gray-200'}`}>
      <p className="text-sm font-medium uppercase tracking-wide opacity-80">{title}</p>
      <h2 className={`text-3xl font-black mt-2 ${colors[color]?.text || 'text-gray-800'}`}>
        {value}
      </h2>
      {subtitle && (
        <p className="text-sm font-medium mt-1 opacity-90">{subtitle}</p>
      )}
    </div>
  );
}