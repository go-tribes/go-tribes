"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase"; // or use "@/firebase" if alias works

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [tribeName, setTribeName] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        displayName: name,
        bio,
        tribeName,
        tribeRank: "Newbie",
        profileImage: "",
        sharedTrips: 0,
      });
      router.push("/profile")
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-yellow-50 text-gray-800 px-4">
      <div className="max-w-sm w-full bg-white p-6 rounded-xl shadow-sm border border-yellow-200">
        <h1 className="text-xl font-semibold text-center mb-4 text-yellow-600 tracking-tight">
          Create Your Tribe Account
        </h1>

        {error && (
          <p className="text-red-500 text-xs mb-3 text-center">{error}</p>
        )}

        <form onSubmit={handleRegister} className="space-y-3 text-sm">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-1.5 border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
          />
          <input
            type="text"
            placeholder="Short Bio (optional)"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3 py-1.5 border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
          />
          <input
            type="text"
            placeholder="Your Tribe Name (optional)"
            value={tribeName}
            onChange={(e) => setTribeName(e.target.value)}
            className="w-full px-3 py-1.5 border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-1.5 border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-1.5 border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
          />
          <button
            type="submit"
            className="w-full py-1.5 bg-yellow-500 text-white font-medium rounded hover:bg-yellow-600 transition text-sm"
          >
            Register
          </button>
        </form>

        <div className="mt-3 text-center text-xs text-gray-500">
          Don&apos;t have an account?{" "}
          <a
            href="/login"
            className="text-yellow-600 font-medium hover:underline"
          >
            Login
          </a>
        </div>
      </div>
    </div>
  );
}
