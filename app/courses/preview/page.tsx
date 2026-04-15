import { MOCK_COURSE, MOCK_COURSE_PLACES } from "@/lib/mock/course";
import { CourseDetailClient } from "@/components/courses/CourseDetailClient";
import { SituationCheckPage } from "@/components/courses/SituationCheckPage";

export default async function CoursePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ party?: string; stay?: string; step?: string }>;
}) {
  const { party, stay, step } = await searchParams;
  const showDetail = step === "detail" || (party && stay);

  if (!showDetail) {
    return (
      <SituationCheckPage
        courseId="preview"
        courseTitle={MOCK_COURSE.title}
        themeTag={MOCK_COURSE.theme_tag}
      />
    );
  }

  return (
    <CourseDetailClient
      course={MOCK_COURSE}
      coursePlaces={MOCK_COURSE_PLACES}
      party={party}
      stay={stay}
    />
  );
}
