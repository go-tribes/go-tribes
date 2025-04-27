"use client";

import { useState } from "react";
import { auth } from "../../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Head from "next/head";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Registration Successful!");
      router.push("/trip-planner");
    } catch (error) {
      console.error(error);
      alert("Registration Failed: " + error.message);
    }
  };

  return (
    <>
      <Head>
        <title>Create Account - Go-Tribes</title>
        <meta name="description" content="Start planning your dream adventures today with Go-Tribes." />
      </Head>

      <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-100">
        <h1 className="text-4xl font-bold mb-8">Register</h1>

        <form onSubmit={handleRegister} className="flex flex-col space-y-4 w-full max-w-md">
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
            className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Register
          </button>
        </form>

        <div className="mt-6 text-gray-700">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-blue-600 underline hover:text-blue-800"
          >
            Login here
          </button>
        </div>
      </main>
    </>
  );
}
