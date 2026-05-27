"use client";

import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleBack = () => {
    const stored = localStorage.getItem("user");
    if (!stored) return router.push("/login");
  
    const user = JSON.parse(stored);
  
    if (user.role === "admin") {
      router.push("/dashboard/admin");
    } else {
      router.push("/dashboard/employees");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex justify-center items-center">
      
      <div className="bg-white p-6 rounded-2xl shadow w-full max-w-md">

        <h2 className="text-2xl font-bold mb-4 text-center">My Profile</h2>

        <div className="space-y-3">
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>User ID:</strong> {user?.id}</p>
        </div>

        <button
          onClick={handleBack}
          className="mt-6 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
        >
          Back to Dashboard
        </button>

      </div>

    </div>
  );
}