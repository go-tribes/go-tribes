"use client";

import Head from "next/head";

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Go-Tribes | Your Personal Travel Planner</title>
        <meta name="description" content="Go-Tribes helps you personalize, plan, and organize your dream adventures easily and smartly." />
      </Head>

      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-white via-green-100 to-blue-100">
        <h1 className="text-5xl font-bold text-green-700 mb-6">Welcome to Go-Tribes! 🌍</h1>
        <p className="text-xl text-gray-600 max-w-2xl text-center">
          Plan your next trip, save your adventures, and make unforgettable memories with Go-Tribes.
        </p>

        <a
          href="/login"
          className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Get Started
        </a>
      </main>
    </>
  );
}
