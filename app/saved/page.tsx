import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SavedClient } from "./SavedClient";

export default async function SavedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 저장한 코스 (테이블 없을 때 에러 무시)
  type CourseRow = { id: string; title: string; description: string | null; district: string | null; theme_tag: string | null; duration_min: number | null; place_count: number | null; cover_image: string | null };
  let courses: CourseRow[] = [];
  try {
    const { data: savedCourses } = await supabase
      .from("saved_courses")
      .select("course_id, courses(id, title, description, district, theme_tag, duration_min, place_count, cover_image)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    courses = (savedCourses ?? [])
      .flatMap((s) => (Array.isArray(s.courses) ? s.courses : s.courses ? [s.courses] : []))
      .filter((c): c is CourseRow => !!c && typeof c === "object" && "id" in c);
  } catch {
    // saved_courses 테이블 미생성 시 무시
  }

  // 저장한 장소 — 2-step: saved_places 먼저 조회 후 places 별도 조회
  type PlaceRow = { id: string; name: string; district: string | null; category: string; tags: string[] | null; images: string[] | null };
  let places: PlaceRow[] = [];
  const { data: savedPlaces } = await supabase
    .from("saved_places")
    .select("place_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const placeIds = (savedPlaces ?? []).map((s) => s.place_id).filter(Boolean);

  if (placeIds.length > 0) {
    const { data: placeRows } = await supabase
      .from("places")
      .select("id, name, district, category, tags, images")
      .in("id", placeIds);

    // saved_places 순서 유지
    const placeMap = new Map((placeRows ?? []).map((p) => [p.id, p]));
    places = placeIds
      .map((id) => placeMap.get(id))
      .filter((p): p is PlaceRow => !!p);
  }

  type UserCourseRow = { id: string; title: string; description: string | null; district: string | null; theme_tag: string | null; duration_min: number | null; place_count: number | null; cover_image: string | null; created_at: string };

  // AI 추천 코스 (본인이 생성, is_public=false, original_course_id=null)
  let aiCourses: UserCourseRow[] = [];
  try {
    const { data: aiRows } = await supabase
      .from("courses")
      .select("id, title, description, district, theme_tag, duration_min, place_count, cover_image, created_at")
      .eq("created_by", user.id)
      .eq("is_public", false)
      .is("original_course_id", null)
      .order("created_at", { ascending: false });
    aiCourses = (aiRows ?? []) as UserCourseRow[];
  } catch {
    // 컬럼 미생성 시 무시
  }

  // 편집 코스 (본인이 생성, is_public=false, original_course_id IS NOT NULL)
  let editedCourses: UserCourseRow[] = [];
  try {
    const { data: editedRows } = await supabase
      .from("courses")
      .select("id, title, description, district, theme_tag, duration_min, place_count, cover_image, created_at")
      .eq("created_by", user.id)
      .eq("is_public", false)
      .not("original_course_id", "is", null)
      .order("created_at", { ascending: false });
    editedCourses = (editedRows ?? []) as UserCourseRow[];
  } catch {
    // 컬럼 미생성 시 무시
  }

  // 모든 코스 ID 모아서 장소 이미지 batch fetch
  const allCourseIds = [
    ...courses.map((c) => c.id),
    ...aiCourses.map((c) => c.id),
    ...editedCourses.map((c) => c.id),
  ];
  let placeImagesMap: Record<string, string[]> = {};
  if (allCourseIds.length > 0) {
    const { data: cpRows } = await supabase
      .from("course_places")
      .select("course_id, order_index, places(images)")
      .in("course_id", allCourseIds)
      .lte("order_index", 1)
      .order("order_index", { ascending: true });

    for (const row of cpRows ?? []) {
      const imgs = (Array.isArray(row.places) ? row.places[0] : row.places)?.images as string[] | null;
      if (!imgs?.length) continue;
      if (!placeImagesMap[row.course_id]) placeImagesMap[row.course_id] = [];
      if (placeImagesMap[row.course_id].length < 2) placeImagesMap[row.course_id].push(imgs[0]);
    }
  }

  return (
    <SavedClient
      courses={courses}
      places={places}
      aiCourses={aiCourses}
      editedCourses={editedCourses}
      placeImagesMap={placeImagesMap}
    />
  );
}
