"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  getAllUsers,
  getAllAttendance,
  setSalary,
  getSalary,
  createTask,
  getAllTasks,
} from "@/services/api";

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [admin, setAdmin] = useState(null);

  // 🔥 ATTENDANCE STATES
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [monthlyStats, setMonthlyStats] = useState({
    totalUsers: 0,
    presentDays: 0,
    halfDayDays: 0,
    absentDays: 0,
    workingDays: 0,
  });
  const [dailyStats, setDailyStats] = useState({
    totalUsers: 0,
    present: 0,
    halfDay: 0,
    absent: 0,
  });
  const [monthlyChartData, setMonthlyChartData] = useState([]);
  const [dailyChartData, setDailyChartData] = useState([]);

  // 🔥 TASK STATES
  const [allTasks, setAllTasks] = useState([]);
  const [newTask, setNewTask] = useState({ 
    title: "", 
    description: "", 
    assignedTo: "", 
    priority: "medium",
    deadline: ""
  });
  const [search, setSearch] = useState("");
  const [showTaskForm, setShowTaskForm] = useState(false);

  // 🔥 SALARY STATES
  const [salaryData, setSalaryData] = useState({});
  const [salaryInputs, setSalaryInputs] = useState({});

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setAdmin(JSON.parse(stored));
  }, []);

  // 🔥 FETCH ALL DATA
  const fetchAllData = useCallback(async () => {
    if (!admin) return;

    try {
      const [usersData, attendanceData, tasksData] = await Promise.all([
        getAllUsers(),
        getAllAttendance(),
        getAllTasks(),
      ]);

      const employeesOnly = usersData.filter((user) => user.role !== "admin");
      setUsers(employeesOnly);
      setAttendance(attendanceData);
      setAllTasks(tasksData || []);

      calculateDailyStats(employeesOnly, attendanceData);
      calculateMonthlyStats(employeesOnly, attendanceData, selectedMonth);

      // Preload salaries
      employeesOnly.forEach(async (user) => {
        try {
          const data = await getSalary(user.id);
          setSalaryData((prev) => ({ ...prev, [user.id]: data }));
        } catch (error) {
          console.log(`No salary data for ${user.name}`);
        }
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [admin, selectedMonth]);

  // 🔥 TASK HANDLERS
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.assignedTo) return alert("Please fill title and assignee");

    try {
      await createTask({
        ...newTask,
        status: "pending",
        createdBy: admin.id,
        createdAt: new Date().toISOString(),
      });
      setNewTask({ title: "", description: "", assignedTo: "", priority: "medium", deadline: "" });
      setShowTaskForm(false);
      fetchAllData();
      alert("Task created successfully! ✅");
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task");
    }
  };

  // 🔥 ATTENDANCE CALCULATIONS
  const calculateDailyStats = (employees, attData) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayAttendance = attData.filter(a => a.date === today);
    
    const uniqueAttendance = Array.from(new Map(todayAttendance.map(a => [a.userId, a])).values());
    let present = 0, halfDay = 0;
    const presentIds = new Set();

    uniqueAttendance.forEach(a => {
      presentIds.add(a.userId);
      if (a.status === "Present") present++;
      else if (a.status === "HalfDay") halfDay++;
    });

    const absent = employees.length - presentIds.size;

    setDailyStats({ totalUsers: employees.length, present, halfDay, absent });
    setDailyChartData([
      { name: "Present", value: present },
      { name: "Half Day", value: halfDay },
      { name: "Absent", value: absent },
    ]);
  };

  const calculateMonthlyStats = (employees, attData, monthDate) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const workingDays = calculateWorkingDays(monthStart, monthEnd);

    const monthlyAttendance = {};
    employees.forEach(emp => {
      monthlyAttendance[emp.id] = { present: 0, halfDay: 0, absent: 0, total: 0 };
    });

    attData.forEach(record => {
      const recordDate = new Date(record.date);
      if (recordDate >= monthStart && recordDate <= monthEnd) {
        const userStats = monthlyAttendance[record.userId];
        if (userStats) {
          userStats.total++;
          if (record.status === "Present") userStats.present++;
          else if (record.status === "HalfDay") userStats.halfDay++;
          else userStats.absent++;
        }
      }
    });

    let totalPresentDays = 0, totalHalfDayDays = 0, totalAbsentDays = 0;
    employees.forEach(emp => {
      const stats = monthlyAttendance[emp.id];
      totalPresentDays += stats.present;
      totalHalfDayDays += stats.halfDay;
      totalAbsentDays += stats.absent;
    });

    const stats = {
      totalUsers: employees.length,
      presentDays: totalPresentDays,
      halfDayDays: totalHalfDayDays,
      absentDays: totalAbsentDays,
      workingDays,
      avgAttendance: employees.length > 0 && workingDays > 0
        ? ((totalPresentDays / (employees.length * workingDays)) * 100).toFixed(1)
        : "0.0",
    };

    setMonthlyStats(stats);
    setMonthlyChartData(generateMonthlyChartData(monthStart, monthEnd, monthlyAttendance, employees));
  };

  const calculateWorkingDays = (start, end) => {
    let count = 0;
    let current = new Date(start);
    while (current <= end) {
      if (current.getDay() !== 0 && current.getDay() !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const generateMonthlyChartData = (monthStart, monthEnd, monthlyAttendance, employees) => {
    const data = [];
    let current = new Date(monthStart);
    
    while (current <= monthEnd) {
      const dayName = format(current, 'MMM dd');
      const isWeekend = current.getDay() === 0 || current.getDay() === 6;
      let presentCount = 0;
      
      employees.forEach(emp => {
        if (monthlyAttendance[emp.id]?.present > 0) presentCount++;
      });

      data.push({
        day: dayName,
        present: isWeekend ? 0 : presentCount,
        absent: isWeekend ? 0 : (employees.length - presentCount),
      });
      current.setDate(current.getDate() + 1);
    }
    return data;
  };

  // 🔥 UTILITY FUNCTIONS
  const calculateMonthlySalary = (userId) => {
    const userSalaryData = salaryData[userId];
    if (!userSalaryData?.salaryPerMonth) return { totalSalary: "0.00" };

    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const userAttendance = attendance.filter(a => 
      a.userId === userId && 
      new Date(a.date) >= monthStart && 
      new Date(a.date) <= monthEnd
    );

    let presentDays = 0, halfDayDays = 0;
    userAttendance.forEach(record => {
      if (record.status === "Present") presentDays++;
      if (record.status === "HalfDay") halfDayDays++;
    });

    const perDaySalary = userSalaryData.salaryPerMonth / 26;
    const totalSalary = (presentDays * perDaySalary) + (halfDayDays * perDaySalary * 0.5);
    
    return { totalSalary: totalSalary.toFixed(2) };
  };

  const getUserMonthlyStats = (userId) => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    
    const userAttendance = attendance.filter(a => 
      a.userId === userId && 
      new Date(a.date) >= monthStart && 
      new Date(a.date) <= monthEnd
    );
  
    const workingDays = calculateWorkingDays(monthStart, monthEnd);
    let presentDays = 0, halfDayDays = 0, absentDays = 0; // 🔥 absentDays add kiya
    
    userAttendance.forEach(record => {
      if (record.status === "Present") presentDays++;
      else if (record.status === "HalfDay") halfDayDays++;
      else if (record.status === "Absent") absentDays++; // 🔥 Explicit Absent count only
    });
  
    const totalDays = userAttendance.length; // 🔥 Actual attendance records
    const attendancePct = workingDays > 0 ? ((presentDays / workingDays) * 100).toFixed(1) : "0.0";
  
    return { presentDays, halfDayDays, absentDays, totalDays, attendancePct }; // 🔥 absentDays return kiya
  };
  
  const handleSalaryChange = (userId, value) => {
    setSalaryInputs(prev => ({ ...prev, [userId]: value }));
  };

  const handleSetSalary = async (userId) => {
    const salary = parseFloat(salaryInputs[userId]);
    if (isNaN(salary)) return alert("Please enter valid salary");

    try {
      await setSalary(userId, { salaryPerMonth: salary });
      alert("Salary updated successfully!");
      fetchAllData();
    } catch (error) {
      console.error("Error setting salary:", error);
      alert("Failed to update salary");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
  };

  // Filter tasks
  const filteredTasks = allTasks.filter(task =>
    task.title.toLowerCase().includes(search.toLowerCase()) ||
    users.find(u => u.id === task.assignedTo)?.name?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* 🔥 HEADER */}
      <div className="flex justify-between items-center mb-8 bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50">
        <div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 font-semibold">Manage attendance, salary & tasks</p>
        </div>
        <button 
          onClick={handleLogout} 
          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2"
        >
          🚪 Logout
        </button>
      </div>

      {/* 🔥 MONTH SELECTOR */}
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl mb-8 border border-white/50">
        <label className="block text-lg font-semibold text-gray-800 mb-4">
          📅 Select Month for Reports
        </label>
        <input
          type="month"
          value={format(selectedMonth, 'yyyy-MM')}
          onChange={(e) => setSelectedMonth(new Date(e.target.value + '-01'))}
          className="w-64 p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-xl bg-white shadow-lg"
        />
      </div>

      {/* 🔥 STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Employees" value={users.length} color="blue" icon="👥" />
        <StatCard title="Today Present" value={dailyStats.present} color="green" icon="✅" />
        <StatCard title="Today Absent" value={dailyStats.absent} color="red" icon="❌" />
        <StatCard title="Today Half Day" value={dailyStats.halfDay} color="yellow" icon="⏰" />
      </div>

      {/* 🔥 QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Task Create Form */}
        <div className="lg:col-span-1 bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/50">
          <button
            onClick={() => setShowTaskForm(!showTaskForm)}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white p-4 rounded-2xl font-bold mb-4 hover:shadow-xl transition-all"
          >
            {showTaskForm ? '✕ Hide Form' : '➕ Assign New Task'}
          </button>
          
          {showTaskForm && (
            <form onSubmit={handleCreateTask} className="space-y-3">
              <input
                name="title"
                placeholder="Task Title"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                required
              />
              <select
                value={newTask.assignedTo}
                onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Assign to...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
              <input
                             name="description"
                             placeholder="Task Description"
                             value={newTask.description}
                             onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                             className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                           />
                           <select
                             value={newTask.priority}
                             onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                             className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                           >
                             <option value="low">🟢 Low</option>
                             <option value="medium">🟡 Medium</option>
                             <option value="high">🔴 High</option>
                           </select>
                           <input
                             type="date"
                             name="deadline"
                             placeholder="Deadline"
                             value={newTask.deadline}
                             onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                             className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                           />
                           <button
                             type="submit"
                             className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white p-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all"
                           >
                             🚀 Create Task
                           </button>
                         </form>
                         )}
                       </div>
               
                       {/* Charts */}
                       <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
                         <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/50">
                           <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                             📈 Today's Attendance
                           </h3>
                           <ResponsiveContainer height={300}>
                             <BarChart data={dailyChartData}>
                               <XAxis dataKey="name" />
                               <YAxis />
                               <Tooltip />
                               <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                             </BarChart>
                           </ResponsiveContainer>
                         </div>
               
                         <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/50">
                           <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                             📅 {format(selectedMonth, 'MMM yyyy')} Trend
                           </h3>
                           <ResponsiveContainer height={300}>
                             <LineChart data={monthlyChartData}>
                               <XAxis dataKey="day" />
                               <YAxis />
                               <Tooltip />
                               <Line 
                                 type="monotone" 
                                 dataKey="present" 
                                 stroke="#10B981" 
                                 strokeWidth={4} 
                                 dot={{ fill: '#10B981', strokeWidth: 2 }}
                               />
                             </LineChart>
                           </ResponsiveContainer>
                         </div>
                       </div>
                     </div>
               
                     {/* 🔥 MONTHLY STATS & ATTENDANCE TABLE */}
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                       {/* Monthly Stats */}
                       <div className="bg-gradient-to-br from-emerald-50 to-green-100 p-8 rounded-3xl shadow-2xl border">
                         <h3 className="text-2xl font-bold text-emerald-800 mb-8 flex items-center gap-3">
                           📊 {format(selectedMonth, 'MMM yyyy')} Summary
                           <span className="text-sm bg-emerald-200 px-3 py-1 rounded-full">
                             {monthlyStats.workingDays} working days
                           </span>
                         </h3>
                         <div className="grid grid-cols-2 gap-6">
                           <StatCard title="Present Days" value={monthlyStats.presentDays} color="green" />
                           <StatCard title="Half Days" value={monthlyStats.halfDayDays} color="yellow" />
                           <StatCard title="Absent Days" value={monthlyStats.absentDays} color="red" />
                           <StatCard title="Avg Attendance" value={`${monthlyStats.avgAttendance}%`} color="blue" />
                         </div>
                       </div>
               
                       {/* ATTENDANCE TABLE */}
                       <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
                         <div className="p-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                           <h2 className="text-2xl font-black flex items-center gap-3">
                             📋 Monthly Attendance Table
                           </h2>
                         </div>
                         <div className="overflow-x-auto">
                           <table className="w-full">
                             <thead className="bg-gray-50">
                               <tr>
                                 <th className="p-4 text-left font-black">Employee</th>
                                 <th className="p-4 text-center font-black">Present</th>
                                 <th className="p-4 text-center font-black">Half</th>
                                 <th className="p-4 text-center font-black">Absent</th>
                                 <th className="p-4 text-center font-black">Total</th>
                                 <th className="p-4 text-center font-black">%</th>
                                 <th className="p-4 text-right font-black">Salary</th>
                               </tr>
                             </thead>
                             <tbody> 
                               {users.slice(0, 5).map((user) => { // Show top 5
                                 const salaryCalc = calculateMonthlySalary(user.id);
                                 const userStats = getUserMonthlyStats(user.id);
                                 
                                 return (
                                   <tr key={user.id} className="border-t hover:bg-gray-50 transition-colors">
                                     <td className="p-4 font-semibold">
                                       <div className="flex items-center gap-3">
                                         <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                                           {user.name?.charAt(0)?.toUpperCase()}
                                         </div>
                                         <span>{user.name}</span>
                                       </div>
                                     </td>
                                     <td className="p-4 text-center font-bold text-green-600">{userStats.presentDays}</td>
                                     <td className="p-4 text-center font-bold text-yellow-600">{userStats.halfDayDays}</td>
                                     <td className="p-4 text-center font-bold text-red-600">{userStats.absentDays}</td>
                                     <td className="p-4 text-center font-bold text-gray-800">{userStats.totalDays}</td>
                                     <td className="p-4 text-center">
                                       <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-sm font-bold">
                                         {userStats.attendancePct}%
                                       </span>
                                     </td>
                                     <td className="p-4 text-right">
                                       <div className="flex items-center justify-end gap-2">
                                         <span className="text-2xl font-black text-emerald-600">
                                           ₹{salaryCalc.totalSalary}
                                         </span>
                                         <button
                                           onClick={() => handleSetSalary(user.id, salaryInputs[user.id] || salaryData[user.id]?.salaryPerMonth || 0)}
                                           className="text-xs bg-emerald-500 text-white px-3 py-1 rounded-lg hover:bg-emerald-600"
                                         >
                                           Update
                                         </button>
                                       </div>
                                     </td>
                                   </tr>
                                 );
                               })}
                             </tbody>
                           </table>
                         </div>
                       </div>
                     </div>
               
                     {/* 🔥 TASKS SECTION */}
                     <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
                       <div className="p-8 bg-gradient-to-r from-orange-500 to-red-600 text-white">
                         <div className="flex justify-between items-center">
                           <h2 className="text-2xl font-black flex items-center gap-3">
                             📝 All Tasks ({filteredTasks.length})
                           </h2>
                           <div className="flex items-center gap-3">
                             <input
                               type="text"
                               placeholder="Search tasks..."
                               value={search}
                               onChange={(e) => setSearch(e.target.value)}
                               className="px-4 py-2 rounded-xl bg-white/20 text-white placeholder-white/70 w-64 focus:outline-none focus:ring-2 focus:ring-white/50"
                             />
                           </div>
                         </div>
                       </div>
                       
                       <div className="overflow-x-auto">
                         <div className="p-6">
                           {filteredTasks.length === 0 ? (
                             <div className="text-center py-16 text-gray-500">
                               <div className="text-6xl mb-4">📭</div>
                               <h3 className="text-2xl font-bold mb-2">No tasks found</h3>
                               <p>Create your first task above!</p>
                             </div>
                           ) : (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                               {filteredTasks.map((task) => {
                                 const assignee = users.find(u => u.id === task.assignedTo);
                                 const priorityColors = {
                                   low: 'border-green-300 bg-green-50',
                                   medium: 'border-yellow-300 bg-yellow-50',
                                   high: 'border-red-300 bg-red-50'
                                 };
                                 
                                 return (
                                   <div key={task.id} className={`border-2 ${priorityColors[task.priority]} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all group`}>
                                     <div className="flex justify-between items-start mb-4">
                                       <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                         task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                         task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                         'bg-green-100 text-green-800'
                                       }`}>
                                         {task.priority.toUpperCase()}
                                       </div>
                                       <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                         task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                         task.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                                         'bg-blue-100 text-blue-800'
                                       }`}>
                                         {task.status}
                                       </span>
                                     </div>
                                     
                                     <h4 className="font-bold text-xl mb-2 line-clamp-2">{task.title}</h4>
                                     <p className="text-gray-600 mb-4 line-clamp-2">{task.description}</p>
                                     
                                     <div className="flex justify-between items-center mb-4">
                                       <div className="flex items-center gap-2">
                                         <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                           {assignee?.name?.charAt(0)?.toUpperCase()}
                                         </div>
                                         <span className="font-semibold">{assignee?.name}</span>
                                       </div>
                                       {task.deadline && (
                                         <span className="text-sm text-gray-500">
                                           📅 {new Date(task.deadline).toLocaleDateString()}
                                         </span>
                                       )}
                                     </div>
                                     
                                     <div className="flex gap-2">
                                       <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-xl text-sm font-semibold transition-all">
                                         Edit
                                       </button>
                                       <button className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-xl text-sm font-semibold transition-all">
                                         Delete
                                       </button>
                                     </div>
                                   </div>
                                 );
                               })}
                             </div>
                           )}
                         </div>
                       </div>
                     </div>
                   </div>
                 );
               }
               
               // 🔥 StatCard Component
               function StatCard({ title, value, color, icon = "" }) {
                 const colors = {
                   blue: 'bg-blue-100 text-blue-800',
                   green: 'bg-green-100 text-green-800',
                   yellow: 'bg-yellow-100 text-yellow-800',
                   red: 'bg-red-100 text-red-800',
                   orange: 'bg-orange-100 text-orange-800',
                   purple: 'bg-purple-100 text-purple-800'
                 };
               
                 return (
                   <div className={`p-8 rounded-3xl ${colors[color] || 'bg-gray-100 text-gray-800'} shadow-xl hover:shadow-2xl transition-all duration-300 group hover:scale-[1.02]`}>
                     <div className="flex items-center justify-between mb-4">
                       <div className="text-3xl">{icon}</div>
                       <div className="w-2 h-2 bg-gradient-to-r from-transparent via-white to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     </div>
                     <p className="text-lg font-semibold opacity-80 mb-2">{title}</p>
                     <p className="text-4xl font-black">{value || 0}</p>
                   </div>
                 );
               }