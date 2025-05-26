// components/AuthLayout.tsx
export default function AuthLayout({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-white">
        <div className="p-8 max-w-sm w-full bg-white shadow-md rounded-xl">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">{title}</h1>
          {children}
        </div>
      </div>
    );
  }
  