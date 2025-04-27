"use client";

import { useState } from "react";
import { auth } from "../../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Head from "next/head";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login Successful!");
      router.push("/trip-planner");
    } catch (error) {
      console.error(error);
      alert("Login Failed: " + error.message);
    }
  };

  return (
    <>
      <Head>
        <title>Login to Go-Tribes</title>
        <meta name="description" content="Access your travel planning account at Go-Tribes." />
      </Head>

      <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-100">
        <h1 className="text-4xl font-bold mb-8">Login</h1>

        <form onSubmit={handleLogin} className="flex flex-col space-y-4 w-full max-w-md">
          <input
            type="email"
            placeholder="Email"
            className="p-3 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="p-3 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Login
          </button>
        </form>

        <div className="mt-6 text-gray-700">
          Don&apos;t have an account?{" "}
          <button
            onClick={() => router.push("/register")}
            className="text-blue-600 underline hover:text-blue-800"
          >
            Register here
          </button>
        </div>
      </main>
    </>
  );
}
