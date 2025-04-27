"use client";

import { useState } from "react";
import { auth, db } from "../../../firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Head from "next/head";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send Email Verification
      await sendEmailVerification(user);

      // Save user into Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        emailVerified: user.emailVerified,
        uid: user.uid,
        createdAt: new Date(),
      });

      alert("Registration successful! Please check your email to verify your account.");
      router.push("/login");
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
        {/* Registration Form Here */}
      </main>
    </>
  );
}
