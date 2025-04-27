import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
      <h1 className="text-6xl font-bold text-red-600 mb-6">404</h1>
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Page Not Found</h2>
      <p className="text-gray-600 mb-8">Oops! The page you are looking for does not exist or has been moved.</p>

      <Link
        href="/"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Back to Home
      </Link>
    </main>
  );
}
