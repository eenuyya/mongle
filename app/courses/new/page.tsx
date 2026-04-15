/**
 * /courses/new — 맞춤형 코스 추천 시작 페이지
 * - 동네 + 인원 + 소요시간 선택 → AI가 코스 생성 후 상세 페이지로 이동
 */

import { createClient } from "@/lib/supabase/server";
import { CourseRecommendSetup } from "@/components/courses/CourseRecommendSetup";

export default async function CourseNewPage() {
  const supabase = await createClient();

  // places 테이블에서 활성 동네 목록 조회
  const { data } = await supabase
    .from("places")
    .select("district")
    .eq("is_active", true)
    .not("district", "is", null);

  const districts = [...new Set((data ?? []).map((p) => p.district as string))].sort();

  return <CourseRecommendSetup districts={districts} />;
}
