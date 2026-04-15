import { MongleLoader } from "@/components/ui/MongleLoader";

export default function PlacesLoading() {
  return <MongleLoader fullPage />;
}

function _PlacesLoadingSkeleton() {
  return (
    <main className="min-h-screen pb-16" style={{ background: "var(--mongle-cream)" }}>
      <div className="mx-auto max-w-7xl px-4 pt-6">
        {/* 헤더 스켈레톤 */}
        <div className="mb-6 space-y-2">
          <div className="h-8 w-28 rounded-xl animate-pulse" style={{ background: "rgba(92,61,46,0.08)" }} />
          <div className="h-4 w-44 rounded-lg animate-pulse" style={{ background: "rgba(92,61,46,0.06)" }} />
        </div>

        {/* 필터 바 스켈레톤 */}
        <div className="flex gap-2 mb-6">
          {[56, 48, 56, 48, 44].map((w, i) => (
            <div
              key={i}
              className="h-9 rounded-full animate-pulse shrink-0"
              style={{ width: w, background: "rgba(92,61,46,0.07)", animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>

        {/* 카드 그리드 스켈레톤 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden animate-pulse"
              style={{ background: "white", animationDelay: `${i * 40}ms` }}
            >
              <div className="h-48" style={{ background: "rgba(92,61,46,0.06)" }} />
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 rounded-lg" style={{ background: "rgba(92,61,46,0.06)" }} />
                <div className="h-3 w-1/2 rounded-lg" style={{ background: "rgba(92,61,46,0.04)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
