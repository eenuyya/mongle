import { Suspense } from "react";
import { ThemeSection } from "@/components/home/ThemeSection";
import { PlacesGridSection } from "@/components/home/PlacesGridSection";
import { PlacesGridSkeletonSection } from "@/components/home/HomeSectionSkeletons";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ district?: string }>;
}) {
  const { district } = await searchParams;

  // 테마별 코스 수 + 대표 이미지 집계
  const supabase = await createClient();
  const { data: themeRows } = await supabase
    .from("courses")
    .select("theme_tag, cover_image")
    .not("theme_tag", "is", null);

  const themeCounts: Record<string, number> = {};
  const themeImages: Record<string, string> = {};
  (themeRows ?? []).forEach(({ theme_tag, cover_image }) => {
    if (theme_tag) {
      themeCounts[theme_tag] = (themeCounts[theme_tag] ?? 0) + 1;
      if (cover_image && !themeImages[theme_tag]) {
        themeImages[theme_tag] = cover_image;
      }
    }
  });

  return (
    <main className="flex flex-col min-h-screen w-full pt-8 md:pt-10" style={{ background: "var(--mongle-cream)" }}>
      {/* 1. 테마별 코스 섹션 */}
      <ThemeSection themeCounts={themeCounts} themeImages={themeImages} />

      {/* 2. 느좋 장소 그리드 섹션 — Supabase 쿼리 완료 전까지 skeleton 표시 */}
      <Suspense fallback={<PlacesGridSkeletonSection />}>
        <PlacesGridSection district={district} />
      </Suspense>

      {/* 3. 푸터 */}
    </main>
  );
}
