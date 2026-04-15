"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function toggleSavedCourse(courseId: string): Promise<{ saved: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { saved: false, error: "로그인이 필요해요" };
  }

  const { data: existing } = await supabase
    .from("saved_courses")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .single();

  if (existing) {
    await supabase.from("saved_courses").delete().eq("id", existing.id);
    revalidatePath("/saved");
    return { saved: false };
  } else {
    await supabase.from("saved_courses").insert({ user_id: user.id, course_id: courseId });
    revalidatePath("/saved");
    return { saved: true };
  }
}

export async function deleteAiCourse(courseId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };

  // created_by 본인 확인
  const { data: course } = await supabase
    .from("courses")
    .select("id, created_by")
    .eq("id", courseId)
    .single();

  if (!course || course.created_by !== user.id) return { error: "권한이 없어요" };

  // service role로 삭제
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  await admin.from("course_places").delete().eq("course_id", courseId);
  await admin.from("courses").delete().eq("id", courseId);
  revalidatePath("/saved");
  return {};
}

export async function saveCourseEdit(
  courseId: string,
  places: { placeId: string; visitDurationMin: number | null; note: string | null }[],
  fork: boolean
): Promise<{ error?: string; newCourseId?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const totalMin = places.reduce((sum, p) => sum + (p.visitDurationMin ?? 60), 0);

  if (fork) {
    // 이미 이 코스의 편집본이 있는지 확인
    const { data: existing } = await supabase
      .from("courses")
      .select("id")
      .eq("created_by", user.id)
      .eq("original_course_id", courseId)
      .maybeSingle();

    const targetId = existing?.id;

    if (targetId) {
      // 기존 편집본 업데이트
      await admin.from("course_places").delete().eq("course_id", targetId);
      const rows = places.map((p, i) => ({
        course_id: targetId,
        place_id: p.placeId,
        order_index: i,
        visit_duration_min: p.visitDurationMin ?? 60,
        note: p.note ?? null,
      }));
      const { error: insertError } = await admin.from("course_places").insert(rows);
      if (insertError) return { error: insertError.message };
      await admin.from("courses").update({ place_count: places.length, duration_min: totalMin }).eq("id", targetId);
      revalidatePath(`/courses/${targetId}`);
      revalidatePath("/saved");
      return { newCourseId: targetId };
    }

    // 원본 코스 메타데이터 복사 후 새 편집본 생성
    const { data: original } = await supabase
      .from("courses")
      .select("title, description, theme_tag, district, cover_image")
      .eq("id", courseId)
      .single();

    if (!original) return { error: "코스를 찾을 수 없어요" };

    const { data: newCourse, error: courseInsertError } = await admin
      .from("courses")
      .insert({
        title: original.title,
        description: original.description,
        theme_tag: original.theme_tag,
        district: original.district,
        cover_image: original.cover_image,
        is_editor_pick: false,
        has_popup: false,
        expires_at: null,
        created_by: user.id,
        is_public: false,
        original_course_id: courseId,
        place_count: places.length,
        duration_min: totalMin,
      })
      .select("id")
      .single();

    if (courseInsertError || !newCourse) return { error: courseInsertError?.message ?? "코스 생성 실패" };

    const rows = places.map((p, i) => ({
      course_id: newCourse.id,
      place_id: p.placeId,
      order_index: i,
      visit_duration_min: p.visitDurationMin ?? 60,
      note: p.note ?? null,
    }));
    const { error: insertError } = await admin.from("course_places").insert(rows);
    if (insertError) return { error: insertError.message };

    revalidatePath("/saved");
    return { newCourseId: newCourse.id };
  }

  // 제자리 업데이트 (본인 코스 - AI 생성 또는 기존 편집본)
  await admin.from("course_places").delete().eq("course_id", courseId);
  const rows = places.map((p, i) => ({
    course_id: courseId,
    place_id: p.placeId,
    order_index: i,
    visit_duration_min: p.visitDurationMin ?? 60,
    note: p.note ?? null,
  }));
  const { error: insertError } = await admin.from("course_places").insert(rows);
  if (insertError) return { error: insertError.message };

  await admin.from("courses").update({ place_count: places.length, duration_min: totalMin }).eq("id", courseId);
  revalidatePath(`/courses/${courseId}`);
  return {};
}

export async function toggleSavedPlace(placeId: string): Promise<{ saved: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { saved: false, error: "로그인이 필요해요" };
  }

  // 이미 저장됐는지 확인
  const { data: existing } = await supabase
    .from("saved_places")
    .select("id")
    .eq("user_id", user.id)
    .eq("place_id", placeId)
    .single();

  if (existing) {
    await supabase.from("saved_places").delete().eq("id", existing.id);
    revalidatePath("/saved");
    return { saved: false };
  } else {
    await supabase.from("saved_places").insert({ user_id: user.id, place_id: placeId });
    revalidatePath("/saved");
    return { saved: true };
  }
}
