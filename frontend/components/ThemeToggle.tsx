"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "dark" | "light";

const STORAGE_KEY = "medine_huzur_theme";

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute("data-theme", theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem(STORAGE_KEY)
        : null;

    const nextTheme: ThemeMode = stored === "light" ? "light" : "dark";

    setTheme(nextTheme);
    applyTheme(nextTheme);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="header-icon-btn relative inline-flex h-10 w-10 items-center justify-center rounded-2xl transition hover:-translate-y-0.5 lg:h-11 lg:w-11"
      aria-label={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
      title={theme === "dark" ? "Açık tema" : "Koyu tema"}
    >
      {!mounted ? (
        <Moon className="h-5 w-5 text-mhgreen" />
      ) : theme === "dark" ? (
        <Sun className="h-5 w-5 text-mhgreen" />
      ) : (
        <Moon className="h-5 w-5 text-mhgreen" />
      )}
    </button>
  );
}