/**
 * /courses 전체 탐색 페이지
 * - 홈의 "이달의 코스" 미리보기와 달리, 필터 + 전체 목록을 제공하는 탐색 전용 페이지
 * - searchParams: theme(테마), district(동네), duration(소요시간 범위)
 * - 로그인 유저는 saved_courses 테이블에서 저장 여부를 미리 조회해 CourseCard에 전달
 */

import { Suspense } from "react";
import Link from "next/link";
import { Wand2 } from "lucide-react";
import { CourseFilterBar } from "@/components/courses/CourseFilterBar";
import { CoursesGridSection } from "@/components/courses/CoursesGridSection";
import { CoursesGridSkeleton } from "@/components/courses/CourseCardSkeleton";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string; district?: string; duration?: string }>;
}) {
  const { theme, district, duration } = await searchParams;


  return (
    <main className="min-h-screen pt-12 md:pt-16" style={{ background: "var(--mongle-cream)" }}>
      {/* 히어로 */}
      <div
        className="py-14 px-4 text-center"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,200,170,0.25) 0%, transparent 100%)",
        }}
      >
        <p className="text-sm font-medium mb-2" style={{ color: "var(--mongle-peach)" }}>
          몽글 코스 추천
        </p>
        <h1
          className="text-3xl md:text-4xl mb-3"
          style={{ color: "var(--mongle-brown)", fontFamily: "var(--font-seoul)" }}
        >
          오늘, 어디 갈지 고민돼?
        </h1>
        <p
          className="text-sm md:text-base"
          style={{ color: "var(--mongle-brown)", opacity: 0.6, fontFamily: "var(--font-seoul)" }}
        >
          몽글이 엄선한 감성 코스로 하루를 채워봐요
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16">
        {/* 맞춤 코스 추천 진입점 배너 */}
        <Link
          href="/courses/new"
          className="group relative flex items-center justify-between gap-4 px-5 py-5 rounded-2xl mb-6 overflow-hidden transition-all duration-200 hover:shadow-[0_8px_32px_rgba(255,140,105,0.45)] hover:-translate-y-0.5 active:scale-[0.99]"
          style={{
            background: "linear-gradient(120deg, #E85D30 0%, #FF7A50 55%, #FFB08A 100%)",
            boxShadow: "0 4px 20px rgba(232,93,48,0.35)",
          }}
        >
          {/* 배경 장식 원 */}
          <div
            className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-20"
            style={{ background: "white" }}
            aria-hidden="true"
          />
          <div
            className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full opacity-10"
            style={{ background: "white" }}
            aria-hidden="true"
          />

          <div className="relative">
            <div
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold mb-1.5"
              style={{ background: "rgba(255,255,255,0.25)", color: "white" }}
            >
              <Wand2 size={10} />
              AI 맞춤 추천
            </div>
            <p className="text-[15px] font-bold leading-snug" style={{ color: "white", textShadow: "0 1px 4px rgba(0,0,0,0.18)" }}>
              나에게 딱 맞는 코스 찾기
            </p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.9)", textShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>
              인원 · 시간 선택하면 코스를 골라드려요
            </p>
          </div>

          <div
            className="relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5"
            style={{ background: "rgba(255,255,255,0.25)" }}
          >
            <span className="text-white font-bold text-lg leading-none">→</span>
          </div>
        </Link>

        {/* 필터 바 — CourseFilterBar 내부에서 sticky top-16 처리 */}
        <Suspense fallback={null}>
          <CourseFilterBar />
        </Suspense>

        {/* 코스 그리드 — 필터 변경 시 스켈레톤 노출 */}
        <Suspense
          key={`${theme ?? ""}-${district ?? ""}-${duration ?? ""}`}
          fallback={<CoursesGridSkeleton />}
        >
          <CoursesGridSection
            theme={theme}
            district={district}
            duration={duration}
          />
        </Suspense>
      </div>
    </main>
  );
}
