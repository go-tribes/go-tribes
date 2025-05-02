"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

function AuthLayout({ isLogin }: { isLogin: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [tribeName, setTribeName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/dashboard");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
          displayName: name,
          bio,
          tribeName,
          tribeRank: "Newbie",
          profileImage: "",
          sharedTrips: 0,
        });
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-yellow-50 text-gray-800 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-xl border border-yellow-200">
        <h1 className="text-3xl font-bold text-center mb-6 text-yellow-600">
          {isLogin ? "Login to Go-Tribes" : "Create Your Tribe Account"}
        </h1>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <input
                type="text"
                placeholder="Short Bio (optional)"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-2 border rounded border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <input
                type="text"
                placeholder="Your Tribe Name (optional)"
                value={tribeName}
                onChange={(e) => setTribeName(e.target.value)}
                className="w-full px-4 py-2 border rounded border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <button
            type="submit"
            className="w-full py-2 bg-yellow-500 text-white font-semibold rounded hover:bg-yellow-600 transition"
          >
            {isLogin ? "Login" : "Register"}
          </button>
        </form>
        <div className="mt-4 text-center">
          {isLogin ? (
            <p>
              Don't have an account? <a href="/register" className="text-yellow-600 font-semibold hover:underline">Register</a>
            </p>
          ) : (
            <p>
              Already have an account? <a href="/login" className="text-yellow-600 font-semibold hover:underline">Login</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  return <AuthLayout isLogin={true} />;
}

export function RegisterPage() {
  return <AuthLayout isLogin={false} />;
}
