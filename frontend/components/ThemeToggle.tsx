"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "dark" | "light";

const STORAGE_KEY = "medine_huzur_theme";

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute("data-theme", theme);
}

export default function ThemeToggle() {
  // 1. Başlangıç state'ini "light" olarak değiştirdik
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem(STORAGE_KEY)
        : null;

    // 2. Tarayıcıda önceden "dark" seçilmemişse, HERKES için varsayılanı "light" yaptık
    const nextTheme: ThemeMode = stored === "dark" ? "dark" : "light";

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
      className="header-icon-btn relative inline-flex h-9 w-9 items-center justify-center rounded-xl transition hover:-translate-y-0.5"
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