/**
 * 홈 섹션 Suspense fallback skeleton 컴포넌트들
 * - MonthlyCoursesSection, PlacesGridSection의 레이아웃을 흉내내 CLS 없이 로딩
 */

function ShimmerBox({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        background: "linear-gradient(90deg, rgba(92,61,46,0.06) 25%, rgba(92,61,46,0.1) 50%, rgba(92,61,46,0.06) 75%)",
        backgroundSize: "200% 100%",
        animation: "skeletonShimmer 1.4s ease infinite",
        borderRadius: 12,
        ...style,
      }}
    />
  );
}

/** 이달의 코스 섹션 skeleton */
export function MonthlyCoursesSkeletonSection() {
  return (
    <section
      className="py-12 md:py-16"
      style={{ background: "var(--mongle-warm)" }}
      aria-hidden="true"
    >
      <div className="mx-auto max-w-7xl px-4">
        {/* 헤더 */}
        <div className="mb-6 md:mb-8 space-y-2">
          <ShimmerBox style={{ width: 80, height: 24 }} />
          <ShimmerBox style={{ width: 200, height: 32 }} />
        </div>

        {/* 코스 카드 3열 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden"
              style={{ background: "white", boxShadow: "0 4px 20px rgba(92,61,46,0.06)" }}
            >
              {/* 커버 이미지 */}
              <ShimmerBox style={{ height: 200, borderRadius: 0 }} />
              {/* 텍스트 */}
              <div className="p-4 space-y-2">
                <ShimmerBox style={{ width: 60, height: 20 }} />
                <ShimmerBox style={{ width: "80%", height: 24 }} />
                <ShimmerBox style={{ width: 120, height: 18 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** 장소 그리드 섹션 skeleton */
export function PlacesGridSkeletonSection() {
  return (
    <section
      className="py-12 md:py-16"
      style={{ background: "var(--mongle-cream)" }}
      aria-hidden="true"
    >
      <div className="mx-auto max-w-7xl px-4">
        {/* 헤더 */}
        <div className="mb-6 md:mb-8 space-y-2">
          <ShimmerBox style={{ width: 220, height: 32 }} />
          <ShimmerBox style={{ width: 180, height: 20 }} />
        </div>

        {/* 장소 카드 2/3/4열 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden"
              style={{ background: "white", boxShadow: "0 2px 12px rgba(92,61,46,0.06)" }}
            >
              {/* 이미지 */}
              <ShimmerBox style={{ height: 140, borderRadius: 0 }} />
              {/* 텍스트 */}
              <div className="p-3 space-y-2">
                <ShimmerBox style={{ width: "70%", height: 16 }} />
                <ShimmerBox style={{ width: "50%", height: 14 }} />
                <div className="flex gap-1 pt-1">
                  <ShimmerBox style={{ width: 40, height: 20 }} />
                  <ShimmerBox style={{ width: 40, height: 20 }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 더 보기 버튼 */}
        <div className="mt-8 flex justify-center">
          <ShimmerBox style={{ width: 120, height: 44, borderRadius: 999 }} />
        </div>
      </div>
    </section>
  );
}
