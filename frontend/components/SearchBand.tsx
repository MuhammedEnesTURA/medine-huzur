"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchBand() {
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    setSearch(pathname === "/products" ? url.searchParams.get("q") ?? "" : "");
  }, [pathname]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();

    const q = search.trim();

    if (!q) {
      router.push("/products");
      return;
    }

    router.push(`/products?q=${encodeURIComponent(q)}`);
  };

  return (
    <section className="search-band page-container">
      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-[700px] rounded-[1rem] border border-border-soft bg-panel/82 p-1.5 shadow-[0_8px_22px_rgba(0,0,0,0.06)] backdrop-blur-xl"
      >
        <div className="flex items-center gap-1.5">
          <div className="flex h-9 min-w-0 flex-1 items-center rounded-[0.8rem] border border-border-soft bg-panel-2/72 px-3 transition focus-within:border-mhgreen/40 focus-within:bg-panel focus-within:ring-4 focus-within:ring-mhgreen/10">
            <Search className="mr-2 h-3.5 w-3.5 shrink-0 text-muted" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ne aramıştınız?"
              className="h-full w-full bg-transparent text-[13px] font-medium text-foreground placeholder:text-muted-2 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-[0.8rem] bg-mhgreen px-4 text-[13px] font-extrabold text-white shadow-[0_8px_18px_rgba(34,197,94,0.18)] transition hover:bg-mhgreen-dark"
          >
            Ara
          </button>
        </div>
      </form>
    </section>
  );
}