/**
 * CourseFilterBar 컴포넌트
 * - 테마 1행 상시 노출 + [필터] 버튼으로 동네/소요시간 숨김
 * - 동네/소요시간: 모바일 Bottom Sheet / 데스크탑 Popover
 * - 활성 필터 수 badge 표시, 적용된 필터는 칩으로 요약
 */

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect, useRef } from "react";
import { SlidersHorizontal, X, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEMES as THEME_METAS } from "@/lib/constants/themes";

const THEMES = [
  { id: "all", label: "전체" },
  ...THEME_METAS.map((t) => ({ id: t.id, label: t.filterLabel })),
];

const POPULAR_DISTRICT_IDS = ["성수", "한남", "연남", "서촌", "익선"];

const DISTRICTS = [
  { id: "all", label: "전체 동네" },
  { id: "망원", label: "망원" },
  { id: "문래", label: "문래" },
  { id: "북촌/안국", label: "북촌/안국" },
  { id: "서촌", label: "서촌" },
  { id: "성수", label: "성수" },
  { id: "양재", label: "양재" },
  { id: "연남", label: "연남" },
  { id: "용산", label: "용산" },
  { id: "익선", label: "익선" },
  { id: "한남", label: "한남" },
  { id: "혜화", label: "혜화" },
  { id: "회기", label: "회기" },
];

const DURATIONS = [
  { id: "all", label: "전체" },
  { id: "short", label: "2시간 이하" },
  { id: "half", label: "반나절" },
  { id: "day", label: "하루 코스" },
];

export function CourseFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const activeTheme = searchParams.get("theme") ?? "all";
  const activeDistrict = searchParams.get("district") ?? "all";
  const activeDuration = searchParams.get("duration") ?? "all";

  // 동네 + 소요시간 활성 필터 수
  const subFilterCount =
    (activeDistrict !== "all" ? 1 : 0) + (activeDuration !== "all" ? 1 : 0);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.replace(`/courses?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Bottom Sheet — 모바일에서만 스크롤 잠금
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (sheetOpen && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  // 데스크탑 Popover — 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setSheetOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeDistrictLabel =
    DISTRICTS.find((d) => d.id === activeDistrict)?.label;
  const activeDurationLabel =
    DURATIONS.find((d) => d.id === activeDuration)?.label;

  return (
    <>
      <div
        className="sticky top-12 md:top-16 z-20 flex flex-col gap-2 py-3"
        style={{ background: "var(--mongle-cream)" }}
      >
        {/* Row 1: 테마 필터 + 필터 트리거 버튼 */}
        <div className="relative flex items-center gap-2">
          {/* 테마 pill — 우측 fade gradient */}
          <div className="relative flex-1 min-w-0">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pr-2">
              {THEMES.map((theme) => {
                const isActive = activeTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => updateParam("theme", theme.id)}
                    aria-pressed={isActive}
                    className={cn(
                      "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                      isActive ? "text-white shadow-md" : "hover:opacity-80"
                    )}
                    style={{
                      background: isActive
                        ? "var(--mongle-peach)"
                        : "rgba(255,255,255,0.85)",
                      border: isActive
                        ? "none"
                        : "1.5px solid var(--mongle-peach-light)",
                      color: isActive ? "white" : "var(--mongle-brown)",
                    }}
                  >
                    {theme.label}
                  </button>
                );
              })}
            </div>
            {/* 우측 페이드 — 스크롤 가능 암시 */}
            <div
              className="absolute right-0 top-0 bottom-0 w-6 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to right, transparent, var(--mongle-cream))",
              }}
            />
          </div>

          {/* 필터 트리거 버튼 */}
          <div className="relative shrink-0">
            <button
              ref={triggerRef}
              onClick={() => setSheetOpen((prev) => !prev)}
              aria-expanded={sheetOpen}
              aria-label="동네 및 소요시간 필터"
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200",
                subFilterCount > 0 ? "text-white shadow-md" : "hover:opacity-80"
              )}
              style={{
                background:
                  subFilterCount > 0
                    ? "var(--mongle-peach)"
                    : "rgba(255,255,255,0.85)",
                border:
                  subFilterCount > 0
                    ? "none"
                    : "1.5px solid var(--mongle-peach-light)",
                color:
                  subFilterCount > 0 ? "white" : "var(--mongle-brown)",
              }}
            >
              <SlidersHorizontal size={14} aria-hidden="true" />
              <span>필터</span>
              {subFilterCount > 0 && (
                <span
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold"
                  style={{ background: "rgba(255,255,255,0.3)" }}
                >
                  {subFilterCount}
                </span>
              )}
            </button>

            {/* 데스크탑 Popover */}
            {sheetOpen && (
              <div
                ref={popoverRef}
                className="hidden md:block absolute top-full right-0 mt-2 rounded-2xl p-5 z-50 min-w-[280px]"
                style={{
                  background: "white",
                  boxShadow: "0 8px 32px rgba(92,61,46,0.14)",
                  border: "1px solid rgba(92,61,46,0.08)",
                }}
              >
                <FilterContent
                  activeDistrict={activeDistrict}
                  activeDuration={activeDuration}
                  updateParam={updateParam}
                  onClose={() => setSheetOpen(false)}
                  router={router}
                  searchParams={searchParams}
                />
              </div>
            )}
          </div>
        </div>

        {/* Row 2: 활성 서브 필터 칩 (조건부) */}
        {subFilterCount > 0 && (
          <div className="flex gap-2 flex-wrap">
            {activeDistrict !== "all" && (
              <button
                onClick={() => updateParam("district", "all")}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-70"
                style={{
                  background: "rgba(92,61,46,0.08)",
                  color: "var(--mongle-brown)",
                }}
                aria-label={`${activeDistrictLabel} 필터 제거`}
              >
                <MapPin size={10} aria-hidden="true" />
                {activeDistrictLabel}
                <X size={10} aria-hidden="true" />
              </button>
            )}
            {activeDuration !== "all" && (
              <button
                onClick={() => updateParam("duration", "all")}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-70"
                style={{
                  background: "rgba(92,61,46,0.08)",
                  color: "var(--mongle-brown)",
                }}
                aria-label={`${activeDurationLabel} 필터 제거`}
              >
                <Clock size={10} aria-hidden="true" />
                {activeDurationLabel}
                <X size={10} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 모바일 Bottom Sheet */}
      {sheetOpen && (
        <>
          {/* 딤 오버레이 */}
          <div
            className="md:hidden fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
            aria-hidden="true"
          />
          {/* Sheet */}
          <div
            className="md:hidden fixed inset-x-0 bottom-0 z-50 rounded-t-3xl overflow-y-auto"
            style={{
              background: "white",
              boxShadow: "0 -4px 32px rgba(92,61,46,0.12)",
              maxHeight: "80dvh",
              padding: "24px 24px max(24px, env(safe-area-inset-bottom))",
            }}
          >
            {/* 드래그 핸들 */}
            <div
              className="mx-auto mb-5 rounded-full"
              style={{
                width: 36,
                height: 4,
                background: "rgba(92,61,46,0.15)",
              }}
              aria-hidden="true"
            />
            <FilterContent
              activeDistrict={activeDistrict}
              activeDuration={activeDuration}
              updateParam={updateParam}
              onClose={() => setSheetOpen(false)}
              router={router}
              searchParams={searchParams}
            />
          </div>
        </>
      )}
    </>
  );
}

/** Bottom Sheet / Popover 내부 공통 콘텐츠 */
function FilterContent({
  activeDistrict,
  activeDuration,
  updateParam,
  onClose,
  router,
  searchParams,
}: {
  activeDistrict: string;
  activeDuration: string;
  updateParam: (key: string, value: string) => void;
  onClose: () => void;
  router: ReturnType<typeof useRouter>;
  searchParams: ReturnType<typeof useSearchParams>;
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* 동네 */}
      <div>
        <div
          className="flex items-center gap-1.5 mb-3 text-sm font-semibold"
          style={{ color: "var(--mongle-brown)" }}
        >
          <MapPin size={13} aria-hidden="true" style={{ color: "var(--mongle-peach)" }} />
          동네
        </div>

        {/* 인기 동네 */}
        <p className="text-[11px] font-semibold mb-2" style={{ color: "var(--mongle-brown)", opacity: 0.4 }}>인기</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {DISTRICTS.filter((d) => d.id === "all" || POPULAR_DISTRICT_IDS.includes(d.id)).map((district) => {
            const isActive = activeDistrict === district.id;
            return (
              <button
                key={district.id}
                onClick={() => updateParam("district", district.id)}
                aria-pressed={isActive}
                className={cn("px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200", isActive ? "text-white" : "hover:opacity-80")}
                style={{ background: isActive ? "var(--mongle-peach)" : "rgba(92,61,46,0.06)", color: isActive ? "white" : "var(--mongle-brown)" }}
              >
                {district.label}
              </button>
            );
          })}
        </div>

        {/* 전체 동네 */}
        <p className="text-[11px] font-semibold mb-2" style={{ color: "var(--mongle-brown)", opacity: 0.4 }}>전체</p>
        <div className="flex flex-wrap gap-2">
          {DISTRICTS.filter((d) => d.id !== "all" && !POPULAR_DISTRICT_IDS.includes(d.id)).map((district) => {
            const isActive = activeDistrict === district.id;
            return (
              <button
                key={district.id}
                onClick={() => updateParam("district", district.id)}
                aria-pressed={isActive}
                className={cn("px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200", isActive ? "text-white" : "hover:opacity-80")}
                style={{ background: isActive ? "var(--mongle-peach)" : "rgba(92,61,46,0.06)", color: isActive ? "white" : "var(--mongle-brown)" }}
              >
                {district.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 소요시간 */}
      <div>
        <div
          className="flex items-center gap-1.5 mb-3 text-sm font-semibold"
          style={{ color: "var(--mongle-brown)" }}
        >
          <Clock size={13} aria-hidden="true" style={{ color: "var(--mongle-peach)" }} />
          소요시간
        </div>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((dur) => {
            const isActive = activeDuration === dur.id;
            return (
              <button
                key={dur.id}
                onClick={() => updateParam("duration", dur.id)}
                aria-pressed={isActive}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                  isActive ? "text-white" : "hover:opacity-80"
                )}
                style={{
                  background: isActive
                    ? "var(--mongle-peach)"
                    : "rgba(92,61,46,0.06)",
                  color: isActive ? "white" : "var(--mongle-brown)",
                }}
              >
                {dur.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 하단 액션 */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("district");
            params.delete("duration");
            router.replace(`/courses?${params.toString()}`, { scroll: false });
            onClose();
          }}
          className="flex-1 py-2.5 rounded-full text-sm font-medium transition-opacity hover:opacity-70"
          style={{
            background: "rgba(92,61,46,0.06)",
            color: "var(--mongle-brown)",
          }}
        >
          초기화
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--mongle-peach)" }}
        >
          적용
        </button>
      </div>
    </div>
  );
}
