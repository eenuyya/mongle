/**
 * CoursesGridSection — 코스 그리드 fetch 전담 서버 컴포넌트
 * Suspense로 감싸서 필터 변경 시 스켈레톤을 보여주기 위해 분리
 */

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CourseCard } from "./CourseCard";

interface CoursesGridSectionProps {
  theme?: string;
  district?: string;
  duration?: string;
}

export async function CoursesGridSection({
  theme,
  district,
  duration,
}: CoursesGridSectionProps) {
  const supabase = await createClient();

  // 저장 코스 조회를 여기서 처리 — 페이지 컴포넌트를 동기적으로 만들어 스켈레톤이 즉시 표시되도록
  const { data: { user } } = await supabase.auth.getUser();
  let savedCourseIds = new Set<string>();
  if (user) {
    const { data: saved } = await supabase
      .from("saved_courses")
      .select("course_id")
      .eq("user_id", user.id);
    savedCourseIds = new Set((saved ?? []).map((s) => s.course_id));
  }

  let query = supabase
    .from("courses")
    .select(
      "id, title, description, district, theme_tag, duration_min, place_count, cover_image, is_editor_pick"
    )
    .eq("is_public", true)
    .order("is_editor_pick", { ascending: false })
    .order("created_at", { ascending: false });

  if (theme) query = query.eq("theme_tag", theme);
  if (district) query = query.eq("district", district);

  if (duration === "short") {
    query = query.lte("duration_min", 120);
  } else if (duration === "half") {
    query = query.gt("duration_min", 120).lte("duration_min", 240);
  } else if (duration === "day") {
    query = query.gt("duration_min", 240);
  }

  const { data } = await query.limit(48);
  const courses = data ?? [];

  // cover_image 없는 코스에 장소 이미지 폴백
  const courseIds = courses.map((c) => c.id);
  let placeImagesMap: Record<string, string[]> = {};
  if (courseIds.length > 0) {
    const { data: cpRows } = await supabase
      .from("course_places")
      .select("course_id, order_index, places(images)")
      .in("course_id", courseIds)
      .lte("order_index", 2)
      .order("order_index", { ascending: true });

    for (const row of cpRows ?? []) {
      const imgs = (Array.isArray(row.places) ? row.places[0] : row.places)?.images as string[] | null;
      if (!imgs?.length) continue;
      if (!placeImagesMap[row.course_id]) placeImagesMap[row.course_id] = [];
      if (placeImagesMap[row.course_id].length < 3) placeImagesMap[row.course_id].push(imgs[0]);
    }
  }

  const hasActiveFilter = !!(theme || district || duration);

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "var(--mongle-warm)" }}
        >
          <Sparkles size={28} style={{ color: "var(--mongle-peach)" }} />
        </div>
        <p className="text-base font-medium" style={{ color: "var(--mongle-brown)" }}>
          {hasActiveFilter ? "조건에 맞는 코스가 없어요" : "아직 준비 중인 코스예요"}
        </p>
        <p className="text-sm" style={{ color: "var(--mongle-brown)", opacity: 0.5 }}>
          {hasActiveFilter
            ? "다른 필터를 선택해보거나 초기화해보세요"
            : "곧 멋진 코스들이 올라올 거예요 :)"}
        </p>
        {hasActiveFilter && (
          <Link
            href="/courses"
            className="mt-2 px-5 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: "var(--mongle-peach)", color: "white" }}
          >
            필터 초기화
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      {hasActiveFilter && (
        <p className="mt-4 mb-2 text-xs" style={{ color: "var(--mongle-brown)", opacity: 0.5 }}>
          {courses.length}개의 코스를 찾았어요
        </p>
      )}
      <section className="mt-6" aria-label="전체 코스 목록">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              id={course.id}
              title={course.title}
              description={course.description}
              district={course.district}
              theme_tag={course.theme_tag}
              duration_min={course.duration_min}
              place_count={course.place_count}
              cover_image={course.cover_image}
              is_editor_pick={course.is_editor_pick}
              initialSaved={savedCourseIds.has(course.id)}
              placeImages={placeImagesMap[course.id] ?? []}
            />
          ))}
        </div>
      </section>
    </>
  );
}
