/**
 * MonthlyCoursesSection 컴포넌트 (async Server Component)
 * - "이달의 코스" 섹션
 * - Supabase에서 is_editor_pick = true인 courses 조회
 * - 코스가 0개이면 섹션 전체를 return null로 숨김
 * - 코스 있으면 그리드(1열/2열/3열) 형태로 카드 표시
 * - cover_image 있으면 next/image, 없으면 coverGradient fallback (CSS 변수로 정의)
 * - 만료 임박(D-3 이하) 배지, 팝업 포함 배지 표시
 * - Intersection Observer(fadeUp stagger) 초기화는 SectionScrollObserver가 담당
 * - hover shadow는 CSS group/peer 패턴 대신 Tailwind의 hover: 유틸리티로 처리
 */

import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { SectionScrollObserver } from "./SectionScrollObserver";

/** 섹션 식별자 — SectionScrollObserver와 section id를 동기화 */
const SECTION_ID = "monthly-courses-section";

/** 코스 커버 이미지 없을 때 theme_tag별 fallback gradient */
const COVER_GRADIENTS: Record<string, string> = {
  혼놀: "linear-gradient(135deg, #FF8C69 0%, #FFD166 50%, #FFCDB8 100%)",
  데이트: "linear-gradient(135deg, #FFCDB8 0%, #FF8C69 100%)",
  카공: "linear-gradient(135deg, #C9A86C 0%, #E8C9A0 50%, #FFF0C8 100%)",
  전시: "linear-gradient(135deg, #8B6842 0%, #C49A6C 50%, #E8C9A0 100%)",
  산책: "linear-gradient(135deg, #C9A86C 0%, #E8C9A0 50%, #FFF0C8 100%)",
  팝업: "linear-gradient(135deg, #FFB347 0%, #E07030 100%)",
  default: "linear-gradient(135deg, #FF8C69 0%, #FFD166 50%, #FFCDB8 100%)",
};

/** theme_tag 또는 district 기반으로 fallback gradient 선택 */
function getCoverGradient(themeTag?: string | null): string {
  if (!themeTag) return COVER_GRADIENTS.default;
  // theme_tag 값이 COVER_GRADIENTS 키와 부분 일치하는 경우 해당 gradient 반환
  const match = Object.keys(COVER_GRADIENTS).find((key) =>
    themeTag.includes(key)
  );
  return match ? COVER_GRADIENTS[match] : COVER_GRADIENTS.default;
}

/**
 * expires_at 날짜 문자열을 받아 D-day 정수 반환
 * - 오늘 기준으로 남은 일수 (양수 = 아직 만료 전, 0 = 오늘 만료, 음수 = 이미 만료)
 * - expires_at 없으면 null (상시)
 */
function calcDDay(expiresAt?: string | null): number | null {
  if (!expiresAt) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiresAt);
  expiry.setHours(0, 0, 0, 0);
  return Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export async function MonthlyCoursesSection() {
  const supabase = await createClient();

  // is_editor_pick = true인 공개 코스만 조회
  const { data } = await supabase
    .from("courses")
    .select(
      "id, title, description, theme_tag, district, duration_min, place_count, cover_image, has_popup, expires_at, editor_month"
    )
    .eq("is_editor_pick", true)
    .eq("is_public", true);

  const courses = data ?? [];

  // 코스가 없으면 섹션 전체 숨김
  if (courses.length === 0) return null;

  const currentMonth = new Date().getMonth() + 1;

  return (
    <section
      id={SECTION_ID}
      className="py-7 md:py-12"
      style={{ background: "var(--mongle-warm)" }}
      aria-label="이달의 코스"
    >
      {/* Intersection Observer 초기화 — 섹션 진입 시 animate-on-scroll 요소에 is-visible 부여 */}
      <SectionScrollObserver sectionId={SECTION_ID} threshold={0.1} />

      <div className="mx-auto max-w-7xl px-4">
        {/* 섹션 헤더 */}
        <div className="animate-on-scroll mb-4 md:mb-6 flex items-end justify-between">
          <div>
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-2"
              style={{
                background: "var(--mongle-gold)",
                color: "var(--mongle-brown)",
              }}
            >
              <Calendar size={12} aria-hidden="true" />
              <span>{currentMonth}월 한정</span>
            </div>
            <h2
              className="text-xl md:text-2xl font-bold"
              style={{ color: "var(--mongle-brown)" }}
            >
              이달의 코스
              <span
                className="ml-2 text-xl md:text-2xl font-medium"
                style={{ color: "var(--mongle-peach)" }}
              >
                {currentMonth}월의 코스
              </span>
            </h2>
          </div>
          {/* 데스크탑 전체 보기 */}
          <Link
            href="/courses"
            className="hidden md:flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--mongle-peach-dark)" }}
            aria-label="전체 코스 보기"
          >
            전체 보기 →
          </Link>
        </div>

        {/* 코스 카드 그리드 */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
          role="list"
          aria-label="이달의 코스 목록"
        >
          {courses.map((course, index) => {
            const dDay = calcDDay(course.expires_at);
            const isExpiringSoon =
              dDay !== null && dDay >= 0 && dDay <= 3;
            const coverGradient = getCoverGradient(course.theme_tag);

            // duration_min → "약 N시간" 형식 변환
            const durationText = course.duration_min
              ? `약 ${Math.round(course.duration_min / 60)}시간`
              : null;

            return (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className={cn(
                  "animate-on-scroll rounded overflow-hidden block",
                  "transition-all duration-200 hover:-translate-y-1",
                  "hover:shadow-[0_12px_36px_rgba(92,61,46,0.16)]",
                  `stagger-${Math.min(index + 1, 8)}`
                )}
                style={{
                  background: "white",
                  boxShadow: "0 4px 20px rgba(92,61,46,0.08)",
                }}
                aria-label={course.title}
              >
                {/* 커버 이미지 영역 */}
                <div
                  className="relative w-full overflow-hidden"
                  style={{ aspectRatio: "1 / 1" }}
                >
                  {course.cover_image ? (
                    /* 실제 cover_image URL이 있으면 next/image로 표시 */
                    <Image
                      src={course.cover_image}
                      alt={course.title}
                      fill
                      className="object-cover transition-transform duration-300 hover:scale-105"
                      unoptimized
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    /* 이미지 없으면 theme_tag 기반 gradient fallback */
                    <div
                      className="absolute inset-0"
                      style={{ background: coverGradient }}
                      aria-hidden="true"
                    />
                  )}

                  {/* hover 시 어두운 overlay */}
                  <div
                    className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200"
                    aria-hidden="true"
                  />

                  {/* 동네 레이블 */}
                  {course.district && (
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: "rgba(255,255,255,0.88)",
                          color: "var(--mongle-brown)",
                          backdropFilter: "blur(6px)",
                        }}
                      >
                        <MapPin size={10} aria-hidden="true" />
                        {course.district}
                      </span>
                    </div>
                  )}

                  {/* 배지 영역 (우측 상단) */}
                  <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                    {/* 만료 임박 배지 — D-3 이하 빨간색 */}
                    {isExpiringSoon && dDay !== null && (
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ background: "#FF4444", color: "white" }}
                        role="status"
                        aria-label={`${dDay}일 후 만료`}
                      >
                        D-{dDay}
                      </span>
                    )}

                    {/* 팝업 포함 배지 — 골드색 */}
                    {course.has_popup && (
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: "var(--mongle-gold)",
                          color: "var(--mongle-brown)",
                        }}
                      >
                        팝업 포함
                      </span>
                    )}
                  </div>
                </div>

                {/* 카드 정보 영역 */}
                <div className="p-4">
                  {/* theme_tag 기반 태그 표시 */}
                  {course.theme_tag && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: "var(--mongle-warm)",
                          color: "var(--mongle-brown)",
                        }}
                      >
                        #{course.theme_tag}
                      </span>
                    </div>
                  )}

                  {/* 코스명 */}
                  <h3
                    className="text-base md:text-lg font-bold mb-2 leading-snug"
                    style={{ color: "var(--mongle-brown)" }}
                  >
                    {course.title}
                  </h3>

                  {/* 메타 정보 — 소요시간 + 장소 수 */}
                  <div
                    className="flex items-center gap-4 text-sm"
                    style={{ color: "var(--mongle-brown)", opacity: 0.6 }}
                  >
                    {durationText && (
                      <span className="flex items-center gap-1">
                        <Clock size={13} aria-hidden="true" />
                        {durationText}
                      </span>
                    )}
                    {course.place_count != null && (
                      <span className="flex items-center gap-1">
                        <MapPin size={13} aria-hidden="true" />
                        {course.place_count}곳
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 모바일 전체 보기 버튼 */}
        <div className="md:hidden mt-6 flex justify-center">
          <Link
            href="/courses"
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{ background: "var(--mongle-peach)", color: "white" }}
          >
            전체 코스 보기 →
          </Link>
        </div>
      </div>
    </section>
  );
}
