

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-100 via-white to-green-100">
      <h1 className="text-5xl font-bold mb-6 text-center text-blue-700">Welcome to Go-Tribes 🌍</h1>
      <p className="text-lg text-gray-700 mb-8 text-center">Your personalized travel planner. Create, save, and share your journeys!</p>
      <a href="/trip-planner" className="px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition">
        Plan My Trip
      </a>
    </main>
  );
}
