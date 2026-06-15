import { Header } from "@/frontend/components/site/Header";
import { Footer } from "@/frontend/components/site/Footer";
import { Skeleton } from "@/frontend/components/ui/skeleton";

export default function MarketplaceLoading() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Skeleton */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="absolute inset-0 opacity-[0.35]" style={{
          backgroundImage: "radial-gradient(circle, #94a3b8 0.5px, transparent 0.5px)",
          backgroundSize: "24px 24px",
        }} />

        <div className="relative mx-auto w-[min(1200px,92%)] pt-32 pb-10">
          <div className="flex items-start justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 mb-4">
                <Skeleton className="h-4 w-32 bg-teal-100" />
              </div>
              <Skeleton className="h-12 w-64 md:w-96 mb-2" />
              <Skeleton className="h-12 w-48 mb-4" />
              <Skeleton className="h-4 w-80 mb-2" />
            </div>
          </div>

          {/* Search Skeleton */}
          <div className="mt-8">
            <Skeleton className="h-14 w-full max-w-2xl rounded-full" />
          </div>

          {/* Filters Skeleton */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
            <div className="h-5 w-px bg-slate-200 mx-2 hidden sm:block" />
            {[...Array(4)].map((_, i) => (
              <Skeleton key={`sort-${i}`} className="h-8 w-20 rounded-full" />
            ))}
          </div>
        </div>
      </section>

      {/* Grid Skeleton */}
      <main>
        <div className="mx-auto w-[min(1200px,92%)] py-10">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden p-6 h-[280px]">
                {/* Top row */}
                <div className="flex items-center justify-between mb-5">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                {/* Agent identity */}
                <div className="flex items-center gap-3.5 mb-4">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2 flex-grow">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                {/* Description */}
                <div className="space-y-2 mt-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
                {/* Footer */}
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
