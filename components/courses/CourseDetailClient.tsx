"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  Heart, Share2, Clock, MapPin, Sparkles,
  ChevronLeft, Check, Zap, GripVertical, Footprints,
  Pencil, X, Minus, Plus, Navigation, RefreshCw,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { CourseMultiMap, CourseMapPlace } from "./CourseMultiMap";
import { PlacePickerSheet } from "./PlacePickerSheet";
import { PickerPlace } from "@/lib/mock/places";
import { saveCourseEdit } from "@/app/actions/saved";
import { createClient } from "@/lib/supabase/client";

/* ── 상수 ─────────────────────────────────────────────────────────────────── */
const CATEGORY_LABELS: Record<string, string> = {
  cafe: "카페", restaurant: "음식점", bookstore: "서점",
  gallery: "갤러리", park: "공원", popup: "팝업", shop: "소품샵",
};
const PARTY_LABEL: Record<string, string> = { solo: "혼자", duo: "둘이", group: "셋+" };
const STAY_LABEL: Record<string, string> = { short: "가볍게", half: "반나절", full: "하루 종일" };

/* ── 타입 ─────────────────────────────────────────────────────────────────── */
export interface CourseDetailPlace {
  order_index: number;
  visit_duration_min: number | null;
  note: string | null;
  places: {
    id: string;
    name: string;
    category: string;
    address: string;
    district: string | null;
    lat: number;
    lng: number;
    images: string[] | null;
  };
}

interface CourseDetailClientProps {
  course: {
    id: string;
    title: string;
    description: string | null;
    theme_tag: string | null;
    district: string | null;
    duration_min: number | null;
    place_count: number | null;
    cover_image: string | null;
    is_editor_pick: boolean;
    has_popup: boolean;
    expires_at: string | null;
  };
  coursePlaces: CourseDetailPlace[];
  party?: string;
  stay?: string;
  initialSaved?: boolean;
  aiReason?: string;
  isUserOwned?: boolean;
  isAlreadyEdited?: boolean;
}

/* ── 유틸 ─────────────────────────────────────────────────────────────────── */
function formatDuration(min: number) {
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function sortedByOrder(places: CourseDetailPlace[], stay?: string) {
  const sorted = [...places].sort((a, b) => a.order_index - b.order_index);
  return stay === "short" ? sorted.slice(0, 2) : sorted;
}

/* ── 정렬 가능한 장소 카드 ──────────────────────────────────────────────────── */
interface SortablePlaceCardProps {
  cp: CourseDetailPlace;
  displayOrder: number;
  walkMin: number | null;
  isLast: boolean;
  isDragging?: boolean;
  isEditMode: boolean;
  isPendingDelete: boolean;
  canDelete: boolean;
  isNewlyAdded: boolean;
  onDeleteClick: (id: string) => void;
  onDeleteDisabled: () => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: (id: string) => void;
}

function SortablePlaceCard({
  cp, displayOrder, walkMin, isLast, isDragging,
  isEditMode, isPendingDelete, canDelete, isNewlyAdded,
  onDeleteClick, onDeleteDisabled, onDeleteConfirm, onDeleteCancel,
}: SortablePlaceCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSelfDragging } =
    useSortable({ id: cp.places.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSelfDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-0">
      {/* 타임라인 레일 */}
      <div className="flex flex-col items-center" style={{ width: 44, flexShrink: 0 }}>
        <div
          className="flex items-center justify-center rounded-full text-xs font-bold text-white z-10 transition-all duration-200"
          style={{
            width: 28, height: 28,
            background: isPendingDelete ? "#506070" : "var(--mongle-peach)",
            boxShadow: isPendingDelete
              ? "0 2px 8px rgba(224,97,58,0.4)"
              : "0 2px 8px rgba(123,143,166,0.4)",
          }}
        >
          {displayOrder}
        </div>
        {!isLast && (
          <div style={{ width: 2, flex: 1, minHeight: 56, borderLeft: "2px dashed rgba(123,143,166,0.3)", marginTop: 4 }} />
        )}
      </div>

      {/* 카드 + 도보 안내 */}
      <div className={cn("flex-1 min-w-0", isLast ? "pb-2" : "pb-0")}>

        {/* 삭제 확인 오버레이 */}
        {isPendingDelete ? (
          <div
            className="flex items-center justify-between rounded-2xl p-4 ml-2"
            style={{
              background: "#FFF5F3",
              border: "1.5px solid rgba(224,97,58,0.25)",
            }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: "#506070" }}>
                {cp.places.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#506070", opacity: 0.7 }}>
                코스에서 뺄까요?
              </p>
            </div>
            <div className="flex items-center gap-2 ml-3 shrink-0">
              <button
                onClick={() => onDeleteCancel(cp.places.id)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors hover:bg-black/5"
                style={{ color: "var(--mongle-brown)", background: "white", border: "1px solid rgba(54,69,84,0.12)" }}
              >
                아니요
              </button>
              <button
                onClick={() => onDeleteConfirm(cp.places.id)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: "#506070" }}
              >
                빼기
              </button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "flex gap-3 rounded-2xl p-3.5 ml-2 transition-all",
              isDragging ? "shadow-xl scale-[1.02]" : ""
            )}
            style={{ background: "white", border: "1px solid rgba(54,69,84,0.07)" }}
          >
            {/* 편집 모드: 삭제 버튼 (왼쪽) */}
            {isEditMode && (
              <button
                onClick={() => canDelete ? onDeleteClick(cp.places.id) : onDeleteDisabled()}
                className={cn(
                  "flex-shrink-0 flex items-center self-center w-6 h-6 rounded-full transition-all duration-150",
                  canDelete ? "hover:scale-110 active:scale-95" : "opacity-40"
                )}
                style={{ background: canDelete ? "#506070" : "rgba(54,69,84,0.15)" }}
                aria-label="장소 빼기"
              >
                <Minus size={13} className="m-auto" style={{ color: "white" }} />
              </button>
            )}

            {/* 텍스트 */}
            <Link
              href={`/places/${cp.places.id}`}
              className={cn(
                "flex flex-1 min-w-0 gap-3 transition-all",
                isEditMode && "pointer-events-none"
              )}
              onClick={(e) => isEditMode && e.preventDefault()}
            >
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: "var(--mongle-warm)", color: "var(--mongle-brown)" }}
                  >
                    {CATEGORY_LABELS[cp.places.category] ?? cp.places.category}
                  </span>
                  {isNewlyAdded && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-bold text-white"
                      style={{ background: "var(--mongle-peach)", fontSize: 10 }}
                    >
                      NEW
                    </span>
                  )}
                  {cp.visit_duration_min && (
                    <span className="text-xs flex items-center gap-0.5" style={{ color: "var(--mongle-brown)", opacity: 0.45 }}>
                      <Clock size={10} />
                      {formatDuration(cp.visit_duration_min)}
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold leading-snug" style={{ color: "var(--mongle-brown)" }}>
                  {cp.places.name}
                </p>
                {cp.note && (
                  <p className="text-xs leading-relaxed" style={{ color: "var(--mongle-brown)", opacity: 0.58 }}>
                    {cp.note}
                  </p>
                )}
              </div>

              {/* 썸네일 */}
              <PlaceThumbnail images={cp.places.images} name={cp.places.name} category={cp.places.category} />
            </Link>

            {/* 편집 모드: 드래그 핸들 (오른쪽) */}
            {isEditMode && (
              <div
                {...attributes}
                {...listeners}
                suppressHydrationWarning
                className="flex-shrink-0 flex items-center justify-center self-stretch w-8 cursor-grab active:cursor-grabbing touch-none"
                role="button"
                aria-label="순서 변경"
              >
                <GripVertical size={16} style={{ color: "var(--mongle-brown)", opacity: 0.3 }} />
              </div>
            )}
          </div>
        )}

        {/* 도보 이동 시간 — 편집 모드에서는 삽입 핸들이 이 역할을 대체 */}
        {!isLast && !isPendingDelete && !isEditMode && (
          <div className="flex items-center gap-1.5 ml-5 mt-2 mb-1.5">
            <Footprints size={12} style={{ color: "var(--mongle-peach)", opacity: 0.7 }} />
            <span className="text-[11px]" style={{ color: "var(--mongle-brown)", opacity: 0.45 }}>
              {walkMin != null ? `도보 약 ${walkMin}분` : "도보 이동"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 삽입 핸들 (편집 모드, 카드 사이) ────────────────────────────────────── */
function InsertHandle({
  isLast,
  onClick,
}: {
  isLast: boolean;
  onClick: () => void;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="w-full flex items-center gap-0 animate-fadeIn"
      style={{ height: 40 }}
      aria-label={isLast ? "코스 끝에 추가하기" : "여기에 추가하기"}
    >
      {/* 왼쪽 점선 */}
      <div
        className="flex-1"
        style={{
          height: 1,
          borderTop: "1.5px dashed rgba(123,143,166,0.4)",
        }}
      />
      {/* 중앙 버튼 */}
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-150"
        style={{
          width: 28,
          height: 28,
          background: pressed ? "#7B8FA6" : "#F4F6F8",
          border: "1.5px solid #7B8FA6",
          marginLeft: 6,
          marginRight: 4,
        }}
      >
        <Plus size={14} color={pressed ? "white" : "#7B8FA6"} />
      </div>
      {/* 레이블 */}
      <span
        className="flex-shrink-0 text-[11px] font-medium mr-2"
        style={{ color: "#7B8FA6" }}
      >
        {isLast ? "코스 끝에 추가하기" : "여기에 추가하기"}
      </span>
      {/* 오른쪽 점선 */}
      <div
        className="flex-1"
        style={{
          height: 1,
          borderTop: "1.5px dashed rgba(123,143,166,0.4)",
        }}
      />
    </button>
  );
}

/* ── 장소 썸네일 ──────────────────────────────────────────────────────────── */
function PlaceThumbnail({
  images, name, category,
}: {
  images: string[] | null;
  name: string;
  category: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const src = images?.[0];

  if (!src) {
    const bg: Record<string, string> = {
      cafe: "#F0F3F6", bookstore: "#E8F4F0", gallery: "#F0EBF8",
      park: "#E8F4E8", popup: "#F0F3F6", shop: "#FBF0E6", restaurant: "#FFF0E0",
    };
    return (
      <div
        className="flex-shrink-0 rounded-xl"
        style={{ width: 68, height: 68, background: bg[category] ?? "var(--mongle-warm)" }}
      />
    );
  }

  return (
    <div className="flex-shrink-0 rounded-xl overflow-hidden relative" style={{ width: 68, height: 68 }}>
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#dce3ea] via-[#edf1f5] to-[#dce3ea] bg-[length:200%_100%] animate-shimmer" />
      )}
      <Image
        src={src}
        alt={name}
        width={68}
        height={68}
        className={cn("object-cover w-full h-full transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
        unoptimized
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

/* ── 메인 컴포넌트 ────────────────────────────────────────────────────────── */
export function CourseDetailClient({
  course, coursePlaces, party, stay, initialSaved = false, aiReason, isUserOwned = false, isAlreadyEdited = false,
}: CourseDetailClientProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // 편집 모드
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);

  // 장소 추가 시트
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [insertAfterIndex, setInsertAfterIndex] = useState<number>(-1);

  // 실행 취소 토스트
  const [minPlaceToast, setMinPlaceToast] = useState(false);
  const minPlaceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMinPlaceToast = useCallback(() => {
    if (minPlaceTimerRef.current) clearTimeout(minPlaceTimerRef.current);
    setMinPlaceToast(true);
    minPlaceTimerRef.current = setTimeout(() => setMinPlaceToast(false), 2000);
  }, []);

  const [undoToast, setUndoToast] = useState<{
    placeId: string;
    placeName: string;
    index: number;
  } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 새로 추가된 장소 id 추적 (NEW 뱃지 표시)
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());

  // 타임라인 장소 목록
  const [places, setPlaces] = useState(() => sortedByOrder(coursePlaces, stay));
  // 편집 취소를 위한 스냅샷
  const [placesSnapshot, setPlacesSnapshot] = useState<typeof places | null>(null);

  // 도보 소요 시간
  const [walkMins, setWalkMins] = useState<(number | null)[]>([]);
  const fetchedRef = useRef(false);

  const fetchWalkTimes = useCallback(async (ps: CourseDetailPlace[]) => {
    const waypoints = ps.filter((p) => p.places.lat && p.places.lng)
      .map((p) => ({ lat: p.places.lat, lng: p.places.lng }));
    if (waypoints.length < 2) { setWalkMins([]); return; }
    try {
      const res = await fetch("/api/walking-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waypoints }),
      });
      const { durations } = await res.json();
      setWalkMins(durations ?? []);
    } catch {
      setWalkMins([]);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchWalkTimes(places);
  }, [places, fetchWalkTimes]);

  // 편집 모드 진입/취소
  const enterEditMode = useCallback(() => {
    setPlacesSnapshot([...places]);
    setIsEditMode(true);
  }, [places]);

  const cancelEditMode = useCallback(() => {
    if (placesSnapshot) {
      setPlaces(placesSnapshot);
      fetchWalkTimes(placesSnapshot);
    }
    setPendingDeleteId(null);
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    setIsSheetOpen(false);
    setUndoToast(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setNewlyAddedIds(new Set());
    setIsEditMode(false);
    setPlacesSnapshot(null);
  }, [placesSnapshot, fetchWalkTimes]);

  const saveEditMode = useCallback(async () => {
    // 로그인 검증
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    setPendingDeleteId(null);
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    setIsSheetOpen(false);
    setUndoToast(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setNewlyAddedIds(new Set());
    setIsEditMode(false);
    setPlacesSnapshot(null);
    setIsSaving(true);

    const result = await saveCourseEdit(
      course.id,
      places.map((p) => ({
        placeId: p.places.id,
        visitDurationMin: p.visit_duration_min,
        note: p.note,
      })),
      !(isUserOwned && isAlreadyEdited)  // 이미 포크된 편집본만 제자리 업데이트, 나머지는 포크
    );
    setIsSaving(false);

    if (result.error) {
      console.error("[saveEditMode]", result.error);
      return;
    }

    if (result.newCourseId && result.newCourseId !== course.id) {
      setSaveSuccessToast(true);
      router.push(`/courses/${result.newCourseId}`);
    }
  }, [course.id, isUserOwned, places, router]);

  // 삭제 흐름
  const handleDeleteClick = useCallback((id: string) => {
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    setPendingDeleteId(id);
    // 3초 후 자동 취소
    deleteTimerRef.current = setTimeout(() => {
      setPendingDeleteId(null);
    }, 3000);
  }, []);

  const handleDeleteConfirm = useCallback((id: string) => {
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    setPendingDeleteId(null);
    setPlaces((prev) => {
      const next = prev.filter((p) => p.places.id !== id);
      fetchWalkTimes(next);
      return next;
    });
  }, [fetchWalkTimes]);

  const handleDeleteCancel = useCallback((id: string) => {
    if (id === pendingDeleteId) {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      setPendingDeleteId(null);
    }
  }, [pendingDeleteId]);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  // 장소 추가 핸들러
  const handleAddPlace = useCallback(
    (pickerPlace: PickerPlace, afterIndex: number) => {
      setIsSheetOpen(false);

      const newCp: CourseDetailPlace = {
        order_index: afterIndex + 1,
        visit_duration_min: null,
        note: null,
        places: {
          id: pickerPlace.id,
          name: pickerPlace.name,
          category: pickerPlace.category,
          address: pickerPlace.address,
          district: course.district,
          lat: pickerPlace.lat,
          lng: pickerPlace.lng,
          images: pickerPlace.images,
        },
      };

      setPlaces((prev) => {
        const next = [
          ...prev.slice(0, afterIndex + 1),
          newCp,
          ...prev.slice(afterIndex + 1),
        ];
        fetchWalkTimes(next);
        return next;
      });

      setNewlyAddedIds((prev) => new Set(prev).add(pickerPlace.id));

      // 실행 취소 토스트 표시
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setUndoToast({
        placeId: pickerPlace.id,
        placeName: pickerPlace.name,
        index: afterIndex + 1,
      });
      undoTimerRef.current = setTimeout(() => {
        setUndoToast(null);
      }, 3000);
    },
    [course.district, fetchWalkTimes]
  );

  // 장소 추가 취소 핸들러
  const handleUndoAdd = useCallback(() => {
    if (!undoToast) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoToast(null);

    const { placeId } = undoToast;
    setPlaces((prev) => {
      const next = prev.filter((p) => p.places.id !== placeId);
      fetchWalkTimes(next);
      return next;
    });
    setNewlyAddedIds((prev) => {
      const next = new Set(prev);
      next.delete(placeId);
      return next;
    });
  }, [undoToast, fetchWalkTimes]);

  // 드래그 센서
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(e.active.id as string);
  }, []);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setPlaces((prev) => {
      const oldIdx = prev.findIndex((p) => p.places.id === active.id);
      const newIdx = prev.findIndex((p) => p.places.id === over.id);
      const next = arrayMove(prev, oldIdx, newIdx);
      fetchWalkTimes(next);
      return next;
    });
  }, [fetchWalkTimes]);

  // 지도용 장소 데이터
  const mapPlaces: CourseMapPlace[] = places
    .filter((cp) => cp.places.lat && cp.places.lng)
    .map((cp, i) => ({ name: cp.places.name, lat: cp.places.lat, lng: cp.places.lng, order: i + 1 }));

  const handleSave = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isSaved;
    setIsSaved(next);
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 450);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsSaved(!next); router.push("/login"); return; } // 로그인 안 됐으면 롤백 후 로그인 이동

      if (next) {
        await supabase.from("saved_courses").insert({ user_id: user.id, course_id: course.id });
      } else {
        await supabase.from("saved_courses").delete()
          .eq("user_id", user.id).eq("course_id", course.id);
      }
    } catch {
      setIsSaved(!next); // 오류 시 롤백
    }
  }, [isSaved, course.id]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try { await navigator.share({ title: course.title, text: `${course.title} — 몽글 코스`, url }); return; }
      catch { /* fallback */ }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [course.title]);

  // stay URL 파라미터 → recommend API duration 값 변환
  const STAY_TO_DURATION: Record<string, string> = { short: "short", half: "half", full: "day" };

  const handleRegenerate = useCallback(async () => {
    if (isRegenerating || !party) return;
    setIsRegenerating(true);
    try {
      const res = await fetch("/api/courses/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          party,
          duration: STAY_TO_DURATION[stay ?? "half"] ?? "half",
          district: course.district ?? undefined,
        }),
      });
      const { courseId, reason } = await res.json() as { courseId: string | null; reason: string | null };
      if (!courseId) {
        setIsRegenerating(false);
        return;
      }
      const params = new URLSearchParams();
      if (party) params.set("party", party);
      if (stay) params.set("stay", stay);
      if (reason) params.set("ai_reason", reason);
      router.replace(`/courses/${courseId}?${params.toString()}`);
    } catch {
      setIsRegenerating(false);
    }
  }, [isRegenerating, party, stay, course.district, router]);

  const handleOpenNaverMaps = useCallback(() => {
    const pts = places.filter((cp) => cp.places.lat && cp.places.lng);
    if (pts.length === 0) return;

    const first = pts[0].places;
    const last = pts[pts.length - 1].places;
    const middle = pts.slice(1, -1);

    // 모바일: nmap:// 앱 딥링크
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    if (isMobile) {
      const params = new URLSearchParams({
        slng: String(first.lng), slat: String(first.lat), sname: first.name,
        dlng: String(last.lng),  dlat: String(last.lat),  dname: last.name,
        v: "1",
      });
      if (middle.length > 0) {
        params.set("waypoints", middle.map((cp) => `${cp.places.lng},${cp.places.lat}`).join("|"));
      }
      window.location.href = `nmap://route/pedestrian?${params.toString()}`;
      setTimeout(() => { window.open("https://map.naver.com", "_blank"); }, 1500);
      return;
    }

    // 데스크탑: 네이버 지도 웹
    // URL 구조: /p/directions/{출발}/{도착}/{경유(없으면 -)}/walk
    // 경유지는 ":" 로 구분, mode가 반드시 4번째 세그먼트여야 함
    const encode = (p: typeof first) =>
      `${p.lng},${p.lat},${encodeURIComponent(p.name)}`;
    const via = middle.length > 0
      ? middle.map((cp) => encode(cp.places)).join(":")
      : "-";
    window.open(
      `https://map.naver.com/p/directions/${encode(first)}/${encode(last)}/${via}/walk`,
      "_blank"
    );
  }, [places]);

  const expiresInDays = course.expires_at ? daysUntil(course.expires_at) : null;
  const activePlace = activeId ? places.find((p) => p.places.id === activeId) : null;

  return (
    // 스크롤 콘텐츠가 fixed 액션바 + BottomTabBar에 가려지지 않도록 충분한 paddingBottom 확보
    // 액션바 높이(≈68px) + BottomTabBar 높이(≈62px) + safe-area
    // md 이상에서는 BottomTabBar가 숨겨지므로 액션바 높이만 적용
    <main
      className="min-h-screen pb-[140px] md:pb-4"
      style={{
        background: "var(--mongle-cream)",
      }}
    >

      {/* ── 편집 모드 상단 배너 ── */}
      {isEditMode && (
        <div
          className="fixed top-12 md:top-16 left-0 right-0 z-40 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold"
          style={{ background: "rgba(224,97,58,0.12)", color: "#C0522A", borderBottom: "1px solid rgba(224,97,58,0.2)" }}
        >
          <Pencil size={13} />
          편집 중 — 내 코스를 만들고 있어요
        </div>
      )}

      {/* ── 지도 (상단) ── */}
      <div className="relative" style={{ paddingTop: isEditMode ? "2.5rem" : "0" }}>
        <div className="absolute top-0 left-0 right-0 z-10 pt-3 px-4 flex items-center justify-between pointer-events-none">
          {!isEditMode && (
            <Link
              href="/courses"
              className="pointer-events-auto inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-full"
              style={{ background: "rgba(244,246,248,0.92)", color: "var(--mongle-brown)", backdropFilter: "blur(8px)" }}
            >
              <ChevronLeft size={15} />
              코스 목록
            </Link>
          )}
          {(party || stay) && (
            <div
              className="pointer-events-auto flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(123,143,166,0.15)", color: "var(--mongle-peach-dark)", backdropFilter: "blur(8px)" }}
            >
              <Zap size={11} />
              {party ? PARTY_LABEL[party] : ""}
              {party && stay ? " · " : ""}
              {stay ? STAY_LABEL[stay] : ""}
            </div>
          )}
        </div>

        {mapPlaces.length > 0
          ? <CourseMultiMap places={mapPlaces} height={300} />
          : <div className="w-full" style={{ height: 300, background: "var(--mongle-warm)" }} />
        }
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-28 space-y-5 pt-4">

        {/* ── AI 추천 이유 배너 ── */}
        {aiReason && (
          <div
            className="flex items-start gap-2.5 px-4 py-3 rounded-2xl text-sm"
            style={{ background: "rgba(123,143,166,0.1)", color: "var(--mongle-brown)" }}
          >
            <Sparkles size={15} className="flex-shrink-0 mt-0.5" style={{ color: "var(--mongle-peach)" }} />
            <div>
              <span className="text-xs font-semibold block mb-0.5" style={{ color: "var(--mongle-peach)" }}>몽글 AI 추천 이유</span>
              <span className="leading-snug">{aiReason}</span>
            </div>
          </div>
        )}

        {/* ── 코스 정보 카드 ── */}
        <div className="rounded-2xl px-5 py-4 space-y-3" style={{ background: "white", boxShadow: "0 2px 12px rgba(54,69,84,0.07)" }}>
          <div className="flex flex-wrap gap-1.5">
            {course.theme_tag && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: "var(--mongle-warm)", color: "var(--mongle-brown)" }}>
                {course.theme_tag}
              </span>
            )}
            {course.has_popup && expiresInDays != null && expiresInDays <= 7 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background: "#506070" }}>
                D-{expiresInDays}
              </span>
            )}
          </div>

          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold leading-snug" style={{ color: "var(--mongle-brown)" }}>
              {course.title}
            </h1>
            {party && (
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-70 disabled:opacity-40 active:scale-95"
                style={{ border: "1px solid var(--mongle-peach)", color: "var(--mongle-brown)", background: "transparent" }}
              >
                <RefreshCw size={11} className={isRegenerating ? "animate-spin" : ""} />
                {isRegenerating ? "추천 중…" : "다시"}
              </button>
            )}
          </div>
          {course.description && (
            <p className="text-sm leading-relaxed" style={{ color: "var(--mongle-brown)", opacity: 0.62 }}>
              {course.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 pt-0.5">
            {course.district && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--mongle-brown)", opacity: 0.5 }}>
                <MapPin size={12} />{course.district}
              </span>
            )}
            {course.duration_min && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--mongle-brown)", opacity: 0.5 }}>
                <Clock size={12} />{formatDuration(course.duration_min)}
              </span>
            )}
            {course.place_count != null && course.place_count > 0 && (
              <span className="text-xs" style={{ color: "var(--mongle-brown)", opacity: 0.5 }}>
                {course.place_count}곳
              </span>
            )}
            {mounted && (
              <button
                onClick={handleOpenNaverMaps}
                className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70 active:opacity-50 ml-auto"
                style={{ color: "#3D8C5C" }}
              >
                <Navigation size={11} />
                네이버 지도로 경로 보기
              </button>
            )}
          </div>
        </div>

        {stay === "short" && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm" style={{ background: "rgba(123,143,166,0.1)", color: "var(--mongle-peach-dark)" }}>
            <Zap size={14} />
            <span className="font-medium">핵심 2곳만 골랐어요 — 2시간 이내 버전</span>
          </div>
        )}

        {/* ── 타임라인 ── */}
        <div>
          <p className="text-xs font-semibold px-1 mb-3 flex items-center gap-1.5" style={{ color: "var(--mongle-brown)", opacity: 0.45 }}>
            {isEditMode ? (
              <><Plus size={12} />⊕로 추가, ─로 빼기, 오른쪽 핸들로 순서 변경</>
            ) : null}
          </p>

          {/* 재생성 중 스켈레톤 */}
          {isRegenerating && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: places.length || 3 }).map((_, i) => (
                <div key={i} className="flex gap-0">
                  <div className="flex flex-col items-center" style={{ width: 44, flexShrink: 0 }}>
                    <div className="rounded-full animate-pulse" style={{ width: 28, height: 28, background: "rgba(123,143,166,0.25)", animationDelay: `${i * 80}ms` }} />
                    {i < (places.length || 3) - 1 && (
                      <div style={{ width: 2, flex: 1, minHeight: 56, borderLeft: "2px dashed rgba(123,143,166,0.15)", marginTop: 4 }} />
                    )}
                  </div>
                  <div className="flex-1 ml-2 rounded-2xl animate-pulse" style={{ height: 80, background: "rgba(123,143,166,0.08)", animationDelay: `${i * 80}ms` }} />
                </div>
              ))}
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
          {!isRegenerating && (<>
            <SortableContext
              items={places.map((p) => p.places.id)}
              strategy={verticalListSortingStrategy}
            >
              {places.map((cp, i) => (
                <div key={cp.places.id}>
                  <SortablePlaceCard
                    cp={cp}
                    displayOrder={i + 1}
                    walkMin={walkMins[i] ?? null}
                    isLast={i === places.length - 1}
                    isDragging={activeId === cp.places.id}
                    isEditMode={isEditMode}
                    isPendingDelete={pendingDeleteId === cp.places.id}
                    canDelete={places.length > 2}
                    isNewlyAdded={newlyAddedIds.has(cp.places.id)}
                    onDeleteClick={handleDeleteClick}
                    onDeleteDisabled={showMinPlaceToast}
                    onDeleteConfirm={handleDeleteConfirm}
                    onDeleteCancel={handleDeleteCancel}
                  />
                  {/* 편집 모드: 카드 사이 삽입 핸들 */}
                  {isEditMode && (
                    <InsertHandle
                      isLast={i === places.length - 1}
                      onClick={() => {
                        setInsertAfterIndex(i);
                        setIsSheetOpen(true);
                      }}
                    />
                  )}
                </div>
              ))}
            </SortableContext>

            <DragOverlay>
              {activePlace && (
                <div
                  className="flex gap-3 rounded-2xl p-3.5 shadow-2xl"
                  style={{ background: "white", border: "1.5px solid var(--mongle-peach-light)", width: "calc(100% - 44px)", marginLeft: 46 }}
                >
                  <GripVertical size={16} style={{ color: "var(--mongle-brown)", opacity: 0.3 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: "var(--mongle-brown)" }}>
                      {activePlace.places.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--mongle-brown)", opacity: 0.5 }}>
                      {CATEGORY_LABELS[activePlace.places.category]}
                    </p>
                  </div>
                  <PlaceThumbnail images={activePlace.places.images} name={activePlace.places.name} category={activePlace.places.category} />
                </div>
              )}
            </DragOverlay>
          </>)}
          </DndContext>
        </div>

        {stay === "short" && coursePlaces.length > 2 && (
          <Link
            href={`/courses/${course.id}?party=${party ?? ""}&stay=half`}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-medium hover:opacity-80"
            style={{ background: "white", color: "var(--mongle-brown)", border: "1px dashed rgba(54,69,84,0.2)" }}
          >
            + {coursePlaces.length - 2}곳 더 보기 (반나절 버전)
          </Link>
        )}
      </div>

      {/* ── 장소 추가 바텀 시트 ── */}
      <PlacePickerSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        insertAfterIndex={insertAfterIndex}
        coursePlaces={places}
        district={course.district ?? "서촌"}
        onAddPlace={handleAddPlace}
      />

      {/* ── 최소 장소 수 토스트 ── */}
      {minPlaceToast && (
        <div
          className="fixed left-4 right-4 z-[60] flex items-center justify-center gap-2 px-4 animate-slideUp"
          style={{
            bottom: 150,
            height: 44,
            borderRadius: 12,
            background: "rgba(54,69,84,0.9)",
          }}
        >
          <span className="text-sm text-white">코스에는 최소 2곳이 필요해요</span>
        </div>
      )}

      {/* ── 실행 취소 토스트 ── */}
      {undoToast && (
        <div
          className="fixed left-4 right-4 z-[60] flex items-center justify-between gap-3 px-4 transition-all"
          style={{
            bottom: 150,
            height: 48,
            borderRadius: 12,
            background: "rgba(54,69,84,0.9)",
          }}
        >
          <span className="text-sm text-white truncate">
            {undoToast.placeName} 추가됨
          </span>
          <button
            onClick={handleUndoAdd}
            className="flex-shrink-0 text-sm font-bold transition-all active:scale-95"
            style={{ color: "var(--mongle-peach)" }}
          >
            취소
          </button>
        </div>
      )}

      {/* ── 편집 코스 저장 완료 토스트 ── */}
      {saveSuccessToast && (
        <div
          className="fixed left-4 right-4 z-[60] flex items-center justify-between gap-3 px-4 py-3 rounded-2xl animate-slideUp"
          style={{
            bottom: 150,
            background: "rgba(46,28,18,0.92)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          }}
        >
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
            내 편집 코스로 저장됐어요!
          </span>
          <Link
            href="/saved"
            className="text-sm font-bold flex-shrink-0"
            style={{ color: "var(--mongle-peach)" }}
          >
            저장 목록 보기
          </Link>
        </div>
      )}

      {/* ── 하단 액션 바 ── */}
      {/*
        fixed + z-[45]: BottomTabBar(z-50)보다 아래 레이어에 고정
        paddingBottom: BottomTabBar 높이(62px) + safe-area 를 더해
        BottomTabBar가 액션바 하단 패딩 영역을 정확히 덮도록 함
        md:hidden인 BottomTabBar가 없는 데스크탑은 pb-4 그대로 유지
      */}
      <div
        className="fixed inset-x-0 bottom-0 z-[45] px-4 pt-2 pb-[70px] md:static md:pb-4"
        style={{
          background: "rgba(244,246,248,0.96)",
          backdropFilter: "blur(14px)",
          borderTop: "1px solid rgba(54,69,84,0.08)",
        }}
      >
        {isEditMode ? (
          /* 편집 모드 바 */
          <div className="mx-auto max-w-2xl flex gap-2.5">
            <button
              onClick={cancelEditMode}
              className="flex items-center justify-center gap-1.5 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all hover:bg-black/5 active:scale-95"
              style={{ background: "white", color: "var(--mongle-brown)", border: "1.5px solid rgba(54,69,84,0.12)" }}
            >
              <X size={15} />
              취소
            </button>
            <button
              onClick={saveEditMode}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
              style={{ background: "var(--mongle-peach)" }}
            >
              <Check size={15} />
              {isSaving ? "저장 중…" : "이 코스 저장하기"}
            </button>
          </div>
        ) : (
          /* 기본 바 */
          <div className="mx-auto max-w-2xl">
            <div className={cn("flex gap-2.5", isUserOwned && "justify-end")}>
              {!isUserOwned && (
                <button
                  onClick={handleSave}
                  className={cn("flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200", isBouncing && "scale-95")}
                  style={isSaved
                    ? { background: "var(--mongle-peach)", color: "white" }
                    : { background: "white", color: "var(--mongle-brown)", border: "1.5px solid rgba(54,69,84,0.12)" }
                  }
                >
                  <Heart size={16} style={{ fill: isSaved ? "white" : "transparent", color: isSaved ? "white" : "var(--mongle-peach)" }} />
                  {isSaved ? "저장됨" : "코스 저장"}
                </button>
              )}
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all hover:opacity-80 active:scale-95"
                style={{ background: "white", color: "var(--mongle-brown)", border: "1.5px solid rgba(54,69,84,0.12)" }}
              >
                {copied ? <><Check size={15} style={{ color: "var(--mongle-peach)" }} />복사됨</> : <><Share2 size={15} />공유</>}
              </button>
              <button
                onClick={enterEditMode}
                className="flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all hover:opacity-80 active:scale-95"
                style={{ background: "white", color: "var(--mongle-brown)", border: "1.5px solid rgba(54,69,84,0.12)" }}
              >
                <Pencil size={15} />
                편집
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
