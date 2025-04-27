"use client";

import Head from "next/head";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <Head>
        {/* SEO Title and Description */}
        <title>Go-Tribes | Plan Your Perfect Adventures</title>
        <meta name="description" content="Create personalized travel plans, save trips, and explore the world with Go-Tribes!" />

        {/* Open Graph (OG) Tags */}
        <meta property="og:title" content="Go-Tribes | Plan Your Perfect Adventures" />
        <meta property="og:description" content="Create personalized travel plans, save trips, and explore the world with Go-Tribes!" />
        <meta property="og:image" content="https://go-tribes.com/og-image.jpg?v=2" />
        <meta property="og:url" content="https://go-tribes.com?v=2" />
        <meta property="og:type" content="website" />

        {/* Twitter Card Tags (optional but recommended) */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Go-Tribes | Plan Your Perfect Adventures" />
        <meta name="twitter:description" content="Create personalized travel plans, save trips, and explore the world with Go-Tribes!" />
        <meta name="twitter:image" content="https://go-tribes.com/og-image.jpg" />
      </Head>

      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-white via-green-100 to-blue-100">
        <h1 className="text-5xl font-bold text-green-700 mb-6 text-center">Welcome to Go-Tribes! 🌍</h1>
        <p className="text-xl text-gray-600 max-w-2xl text-center mb-8">
          Create, save, and organize your dream adventures easily with Go-Tribes — your personalized travel planner.
        </p>

        <Link
          href="/login"
          className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Get Started
        </Link>
      </main>
    </>
  );
}
