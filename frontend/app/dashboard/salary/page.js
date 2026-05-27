"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signupUser } from "@/services/api";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    field: "Frontend Developer",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fields = [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Mobile App Developer",
    "Embedded Systems Developer",
    "DevOps Engineer",
    "UI/UX Designer",
    "QA Engineer",
    "Data Scientist",
    "Project Manager",
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signupUser(form);

      if (res.user) {
        alert("Signup successful! 🎉 Please login with your credentials.");
        router.push("/login");
      } else {
        setError(res.message || "Signup failed. Please try again.");
      }
    } catch (err) {
      setError("Signup failed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-indigo-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-3xl flex items-center justify-center shadow-2xl mb-6">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">➕</span>
            </div>
          </div>
          <h2 className="text-4xl font-black bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Create Account
          </h2>
          <p className="text-gray-600 text-lg">Join our team today</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 border border-white/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-emerald-500">👤</span>
                Full Name
              </label>
              <input
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 text-lg placeholder-gray-400"
              />
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-emerald-500">📧</span>
                Email Address
              </label>
              <input
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 text-lg placeholder-gray-400"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-emerald-500">🔒</span>
                Password
              </label>
              <input
                name="password"
                type="password"
                placeholder="Create a strong password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 text-lg placeholder-gray-400"
              />
            </div>

            {/* Field Select */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-emerald-500">💼</span>
                Field of Expertise
              </label>
              <select
                name="field"
                value={form.field}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 text-lg appearance-none cursor-pointer"
              >
                {fields.map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Select */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-emerald-500">🎭</span>
                Role
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 text-lg appearance-none cursor-pointer"
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
                <span>⚠️</span>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500 text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <a href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}