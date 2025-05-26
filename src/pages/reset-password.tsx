import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { useRouter } from "next/router";
import MainLayout from "../components/MainLayout";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleReset = async () => {
    setSuccess("");
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Reset email sent! Check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    }
  };

  return (
    <MainLayout>
      <div className="max-w-sm mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-4 text-center">Reset Your Password</h1>
        <input
          type="email"
          className="w-full p-2 mb-3 border rounded"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          onClick={handleReset}
          className="bg-[#D9A531] text-white w-full p-2 rounded hover:bg-yellow-600"
        >
          Send Reset Email
        </button>
        {success && <p className="text-green-600 text-sm mt-4">{success}</p>}
        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
        <button
          onClick={() => router.push("/login")}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Back to Login
        </button>
      </div>
    </MainLayout>
  );
}
