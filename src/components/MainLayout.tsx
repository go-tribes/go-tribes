import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { auth } from "@/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { BsSun, BsMoon } from "react-icons/bs";
import Image from "next/image";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Sync theme with localStorage and <html> class
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("go-tribes-theme") || "light";
      setTheme(savedTheme === "dark" ? "dark" : "light");
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(savedTheme === "dark" ? "dark" : "light");
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    if (typeof window !== "undefined") {
      localStorage.setItem("go-tribes-theme", theme);
    }
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  // Theme toggle button
  const ThemeToggle = () => (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="text-xl p-2 rounded-full hover:bg-white/20 dark:hover:bg-zinc-800 transition-all ml-2"
      aria-label="Toggle dark mode"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      type="button"
    >
      {theme === "dark" ? <BsSun className="text-yellow-400" /> : <BsMoon className="text-zinc-700" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-gt-gray dark:bg-gt-dark transition-colors">
      {/* Always your yellow in light mode, black in dark mode */}
      <header
        style={{ background: theme === "dark" ? undefined : "#D9A531" }}
        className="shadow-sm p-4 flex justify-between items-center dark:bg-zinc-900"
      >
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/logo.png"
            alt="Go-Tribes Logo"
            width={40}
            height={40}
            className="rounded-full bg-white shadow"
            priority
          />
          <span
            className="
              text-xl font-extrabold tracking-wide
              text-zinc-900 group-hover:text-white transition
              dark:text-gt-primary dark:group-hover:text-yellow-300
            "
          >
            Go-Tribes
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <nav className="space-x-4">
            {!user ? (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-zinc-900 dark:text-gt-primary hover:text-white dark:hover:text-yellow-300 transition"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-semibold text-zinc-900 dark:text-gt-primary hover:text-white dark:hover:text-yellow-300 transition"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/home"
                  className="text-sm font-semibold text-zinc-900 dark:text-gt-primary hover:text-white dark:hover:text-yellow-300 transition"
                >
                  News
                </Link>
                <Link
                  href="/plan-trip"
                  className="text-sm font-semibold text-zinc-900 dark:text-gt-primary hover:text-white dark:hover:text-yellow-300 transition"
                >
                  Plan Trip
                </Link>
                <Link
                  href={`/profile/${user?.uid}`}
                  className="text-sm font-semibold text-zinc-900 dark:text-gt-primary hover:text-white dark:hover:text-yellow-300 transition"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm font-semibold text-zinc-900 dark:text-gt-primary hover:text-white dark:hover:text-yellow-300 transition"
                >
                  Logout
                </button>
              </>
            )}
          </nav>
          <ThemeToggle />
        </div>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
