import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useRouter } from "next/router";
import MainLayout from "../components/MainLayout";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful!");
      router.push('/home');
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-sm mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-4 text-center">Login to Go-Tribes</h1>
        <input
          type="email"
          className="w-full p-2 mb-3 border rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full p-2 mb-3 border rounded"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="bg-[#D9A531] text-white p-2 w-full rounded hover:bg-yellow-600"
          onClick={handleLogin}
        >
          Login
        </button>
        <div className="flex justify-between mt-4 text-sm text-blue-600">
          <button onClick={() => router.push("/signup")} className="hover:underline">
            Create Account
          </button>
          <button onClick={() => router.push("/reset-password")} className="hover:underline">
            Forgot Password?
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
