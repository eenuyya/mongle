import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseDetailClient } from "@/components/courses/CourseDetailClient";

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ party?: string; stay?: string; ai_reason?: string }>;
}) {
  const { id } = await params;
  const { party, stay, ai_reason } = await searchParams;
  const supabase = await createClient();

  const [{ data: course }, { data: { user } }] = await Promise.all([
    supabase
      .from("courses")
      .select(
        `id, title, description, theme_tag, district, duration_min, place_count,
         cover_image, is_editor_pick, has_popup, expires_at, is_public, created_by, original_course_id`
      )
      .eq("id", id)
      .single(),
    supabase.auth.getUser(),
  ]);

  if (!course) notFound();

  const isUserOwned = !!user && course.created_by === user.id;
  // 이미 포크된 편집본인지 (original_course_id가 있으면 편집본)
  const isAlreadyEdited = !!(course as { original_course_id?: string | null }).original_course_id;

  const { data: raw } = await supabase
    .from("course_places")
    .select(
      `order_index, visit_duration_min, note,
       places(id, name, category, address, district, lat, lng, images)`
    )
    .eq("course_id", id)
    .order("order_index", { ascending: true });

  const coursePlaces = (raw ?? [])
    .map((cp) => ({ ...cp, places: Array.isArray(cp.places) ? cp.places[0] : cp.places }))
    .filter((cp) => cp.places != null) as Parameters<typeof CourseDetailClient>[0]["coursePlaces"];

  return (
    <CourseDetailClient
      course={course}
      coursePlaces={coursePlaces}
      party={party}
      stay={stay}
      aiReason={ai_reason}
      isUserOwned={isUserOwned}
      isAlreadyEdited={isAlreadyEdited}
    />
  );
}
