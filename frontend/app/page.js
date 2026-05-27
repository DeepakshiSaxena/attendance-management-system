"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white flex items-center justify-center">

      <div className="bg-gray-900 p-10 rounded-2xl shadow-2xl text-center w-[400px]">

        {/* Heading */}
        <h1 className="text-3xl font-bold mb-2">
          Attendance System 🚀
        </h1>

        <p className="text-gray-400 mb-8 text-sm">
          Track employee attendance, leaves & work logs easily
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-4">

          <button
            onClick={() => router.push("/login")}
            className="bg-green-500 hover:bg-green-600 transition p-3 rounded font-semibold"
          >
            Login
          </button>

          <button
            onClick={() => router.push("/signup")}
            className="bg-blue-500 hover:bg-blue-600 transition p-3 rounded font-semibold"
          >
            Signup
          </button>

        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 mt-6">
          Manage attendance • Track leaves • Smart dashboard
        </p>

      </div>

    </div>
  );
}