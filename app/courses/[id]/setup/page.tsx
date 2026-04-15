import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SituationCheckPage } from "@/components/courses/SituationCheckPage";

export default async function CourseSetupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, theme_tag, is_public")
    .eq("id", id)
    .eq("is_public", true)
    .single();

  if (!course) notFound();

  return (
    <SituationCheckPage
      courseId={course.id}
      courseTitle={course.title}
      themeTag={course.theme_tag}
    />
  );
}
