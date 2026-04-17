"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, List, Map as MapIcon, ArrowLeft, Sparkles, Coffee, Utensils, ShoppingBag, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlacesMapView, type MapPlace } from "./PlacesMapView";
import { PlaceListRow } from "./PlaceListRow";

const CATEGORIES = [
  { id: "all",        label: "전체",   icon: LayoutGrid },
  { id: "cafe",       label: "카페",   icon: Coffee },
  { id: "restaurant", label: "음식점", icon: Utensils },
  { id: "shop",       label: "소품샵", icon: ShoppingBag },
  { id: "popup",      label: "팝업",   icon: Sparkles },
];

interface Place extends MapPlace {
  district: string | null;
  tags: string[] | null;
  images: string[] | null;
  place_score_keywords?: { keyword: string; direction: string; frequency: number }[] | null;
}

interface PlacesMapLayoutProps {
  initialPlaces: Place[];
  savedIds: Set<string>;
  availableDistricts: string[];
}

const SNAP_PEEK = 160;
const SNAP_HALF = 0.5;
const SNAP_FULL = 0.85;

// 헤더(64px) + 모바일 탭바(~48px) + 여백(8px) 제외한 최대 바텀시트 높이
const getMaxSheetH = () => window.innerHeight - 64 - 48 - 8;

const MAP_STYLE_ID = process.env.NEXT_PUBLIC_NAVER_MAP_STYLE_ID ?? "b0d0f3c3-0540-4e50-b98c-9aca50a7fb96";

export function PlacesMapLayout({ initialPlaces, savedIds, availableDistricts }: PlacesMapLayoutProps) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const urlDistrict  = searchParams.get("district");
  const urlCategory  = searchParams.get("category") ?? "all";

  const [places, setPlaces]               = useState<Place[]>(initialPlaces);
  const filteredPlaces = urlCategory === "all"
    ? places
    : places.filter(p => p.category === urlCategory);

  const updateCategory = useCallback((cat: string) => {
    const params = new URLSearchParams(searchParams.toString());
    cat === "all" ? params.delete("category") : params.set("category", cat);
    router.replace(`/places?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);
  const [loading, setLoading]             = useState(!!urlDistrict);
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(urlDistrict);

  const [sheetH, setSheetH]         = useState(SNAP_PEEK);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const sheetRef      = useRef<HTMLDivElement>(null);
  const dragStart     = useRef<{ y: number; h: number } | null>(null);
  const desktopListRef  = useRef<HTMLDivElement>(null);
  const mobileListRef   = useRef<HTMLDivElement>(null);

  /* 동네 기반 장소 fetch */
  const fetchByDistrict = useCallback(async (district: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/places?district=${encodeURIComponent(district)}`);
      // HTTP 에러 응답(4xx/5xx)을 명시적으로 처리하여 빈 화면 대신 기존 목록 유지
      if (!res.ok) {
        console.error(`[fetchByDistrict] HTTP ${res.status}`);
        return;
      }
      const { places: fetched } = await res.json() as { places: Place[] };
      setPlaces(fetched);
    } catch (err) {
      // 네트워크 오류 등 예외 — 기존 장소 목록을 그대로 유지
      console.error("[fetchByDistrict] 장소 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* URL district 변경 시 state 동기화 (뒤로가기 복원 포함) */
  useEffect(() => {
    if (urlDistrict) {
      setSelectedDistrict(urlDistrict);
      fetchByDistrict(urlDistrict);
    } else {
      setSelectedDistrict(null);
      setPlaces(initialPlaces);
      setSelectedId(null);
    }
  // initialPlaces는 서버에서 한 번만 내려오므로 urlDistrict 변화만 감지
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlDistrict]);

  /* 동네 선택 → 즉시 로딩 표시 후 URL push, 바텀시트 반 열기 */
  const handleDistrictSelect = useCallback((district: string) => {
    setSelectedId(null);
    setSelectedDistrict(district);
    setLoading(true);
    setSheetH(window.innerHeight * SNAP_HALF);
    router.push(`/places?district=${encodeURIComponent(district)}`, { scroll: false });
  }, [router]);

  /* 목록 클릭 → 스크롤 위치 + 현재 URL + 선택 상태 저장, 지도에서 포커스 */
  const handlePlaceClick = useCallback((id: string) => {
    const scrollTop = desktopListRef.current?.scrollTop ?? mobileListRef.current?.scrollTop ?? 0;
    sessionStorage.setItem("mongle-places-scroll", String(scrollTop));
    sessionStorage.setItem("mongle-places-selected", id);
    sessionStorage.setItem("mongle-places-sheet-h", String(sheetH));
    setSelectedId(id);
    setMobileView("map");
    // 바텀시트 높이는 건드리지 않음 — 사용자가 연 상태 그대로 유지
  }, [sheetH]);

  /* 뒤로가기 복귀 후 스크롤·선택 상태 복원 */
  useEffect(() => {
    if (loading || !urlDistrict) return;

    // 스크롤 위치 복원
    const savedScroll = sessionStorage.getItem("mongle-places-scroll");
    if (savedScroll !== null) {
      const top = Number(savedScroll);
      sessionStorage.removeItem("mongle-places-scroll");
      requestAnimationFrame(() => {
        desktopListRef.current?.scrollTo({ top, behavior: "instant" });
        mobileListRef.current?.scrollTo({ top, behavior: "instant" });
      });
    }

    // 선택 장소 + 바텀시트 높이 복원
    const savedId = sessionStorage.getItem("mongle-places-selected");
    const savedSheetH = sessionStorage.getItem("mongle-places-sheet-h");
    if (savedId) {
      setSelectedId(savedId);
      sessionStorage.removeItem("mongle-places-selected");
    }
    if (savedSheetH) {
      setSheetH(Number(savedSheetH));
      sessionStorage.removeItem("mongle-places-sheet-h");
    } else {
      setSheetH(window.innerHeight * SNAP_HALF);
    }
  }, [loading, urlDistrict]);

  /* 지도 마커 클릭 → 모바일 바텀시트 열기 + selectedId 설정 (스크롤은 useEffect) */
  const handleMapPlaceClick = useCallback((id: string) => {
    setSelectedId(id);
    // 모바일: 바텀시트가 닫혀있으면 반쯤 열기
    setSheetH(prev => (typeof prev === "number" && prev < 200 ? window.innerHeight * SNAP_HALF : prev));
  }, []);

  /* selectedId 변경 시 해당 항목을 리스트 중앙으로 스크롤 */
  useEffect(() => {
    if (!selectedId) return;

    const scrollToItem = (container: HTMLDivElement | null) => {
      if (!container) return;
      const el = container.querySelector<HTMLElement>(`[data-place-id="${selectedId}"]`);
      if (!el) return;
      const containerH = container.clientHeight;
      const elTop      = el.offsetTop;
      const elH        = el.offsetHeight;
      container.scrollTo({ top: elTop - containerH / 2 + elH / 2, behavior: "smooth" });
    };

    const rafId = requestAnimationFrame(() => {
      scrollToItem(desktopListRef.current);
      scrollToItem(mobileListRef.current);
    });
    return () => cancelAnimationFrame(rafId);
  }, [selectedId]);

  /* 뒤로 (서울 overview 복귀) → URL에서 district 제거 */
  const handleBack = useCallback(() => {
    setLoading(true);
    router.push("/places", { scroll: false });
  }, [router]);

  /* 바텀시트 터치 드래그 */
  const onTouchStart = (e: React.TouchEvent) => {
    dragStart.current = { y: e.touches[0].clientY, h: sheetH };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragStart.current) return;
    const dy  = dragStart.current.y - e.touches[0].clientY;
    const wh  = window.innerHeight;
    const raw = typeof dragStart.current.h === "number"
      ? dragStart.current.h + dy
      : dragStart.current.h * wh + dy;
    setSheetH(Math.max(SNAP_PEEK, Math.min(raw, getMaxSheetH())));
  };
  const onTouchEnd = () => {
    const wh    = window.innerHeight;
    const maxH  = getMaxSheetH();
    const h     = typeof sheetH === "number" ? sheetH : sheetH * wh;
    if (h < wh * 0.3)       setSheetH(SNAP_PEEK);
    else if (h < wh * 0.65) setSheetH(wh * SNAP_HALF);
    else                     setSheetH(maxH);
    dragStart.current = null;
  };

  const sheetPx = typeof sheetH === "number" ? sheetH : sheetH * window.innerHeight;

  /* ── 리스트 콘텐츠 팩토리 ── */
  const makeListContent = (splitInteraction = false) => (
    <div className="flex flex-col gap-2 p-3">
      {loading && (
        <div className="flex items-center justify-center gap-2 py-6">
          <div
            className="w-4 h-4 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--mongle-peach)", borderTopColor: "transparent" }}
          />
          <p className="text-xs" style={{ color: "var(--mongle-brown)", opacity: 0.45 }}>
            동네 탐색 중…
          </p>
        </div>
      )}
      {!loading && (filteredPlaces?.length ?? 0) === 0 && (
        <div className="flex flex-col items-center py-16 gap-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: "rgba(123,143,166,0.08)" }}
          >
            <MapPin size={24} style={{ color: "var(--mongle-peach)", opacity: 0.5 }} />
          </div>
          <p className="text-sm text-center" style={{ color: "var(--mongle-brown)", opacity: 0.45, lineHeight: 1.6 }}>
            이 지역에 등록된 장소가 없어요
          </p>
        </div>
      )}
      {filteredPlaces.map(place => (
        <div key={place.id} data-place-id={place.id}>
          <PlaceListRow
            id={place.id}
            name={place.name}
            district={place.district}
            category={place.category}
            tags={place.tags}
            images={place.images}
            keywords={place.place_score_keywords}
            initialSaved={savedIds.has(place.id)}
            isHighlighted={place.id === selectedId}
            onClick={() => handlePlaceClick(place.id)}
            splitInteraction={splitInteraction}
          />
        </div>
      ))}
    </div>
  );

  const listContent        = makeListContent(true);  // 데스크탑 목록 패널
  const mobileListContent  = makeListContent(true);  // 모바일 목록 탭 (split 모드)
  const sheetListContent   = makeListContent(true);  // 모바일 바텀시트 (split 모드)

  /* ── 공유 Naver Map (항상 마운트, 상태로 pan/zoom 제어) ── */
  const sharedMap = (
    <PlacesMapView
      key="places-map"
      places={selectedDistrict ? filteredPlaces : []}
      selectedPlaceId={selectedId}
      onPlaceClick={handleMapPlaceClick}
      showNeighborhoods={!selectedDistrict}
      availableDistricts={availableDistricts}
      onNeighborhoodClick={(d) => {
        handleDistrictSelect(d);
        setMobileView("map");
      }}
      selectedDistrict={selectedDistrict}
      mapStyleId={MAP_STYLE_ID}
      initialLat={37.5500}
      initialLng={126.9900}
      initialZoom={11.8}
      bottomPadding={sheetPx}
    />
  );

  return (
    <>
      {/* ══════════ 데스크탑 ══════════ */}
      <div className="hidden md:flex h-[calc(100vh-4rem)]">

        {/* 좌측 — 리스트 패널 */}
        <div
          className="w-[400px] flex-shrink-0 flex flex-col"
          style={{ borderRight: "1px solid rgba(123,143,166,0.1)" }}
        >
          {/* 패널 헤더 */}
          <div
            className="flex-shrink-0"
            style={{
              background: "linear-gradient(160deg, #F4F6F8 0%, #F0F3F6 100%)",
              borderBottom: "1px solid rgba(123,143,166,0.12)",
            }}
          >
            {selectedDistrict ? (
              <div className="flex items-center gap-3 px-4 py-4">
                <button
                  onClick={handleBack}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-110"
                  style={{ background: "rgba(123,143,166,0.1)", color: "var(--mongle-brown)" }}
                >
                  <ArrowLeft size={15} strokeWidth={2.5} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate" style={{ color: "var(--mongle-brown)", fontSize: 15, letterSpacing: "-0.02em" }}>
                    {selectedDistrict}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--mongle-brown)", opacity: 0.45 }}>
                    몽글이 고른 느좋 공간들
                  </p>
                </div>
                {loading && (
                  <div
                    className="w-5 h-5 rounded-full border-2 animate-spin flex-shrink-0"
                    style={{ borderColor: "var(--mongle-peach)", borderTopColor: "transparent" }}
                  />
                )}
              </div>
            ) : (
              <div className="px-4 py-5">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--mongle-peach)" }}
                  >
                    <Sparkles size={14} color="white" />
                  </div>
                  <p className="font-black" style={{ color: "var(--mongle-brown)", fontSize: 16, letterSpacing: "-0.03em" }}>
                    동네별 느좋 장소
                  </p>
                </div>
                <p className="text-xs pl-0.5" style={{ color: "var(--mongle-brown)", opacity: 0.45, lineHeight: 1.5 }}>
                  지도에서 동네를 선택하면 장소가 표시돼요
                </p>
              </div>
            )}
          </div>

          {/* 카테고리 필터 — 데스크탑 */}
          <div
            className="flex-shrink-0 flex gap-1.5 px-4 py-2.5 overflow-x-auto scrollbar-hide"
            style={{ borderBottom: "1px solid rgba(123,143,166,0.1)", background: "#F4F6F8" }}
          >
            {CATEGORIES.map(({ id, label, icon: Icon }) => {
              const active = urlCategory === id;
              return (
                <button
                  key={id}
                  onClick={() => updateCategory(id)}
                  className={cn(
                    "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
                    active ? "shadow-sm" : "hover:opacity-80"
                  )}
                  style={{
                    background: active ? "var(--mongle-peach)" : "white",
                    color: active ? "white" : "var(--mongle-brown)",
                    border: active ? "none" : "1px solid rgba(54,69,84,0.1)",
                  }}
                >
                  <Icon size={12} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* 리스트 */}
          <div ref={desktopListRef} className="flex-1 overflow-y-auto" style={{ background: "#F4F6F8" }}>
            {!selectedDistrict ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 pb-12">
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center"
                  style={{ background: "rgba(123,143,166,0.08)" }}
                >
                  <MapPin size={32} style={{ color: "var(--mongle-peach)", opacity: 0.45 }} />
                </div>
                <p className="text-sm text-center" style={{ color: "var(--mongle-brown)", opacity: 0.4, lineHeight: 1.7 }}>
                  지도에서 동네를 선택하면<br />해당 지역 장소가 여기 표시돼요
                </p>
              </div>
            ) : listContent}
          </div>
        </div>

        {/* 우측 — Naver 지도 */}
        <div className="flex-1 relative">
          {sharedMap}
        </div>
      </div>

      {/* ══════════ 모바일 ══════════ */}
      <div className="md:hidden flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>

        {/* 탭바 */}
        <div
          className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5"
          style={{
            background: "rgba(255,255,255,0.96)",
            borderBottom: "1px solid rgba(123,143,166,0.1)",
            backdropFilter: "blur(12px)",
          }}
        >
          {selectedDistrict && (
            <button
              onClick={handleBack}
              className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0"
              style={{ background: "rgba(123,143,166,0.1)" }}
            >
              <ArrowLeft size={15} strokeWidth={2.5} style={{ color: "var(--mongle-brown)" }} />
            </button>
          )}

          {/* 지역명 — 왼쪽 */}
          {selectedDistrict && (
            <span className="text-sm font-bold" style={{ color: "var(--mongle-brown)" }}>
              {selectedDistrict}
            </span>
          )}

          {/* 지도/목록 탭 — 오른쪽 */}
          <div
            className="ml-auto flex gap-1 p-1 rounded-2xl"
            style={{ background: "rgba(123,143,166,0.08)" }}
          >
            {(["map", "list"] as const).map(v => (
              <button
                key={v}
                onClick={() => setMobileView(v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200"
                style={
                  mobileView === v
                    ? { background: "var(--mongle-peach)", color: "white", boxShadow: "0 2px 8px rgba(123,143,166,0.35)" }
                    : { background: "transparent", color: "var(--mongle-brown)", opacity: 0.55 }
                }
              >
                {v === "map" ? <MapIcon size={12} strokeWidth={2.5} /> : <List size={12} strokeWidth={2.5} />}
                {v === "map" ? "지도" : "목록"}
              </button>
            ))}
          </div>
        </div>

        {/* 카테고리 필터 — 모바일 리스트뷰 전용 (지도뷰는 floating) */}
        {mobileView === "list" && (
          <div
            className="flex-shrink-0 flex gap-2 px-3 py-2 overflow-x-auto scrollbar-hide"
            style={{ background: "rgba(255,255,255,0.96)", borderBottom: "1px solid rgba(123,143,166,0.08)" }}
          >
            {CATEGORIES.map(({ id, label, icon: Icon }) => {
              const active = urlCategory === id;
              return (
                <button
                  key={id}
                  onClick={() => updateCategory(id)}
                  className={cn(
                    "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
                    active ? "shadow-sm" : "hover:opacity-80"
                  )}
                  style={{
                    background: active ? "var(--mongle-peach)" : "rgba(54,69,84,0.05)",
                    color: active ? "white" : "var(--mongle-brown)",
                  }}
                >
                  <Icon size={12} />
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {mobileView === "list" ? (
          <div ref={mobileListRef} className="flex-1 overflow-y-auto" style={{ background: "#F4F6F8" }}>
            {!selectedDistrict ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div
                  className="w-16 h-16 rounded-3xl flex items-center justify-center"
                  style={{ background: "rgba(123,143,166,0.08)" }}
                >
                  <MapPin size={26} style={{ color: "var(--mongle-peach)", opacity: 0.45 }} />
                </div>
                <p className="text-sm text-center" style={{ color: "var(--mongle-brown)", opacity: 0.4, lineHeight: 1.7 }}>
                  지도 탭에서 동네를 선택해보세요
                </p>
              </div>
            ) : mobileListContent}
          </div>
        ) : (
          /* 지도 뷰 + 바텀시트 */
          <div className="flex-1 relative overflow-hidden">
            {sharedMap}

            {/* 카테고리 필터 — 동네 미선택: 우하단 FAB 세로 스택 */}
            {!selectedDistrict && (
              <div className="absolute bottom-6 right-4 z-10 flex flex-col-reverse gap-2">
                {CATEGORIES.map(({ id, label, icon: Icon }) => {
                  const active = urlCategory === id;
                  return (
                    <button
                      key={id}
                      onClick={() => updateCategory(id)}
                      aria-label={label}
                      className="flex items-center justify-end gap-2 transition-all duration-200 active:scale-95"
                    >
                      {active && (
                        <span
                          className="text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{
                            background: "rgba(255,252,249,0.95)",
                            color: "var(--mongle-brown)",
                            backdropFilter: "blur(8px)",
                            boxShadow: "0 1px 6px rgba(54,69,84,0.12)",
                          }}
                        >
                          {label}
                        </span>
                      )}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                          background: active ? "var(--mongle-peach)" : "rgba(255,252,249,0.92)",
                          backdropFilter: "blur(12px)",
                          boxShadow: active
                            ? "0 4px 16px rgba(214,135,107,0.38)"
                            : "0 2px 10px rgba(54,69,84,0.14)",
                          color: active ? "white" : "var(--mongle-brown)",
                        }}
                      >
                        <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedDistrict && (
              <div
                ref={sheetRef}
                className="absolute bottom-0 left-0 right-0 rounded-t-[28px] overflow-hidden"
                style={{
                  height: `${sheetPx}px`,
                  background: "rgba(244,246,248,0.99)",
                  boxShadow: "0 -8px 32px rgba(54,69,84,0.12), 0 -1px 0 rgba(123,143,166,0.12)",
                  transition: dragStart.current ? "none" : "height 0.32s cubic-bezier(0.32,0.72,0,1)",
                  backdropFilter: "blur(20px)",
                }}
              >
                {/* 드래그 핸들 */}
                <div
                  className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  <div className="rounded-full" style={{ width: 36, height: 4, background: "rgba(123,143,166,0.28)" }} />
                  {loading && (
                    <div
                      className="w-3.5 h-3.5 rounded-full border-2 animate-spin mt-2"
                      style={{ borderColor: "var(--mongle-peach)", borderTopColor: "transparent" }}
                    />
                  )}
                </div>

                {/* 카테고리 필터 — 바텀시트 상단 고정 */}
                <div
                  className="flex items-center gap-1.5 px-4 py-2 overflow-x-auto scrollbar-hide flex-shrink-0"
                  style={{ borderBottom: "1px solid rgba(123,143,166,0.10)" }}
                >
                  {CATEGORIES.map(({ id, label, icon: Icon }) => {
                    const active = urlCategory === id;
                    return (
                      <button
                        key={id}
                        onClick={() => updateCategory(id)}
                        aria-pressed={active}
                        className="shrink-0 flex items-center gap-1.5 rounded-full transition-all duration-200 active:scale-95"
                        style={{
                          minHeight: 32,
                          padding: "5px 12px",
                          background: active ? "var(--mongle-peach)" : "rgba(123,143,166,0.09)",
                          color: active ? "white" : "var(--mongle-brown)",
                          fontWeight: active ? 700 : 500,
                          fontSize: 12,
                          boxShadow: active ? "0 2px 10px rgba(123,143,166,0.25)" : "none",
                        }}
                      >
                        <Icon size={13} strokeWidth={active ? 2.5 : 2} />
                        <span className="whitespace-nowrap">{label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 장소 목록 — 핸들(56px) + 필터바(52px) */}
                <div ref={mobileListRef} className="overflow-y-auto" style={{ height: `${sheetPx - 108}px` }}>
                  {sheetListContent}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
