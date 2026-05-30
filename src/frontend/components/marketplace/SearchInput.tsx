"use client";

import { useTransition, useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/frontend/components/ui/input";
import { Button } from "@/frontend/components/ui/button";
import { Search } from "lucide-react";

export function SearchInput({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue);
  const initialMount = useRef(true);

  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }

    // Debounce the search input
    const timer = setTimeout(() => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      const currentQ = current.get("q") || "";
      
      // Only push if value actually changed from URL
      if (value === currentQ) return;
      
      if (value) {
        current.set("q", value);
      } else {
        current.delete("q");
      }
      
      // Reset to page 1 on new search
      current.delete("page");
      
      const search = current.toString();
      const query = search ? `?${search}` : "";

      startTransition(() => {
        router.push(`${pathname}${query}`, { scroll: false });
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [value, pathname, router, searchParams]);

  return (
    <div className="mt-8 flex gap-2 max-w-lg">
      <div className="relative flex-1">
        <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${isPending ? "text-indigo-400" : "text-slate-400"}`} />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search agents…"
          className="h-10 rounded-lg pl-10 bg-white border-slate-200 text-sm shadow-sm focus-visible:ring-indigo-300"
        />
        {isPending && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-3.5 w-3.5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        )}
      </div>
      <Button 
        type="button" 
        onClick={() => {
          // The search is already debounced, this is just for UX feel
          if (!isPending) setValue(value); 
        }}
        className="h-10 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors"
      >
        Search
      </Button>
    </div>
  );
}
