"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect, useRef } from "react";
import { SlidersHorizontal, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "all",        label: "전체" },
  { id: "cafe",       label: "카페" },
  { id: "restaurant", label: "음식점" },
  { id: "shop",       label: "소품샵" },
  { id: "popup",      label: "팝업" },
];

const POPULAR = ["성수", "한남", "연남", "서촌", "익선"];

export function PlacesFilterBar({ districts }: { districts: string[] }) {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const popoverRef  = useRef<HTMLDivElement>(null);
  const triggerRef  = useRef<HTMLButtonElement>(null);

  const activeCategory = searchParams.get("category") ?? "all";
  const activeDistrict = searchParams.get("district") ?? "all";
  const hasDistrictFilter = activeDistrict !== "all";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      value === "all" ? params.delete(key) : params.set(key, value);
      router.replace(`/places?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // 바텀 시트 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = sheetOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sheetOpen]);

  // 데스크탑 팝오버 외부 클릭 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      ) return;
      setSheetOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeDistrictLabel = districts.find(d => d === activeDistrict) ?? activeDistrict;

  const popular  = districts.filter(d => POPULAR.includes(d));
  const theRest  = districts.filter(d => !POPULAR.includes(d));

  return (
    <>
      <div
        className="sticky top-12 md:top-16 z-20 flex flex-col gap-2 py-3 -mx-4 px-4"
        style={{ background: "var(--mongle-cream)" }}
      >
        {/* Row 1: 카테고리 칩 + 동네 필터 버튼 — 한 줄 스크롤 */}
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map(({ id, label }) => {
              const isActive = activeCategory === id;
              return (
                <button
                  key={id}
                  onClick={() => updateParam("category", id)}
                  aria-pressed={isActive}
                  className={cn(
                    "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                    isActive ? "text-white shadow-md" : "hover:opacity-80"
                  )}
                  style={{
                    background: isActive ? "var(--mongle-peach)" : "rgba(255,255,255,0.85)",
                    border: isActive ? "none" : "1.5px solid var(--mongle-peach-light)",
                    color: isActive ? "white" : "var(--mongle-brown)",
                  }}
                >
                  {label}
                </button>
              );
            })}

            {/* 구분선 */}
            <div className="shrink-0 w-px self-stretch my-1" style={{ background: "rgba(92,61,46,0.12)" }} />

            {/* 동네 필터 버튼 */}
            <div className="relative shrink-0">
              <button
                ref={triggerRef}
                onClick={() => setSheetOpen(p => !p)}
                aria-expanded={sheetOpen}
                aria-label="동네 필터"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  hasDistrictFilter ? "text-white shadow-md" : "hover:opacity-80"
                )}
                style={{
                  background: hasDistrictFilter ? "var(--mongle-peach)" : "rgba(255,255,255,0.85)",
                  border: hasDistrictFilter ? "none" : "1.5px solid var(--mongle-peach-light)",
                  color: hasDistrictFilter ? "white" : "var(--mongle-brown)",
                }}
              >
                <SlidersHorizontal size={14} />
                <span>동네</span>
                {hasDistrictFilter && (
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold"
                    style={{ background: "rgba(255,255,255,0.3)" }}
                  >
                    1
                  </span>
                )}
              </button>

              {/* 데스크탑 팝오버 */}
              {sheetOpen && (
                <div
                  ref={popoverRef}
                  className="hidden md:block absolute top-full left-0 mt-2 rounded-2xl p-5 z-50 min-w-[260px]"
                  style={{
                    background: "white",
                    boxShadow: "0 8px 32px rgba(92,61,46,0.14)",
                    border: "1px solid rgba(92,61,46,0.08)",
                  }}
                >
                  <DistrictContent
                    districts={districts}
                    popular={popular}
                    theRest={theRest}
                    activeDistrict={activeDistrict}
                    updateParam={updateParam}
                    onClose={() => setSheetOpen(false)}
                    searchParams={searchParams}
                    router={router}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: 활성 동네 필터 칩 */}
        {hasDistrictFilter && (
          <button
            onClick={() => updateParam("district", "all")}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium w-fit transition-opacity hover:opacity-70"
            style={{ background: "rgba(92,61,46,0.08)", color: "var(--mongle-brown)" }}
          >
            <MapPin size={10} />
            {activeDistrictLabel}
            <X size={10} />
          </button>
        )}
      </div>

      {/* 모바일 바텀 시트 */}
      {sheetOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          />
          <div
            className="md:hidden fixed inset-x-0 bottom-0 z-50 rounded-t-3xl p-6 pb-safe"
            style={{ background: "white", boxShadow: "0 -4px 32px rgba(92,61,46,0.12)" }}
          >
            <div className="mx-auto mb-5 rounded-full" style={{ width: 36, height: 4, background: "rgba(92,61,46,0.15)" }} />
            <DistrictContent
              districts={districts}
              popular={popular}
              theRest={theRest}
              activeDistrict={activeDistrict}
              updateParam={updateParam}
              onClose={() => setSheetOpen(false)}
              searchParams={searchParams}
              router={router}
            />
          </div>
        </>
      )}
    </>
  );
}

function DistrictContent({
  districts, popular, theRest, activeDistrict, updateParam, onClose, searchParams, router,
}: {
  districts: string[];
  popular: string[];
  theRest: string[];
  activeDistrict: string;
  updateParam: (key: string, value: string) => void;
  onClose: () => void;
  searchParams: ReturnType<typeof useSearchParams>;
  router: ReturnType<typeof useRouter>;
}) {
  const chip = (d: string, label: string) => {
    const isActive = activeDistrict === d;
    return (
      <button
        key={d}
        onClick={() => { updateParam("district", d); onClose(); }}
        aria-pressed={isActive}
        className={cn("px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200", isActive ? "text-white" : "hover:opacity-80")}
        style={{ background: isActive ? "var(--mongle-peach)" : "rgba(92,61,46,0.06)", color: isActive ? "white" : "var(--mongle-brown)" }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--mongle-brown)" }}>
        <MapPin size={13} style={{ color: "var(--mongle-peach)" }} />
        동네 선택
      </div>

      {/* 전체 + 인기 */}
      <div className="flex flex-wrap gap-2">
        {chip("all", "전체 동네")}
        {popular.map(d => chip(d, d))}
      </div>

      {/* 나머지 */}
      {theRest.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {theRest.map(d => chip(d, d))}
        </div>
      )}

      {/* 초기화 */}
      <button
        onClick={() => {
          const params = new URLSearchParams(searchParams.toString());
          params.delete("district");
          router.replace(`/places?${params.toString()}`, { scroll: false });
          onClose();
        }}
        className="mt-1 py-2.5 rounded-full text-sm font-medium transition-opacity hover:opacity-70"
        style={{ background: "rgba(92,61,46,0.06)", color: "var(--mongle-brown)" }}
      >
        초기화
      </button>
    </div>
  );
}
