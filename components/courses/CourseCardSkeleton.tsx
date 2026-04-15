/** 코스 카드 로딩 스켈레톤 — CourseCard와 동일한 1:1 정사각형 */
export function CourseCardSkeleton() {
  return (
    <div className="relative block rounded overflow-hidden">
      {/* 1:1 비율 spacer */}
      <svg viewBox="0 0 1 1" className="block w-full" aria-hidden="true" />

      {/* 전체 shimmer 배경 */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#f0e8e0] via-[#fdf6f0] to-[#f0e8e0] bg-[length:200%_100%] animate-shimmer" />

      {/* 하단 텍스트 오버레이 */}
      <div
        className="absolute bottom-0 left-0 right-0 px-3 pt-10 pb-3"
        style={{ background: "linear-gradient(to top, rgba(20,8,2,0.3) 0%, transparent 100%)" }}
      >
        <div className="rounded h-3 w-3/4 mb-2 animate-shimmer bg-white/30 bg-[length:200%_100%]" />
        <div className="flex gap-2">
          <div className="rounded-full h-2.5 w-10 animate-shimmer bg-white/25 bg-[length:200%_100%]" />
          <div className="rounded-full h-2.5 w-8 animate-shimmer bg-white/25 bg-[length:200%_100%]" />
        </div>
      </div>
    </div>
  );
}

export function CoursesGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 mt-6">
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}
