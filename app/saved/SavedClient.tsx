"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bookmark, BookmarkX, RouteIcon, MapPin, Sparkles, Trash2, Pencil, ChevronDown, X } from "lucide-react";
import { PlaceCardItemClient } from "@/components/home/PlaceCardItemClient";
import { SavedCourseCard } from "@/components/saved/SavedCourseCard";
import { toggleSavedCourse, toggleSavedPlace, deleteAiCourse } from "@/app/actions/saved";

interface CourseRow {
  id: string;
  title: string;
  description: string | null;
  district: string | null;
  theme_tag: string | null;
  duration_min: number | null;
  place_count: number | null;
  cover_image: string | null;
}

interface UserCourseRow extends CourseRow {
  created_at: string;
}

interface PlaceRow {
  id: string;
  name: string;
  district: string | null;
  category: string;
  tags: string[] | null;
  images: string[] | null;
}

type CourseFilter = "all" | "curated" | "ai" | "edited";

type UndoItem =
  | { type: "course"; item: CourseRow; index: number; timeoutId: ReturnType<typeof setTimeout> }
  | { type: "place"; item: PlaceRow; index: number; timeoutId: ReturnType<typeof setTimeout> }
  | { type: "ai" | "edited"; item: UserCourseRow; index: number; timeoutId: ReturnType<typeof setTimeout> };

interface SavedClientProps {
  courses: CourseRow[];
  places: PlaceRow[];
  aiCourses?: UserCourseRow[];
  editedCourses?: UserCourseRow[];
  placeImagesMap?: Record<string, string[]>;
}

export function SavedClient({
  courses: initialCourses,
  places: initialPlaces,
  aiCourses: initialAiCourses = [],
  editedCourses: initialEditedCourses = [],
  placeImagesMap = {},
}: SavedClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"courses" | "places">("courses");
  const [courseFilter, setCourseFilter] = useState<CourseFilter>("all");
  const [courseList, setCourseList] = useState(initialCourses);
  const [placeList, setPlaceList] = useState(initialPlaces);
  const [aiCourseList, setAiCourseList] = useState(initialAiCourses);
  const [editedCourseList, setEditedCourseList] = useState(initialEditedCourses);
  const [districtFilter, setDistrictFilter] = useState<string | null>(null);
  const [districtSheetOpen, setDistrictSheetOpen] = useState(false);
  const [undoItem, setUndoItem] = useState<UndoItem | null>(null);
  const undoRef = useRef<UndoItem | null>(null);

  useEffect(() => { undoRef.current = undoItem; }, [undoItem]);


  const clearPrevUndo = useCallback(() => {
    if (undoRef.current) clearTimeout(undoRef.current.timeoutId);
  }, []);

  const handleUnsaveCourse = useCallback((courseId: string) => {
    const index = courseList.findIndex((c) => c.id === courseId);
    const item = courseList[index];
    if (!item) return;
    setCourseList((prev) => prev.filter((c) => c.id !== courseId));
    clearPrevUndo();
    const timeoutId = setTimeout(async () => {
      const result = await toggleSavedCourse(courseId);
      if (result.error === "로그인이 필요해요") router.push("/login");
      setUndoItem(null);
    }, 4000);
    setUndoItem({ type: "course", item, index, timeoutId });
  }, [courseList, clearPrevUndo, router]);

  const handleUnsavePlace = useCallback((placeId: string) => {
    const index = placeList.findIndex((p) => p.id === placeId);
    const item = placeList[index];
    if (!item) return;
    setPlaceList((prev) => prev.filter((p) => p.id !== placeId));
    clearPrevUndo();
    const timeoutId = setTimeout(async () => {
      const result = await toggleSavedPlace(placeId);
      if (result.error === "로그인이 필요해요") router.push("/login");
      setUndoItem(null);
    }, 4000);
    setUndoItem({ type: "place", item, index, timeoutId });
  }, [placeList, clearPrevUndo, router]);

  const handleDeleteUserCourse = useCallback((courseId: string, type: "ai" | "edited") => {
    const list = type === "ai" ? aiCourseList : editedCourseList;
    const setList = type === "ai" ? setAiCourseList : setEditedCourseList;
    const index = list.findIndex((c) => c.id === courseId);
    const item = list[index];
    if (!item) return;
    setList((prev) => prev.filter((c) => c.id !== courseId));
    clearPrevUndo();
    const timeoutId = setTimeout(async () => {
      const result = await deleteAiCourse(courseId);
      if (result.error) setList(type === "ai" ? initialAiCourses : initialEditedCourses);
      setUndoItem(null);
    }, 4000);
    setUndoItem({ type, item, index, timeoutId } as UndoItem);
  }, [aiCourseList, editedCourseList, clearPrevUndo, initialAiCourses, initialEditedCourses]);

  const handleUndo = useCallback(() => {
    if (!undoItem) return;
    clearTimeout(undoItem.timeoutId);
    if (undoItem.type === "course") {
      setCourseList((prev) => {
        if (prev.some((c) => c.id === undoItem.item.id)) return prev;
        const next = [...prev];
        next.splice(undoItem.index, 0, undoItem.item);
        return next;
      });
    } else if (undoItem.type === "ai") {
      setAiCourseList((prev) => {
        if (prev.some((c) => c.id === undoItem.item.id)) return prev;
        const next = [...prev];
        next.splice(undoItem.index, 0, undoItem.item as UserCourseRow);
        return next;
      });
    } else if (undoItem.type === "edited") {
      setEditedCourseList((prev) => {
        if (prev.some((c) => c.id === undoItem.item.id)) return prev;
        const next = [...prev];
        next.splice(undoItem.index, 0, undoItem.item as UserCourseRow);
        return next;
      });
    } else {
      setPlaceList((prev) => {
        if (prev.some((p) => p.id === undoItem.item.id)) return prev;
        const next = [...prev];
        next.splice(undoItem.index, 0, undoItem.item as PlaceRow);
        return next;
      });
    }
    setUndoItem(null);
  }, [undoItem]);

  // 동네 필터 적용
  const dCourseList = districtFilter ? courseList.filter((c) => c.district === districtFilter) : courseList;
  const dAiCourseList = districtFilter ? aiCourseList.filter((c) => c.district === districtFilter) : aiCourseList;
  const dEditedCourseList = districtFilter ? editedCourseList.filter((c) => c.district === districtFilter) : editedCourseList;
  const dPlaceList = districtFilter ? placeList.filter((p) => p.district === districtFilter) : placeList;

  // 전체 데이터 기준 동네 목록 (탭/필터 무관하게 전체)
  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    courseList.forEach((c) => c.district && set.add(c.district));
    aiCourseList.forEach((c) => c.district && set.add(c.district));
    editedCourseList.forEach((c) => c.district && set.add(c.district));
    placeList.forEach((p) => p.district && set.add(p.district));
    return Array.from(set).sort();
  }, [courseList, aiCourseList, editedCourseList, placeList]);

  // 현재 필터에 따른 코스 수 (동네 필터 적용 후)
  const filteredCoursesCount =
    courseFilter === "all" ? dCourseList.length + dAiCourseList.length + dEditedCourseList.length
    : courseFilter === "curated" ? dCourseList.length
    : courseFilter === "ai" ? dAiCourseList.length
    : dEditedCourseList.length;

  const tabCountLabel =
    activeTab === "courses"
      ? filteredCoursesCount > 0 ? `코스 ${filteredCoursesCount}개` : "저장한 코스가 없어요"
      : dPlaceList.length > 0 ? `장소 ${dPlaceList.length}곳` : "저장한 장소가 없어요";

  const FILTERS: { value: CourseFilter; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "curated", label: "몽글 pick" },
    { value: "ai", label: "AI 추천" },
    { value: "edited", label: "내 편집" },
  ];

  return (
    <main className="min-h-screen pt-12 md:pt-16" style={{ background: "var(--mongle-cream)" }}>
      <div className="mx-auto max-w-xl px-4 py-8">

        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Bookmark size={20} style={{ color: "var(--mongle-peach)" }} />
              <h1 className="text-2xl font-bold" style={{ color: "var(--mongle-brown)" }}>
                저장한 목록
              </h1>
            </div>
            {availableDistricts.length > 0 && (
              <DistrictFilterButton
                selected={districtFilter}
                onOpen={() => setDistrictSheetOpen(true)}
                onClear={() => setDistrictFilter(null)}
              />
            )}
          </div>
          <p className="text-sm" style={{ color: "var(--mongle-brown)", opacity: 0.5 }}>
            {tabCountLabel}
          </p>
        </div>

        {/* 탭 */}
        <div
          className="flex gap-1 rounded-full p-1 mb-5"
          style={{ background: "rgba(92,61,46,0.07)", width: "fit-content" }}
        >
          {(["courses", "places"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-1.5 rounded-full text-sm font-semibold transition-all"
              style={
                activeTab === tab
                  ? { background: "var(--mongle-peach)", color: "white" }
                  : { background: "transparent", color: "var(--mongle-brown)", opacity: 0.55 }
              }
            >
              {tab === "courses" ? "코스" : "장소"}
            </button>
          ))}
        </div>

        {/* 코스 탭 */}
        {activeTab === "courses" && (
          <>
            {/* 종류 필터 칩 */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setCourseFilter(f.value)}
                  className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={
                    courseFilter === f.value
                      ? { background: "var(--mongle-brown)", color: "white" }
                      : { background: "white", color: "var(--mongle-brown)", border: "1px solid rgba(92,61,46,0.15)" }
                  }
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredCoursesCount === 0 ? (
              <EmptyState filter={courseFilter} />
            ) : (
              <div className="flex flex-col gap-6">
                {/* 몽글 픽 저장 코스 */}
                {(courseFilter === "all" || courseFilter === "curated") && dCourseList.length > 0 && (
                  <div>
                    {courseFilter === "all" && (
                      <p className="text-xs font-semibold mb-2.5 px-1" style={{ color: "var(--mongle-brown)", opacity: 0.4 }}>
                        몽글 pick
                      </p>
                    )}
                    <div className="flex flex-col gap-3">
                      {dCourseList.map((course, index) => (
                        <div key={course.id} style={{ animation: "fadeUp 0.45s ease both", animationDelay: `${index * 0.04}s` }}>
                          <SavedCourseCard {...course} placeImages={placeImagesMap[course.id] ?? []} onUnsave={handleUnsaveCourse} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI 추천 코스 */}
                {(courseFilter === "all" || courseFilter === "ai") && dAiCourseList.length > 0 && (
                  <div>
                    {courseFilter === "all" && (
                      <p className="text-xs font-semibold mb-2.5 px-1" style={{ color: "var(--mongle-peach)" }}>
                        AI 추천
                      </p>
                    )}
                    <div className="flex flex-col gap-3">
                      {dAiCourseList.map((course, index) => (
                        <div key={course.id} style={{ animation: "fadeUp 0.45s ease both", animationDelay: `${index * 0.04}s` }}>
                          <UserCourseCard
                            course={course}
                            badge={{ icon: "ai", label: "AI 추천" }}
                            onDelete={() => handleDeleteUserCourse(course.id, "ai")}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 내 편집 코스 */}
                {(courseFilter === "all" || courseFilter === "edited") && dEditedCourseList.length > 0 && (
                  <div>
                    {courseFilter === "all" && (
                      <p className="text-xs font-semibold mb-2.5 px-1" style={{ color: "var(--mongle-brown)", opacity: 0.4 }}>
                        내 편집
                      </p>
                    )}
                    <div className="flex flex-col gap-3">
                      {dEditedCourseList.map((course, index) => (
                        <div key={course.id} style={{ animation: "fadeUp 0.45s ease both", animationDelay: `${index * 0.04}s` }}>
                          <UserCourseCard
                            course={course}
                            badge={{ icon: "edited", label: "내 편집" }}
                            onDelete={() => handleDeleteUserCourse(course.id, "edited")}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* 장소 탭 */}
        {activeTab === "places" && (
          <>

            {dPlaceList.length === 0 ? (
              <EmptyStatePlaces />
            ) : (
              <div
                className="grid grid-cols-2 gap-3"
                role="list"
                aria-label="저장한 장소 목록"
              >
                {dPlaceList.map((place, index) => (
                  <PlaceCardItemClient
                    key={place.id}
                    id={place.id}
                    name={place.name}
                    district={place.district ?? ""}
                    category={place.category ?? ""}
                    tags={place.tags ?? []}
                    imageUrl={place.images?.[0] ?? null}
                    index={index}
                    initialSaved={true}
                    animationMode="enter"
                    onUnsave={handleUnsavePlace}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 동네 필터 바텀시트 */}
      {districtSheetOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.3)" }}
            onClick={() => setDistrictSheetOpen(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
          >
          <div
            className="w-full max-w-xl rounded-t-3xl"
            style={{ background: "white", boxShadow: "0 -4px 24px rgba(92,61,46,0.12)", paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <span className="text-base font-bold" style={{ color: "var(--mongle-brown)" }}>동네 선택</span>
              <button
                onClick={() => setDistrictSheetOpen(false)}
                className="p-1 rounded-full hover:opacity-70"
                style={{ color: "var(--mongle-brown)" }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-4 pb-8 flex flex-col gap-1" style={{ maxHeight: "60vh", overflowY: "auto" }}>
              <button
                onClick={() => { setDistrictFilter(null); setDistrictSheetOpen(false); }}
                className="flex items-center justify-between w-full px-4 py-3 rounded-2xl text-sm font-semibold transition-all"
                style={
                  districtFilter === null
                    ? { background: "rgba(255,140,105,0.12)", color: "var(--mongle-peach-dark)" }
                    : { color: "var(--mongle-brown)" }
                }
              >
                전체 동네
                {districtFilter === null && <span className="text-xs" style={{ color: "var(--mongle-peach)" }}>✓</span>}
              </button>
              {availableDistricts.map((d) => (
                <button
                  key={d}
                  onClick={() => { setDistrictFilter(d); setDistrictSheetOpen(false); }}
                  className="flex items-center justify-between w-full px-4 py-3 rounded-2xl text-sm transition-all"
                  style={
                    districtFilter === d
                      ? { background: "rgba(255,140,105,0.12)", color: "var(--mongle-peach-dark)", fontWeight: 600 }
                      : { color: "var(--mongle-brown)" }
                  }
                >
                  <span className="flex items-center gap-2">
                    <MapPin size={13} style={{ opacity: 0.5 }} />
                    {d}
                  </span>
                  {districtFilter === d && <span className="text-xs" style={{ color: "var(--mongle-peach)" }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
          </div>
        </>
      )}

      {/* 언두 토스트 */}
      {undoItem && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-2xl px-4 py-3 animate-slideUp"
          style={{
            background: "rgba(46,28,18,0.92)",
            backdropFilter: "blur(8px)",
            zIndex: 60,
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            whiteSpace: "nowrap",
          }}
        >
          <BookmarkX size={16} style={{ color: "rgba(255,255,255,0.7)" }} />
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
            {undoItem.type === "edited" ? "편집 코스가 삭제됐어요"
              : undoItem.type === "ai" ? "추천 코스가 삭제됐어요"
              : undoItem.type === "course" ? "코스 저장 해제됨"
              : "장소 저장 해제됨"}
          </span>
          <button
            onClick={handleUndo}
            className="text-sm font-semibold"
            style={{ color: "var(--mongle-peach)" }}
          >
            되돌리기
          </button>
        </div>
      )}
    </main>
  );
}

/* ── 동네 필터 버튼 ───────────────────────────────────────────────────────── */
function DistrictFilterButton({
  selected,
  onOpen,
  onClear,
}: {
  selected: string | null;
  onOpen: () => void;
  onClear: () => void;
}) {
  return (
    <button
      onClick={selected ? undefined : onOpen}
      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
      style={
        selected
          ? { background: "var(--mongle-peach)", color: "white" }
          : { background: "white", color: "var(--mongle-brown)", border: "1px solid rgba(92,61,46,0.2)" }
      }
    >
      <MapPin size={10} />
      {selected ? (
        <>
          {selected}
          <span
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="flex items-center justify-center rounded-full ml-0.5 cursor-pointer"
            style={{ width: 14, height: 14, background: "rgba(255,255,255,0.3)" }}
          >
            <X size={9} />
          </span>
        </>
      ) : (
        <>
          동네
          <ChevronDown size={11} />
        </>
      )}
    </button>
  );
}

/* ── 내 코스 카드 (AI / 편집) ─────────────────────────────────────────────── */
function UserCourseCard({
  course,
  badge,
  onDelete,
}: {
  course: { id: string; title: string; description: string | null; district: string | null; theme_tag: string | null; duration_min: number | null; place_count: number | null };
  badge: { icon: "ai" | "edited"; label: string };
  onDelete: () => void;
}) {
  const durationLabel = course.duration_min
    ? course.duration_min >= 60
      ? `${Math.floor(course.duration_min / 60)}시간${course.duration_min % 60 ? ` ${course.duration_min % 60}분` : ""}`
      : `${course.duration_min}분`
    : null;

  return (
    <div
      className="flex items-center gap-3 rounded-2xl p-4"
      style={{ background: "white", boxShadow: "0 2px 12px rgba(92,61,46,0.07)" }}
    >
      <Link href={`/courses/${course.id}`} className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          {badge.icon === "ai"
            ? <Sparkles size={11} style={{ color: "var(--mongle-peach)" }} />
            : <Pencil size={11} style={{ color: "var(--mongle-brown)", opacity: 0.5 }} />
          }
          <span className="text-xs font-medium" style={{ color: badge.icon === "ai" ? "var(--mongle-peach)" : "var(--mongle-brown)", opacity: badge.icon === "ai" ? 1 : 0.5 }}>
            {badge.label}
          </span>
          {course.theme_tag && (
            <span className="text-xs" style={{ color: "var(--mongle-brown)", opacity: 0.4 }}>· {course.theme_tag}</span>
          )}
        </div>
        <p className="font-semibold truncate text-sm" style={{ color: "var(--mongle-brown)" }}>
          {course.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--mongle-brown)", opacity: 0.45 }}>
          {[course.district, course.place_count ? `${course.place_count}곳` : null, durationLabel]
            .filter(Boolean).join(" · ")}
        </p>
      </Link>
      <button
        onClick={onDelete}
        className="flex-shrink-0 p-2 rounded-full transition-opacity hover:opacity-70 active:scale-95"
        style={{ background: "rgba(92,61,46,0.06)" }}
        aria-label="코스 삭제"
      >
        <Trash2 size={14} style={{ color: "rgba(92,61,46,0.45)" }} />
      </button>
    </div>
  );
}

/* ── 빈 상태 ────────────────────────────────────────────────────────────────── */
function EmptyState({ filter }: { filter: CourseFilter }) {
  const messages: Record<CourseFilter, { title: string; desc: string }> = {
    all:     { title: "저장한 코스가 없어요", desc: "마음에 드는 코스를 저장하거나 AI 추천을 받아보세요" },
    curated: { title: "저장한 코스가 없어요", desc: "마음에 드는 코스를 저장하면 여기서 볼 수 있어요" },
    ai:      { title: "추천받은 코스가 없어요", desc: "AI 맞춤 코스를 추천받아보세요" },
    edited:  { title: "편집한 코스가 없어요", desc: "코스 상세에서 편집하고 저장하면 여기에 모여요" },
  };
  const { title, desc } = messages[filter];

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, rgba(255,140,105,0.15) 0%, rgba(255,200,170,0.25) 100%)" }}
      >
        <RouteIcon size={32} style={{ color: "var(--mongle-peach)" }} />
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-bold" style={{ color: "var(--mongle-brown)" }}>{title}</p>
        <p className="text-sm" style={{ color: "var(--mongle-brown)", opacity: 0.5 }}>{desc}</p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {(filter === "all" || filter === "ai") && (
          <Link
            href="/courses/new"
            className="flex items-center justify-center gap-1.5 px-6 py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "var(--mongle-peach)" }}
          >
            AI 맞춤 코스 추천받기
          </Link>
        )}
        <Link
          href="/courses"
          className="flex items-center justify-center px-6 py-3 rounded-2xl text-sm font-semibold transition-all hover:opacity-80"
          style={{ background: "rgba(92,61,46,0.07)", color: "var(--mongle-brown)" }}
        >
          전체 코스 보기
        </Link>
      </div>
    </div>
  );
}

function EmptyStatePlaces() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, rgba(255,140,105,0.15) 0%, rgba(255,200,170,0.25) 100%)" }}
      >
        <MapPin size={32} style={{ color: "var(--mongle-peach)" }} />
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-bold" style={{ color: "var(--mongle-brown)" }}>저장한 장소가 없어요</p>
        <p className="text-sm" style={{ color: "var(--mongle-brown)", opacity: 0.5 }}>둘러보다가 마음에 드는 장소를 저장해보세요</p>
      </div>
      <Link
        href="/places"
        className="flex items-center justify-center px-6 py-3 rounded-2xl text-sm font-semibold transition-all hover:opacity-80"
        style={{ background: "rgba(92,61,46,0.07)", color: "var(--mongle-brown)" }}
      >
        장소 둘러보기
      </Link>
    </div>
  );
}
