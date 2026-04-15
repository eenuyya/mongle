"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { X, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { PickerPlace } from "@/lib/mock/places";
import { createClient } from "@/lib/supabase/client";
import { CourseDetailPlace } from "./CourseDetailClient";

const CATEGORY_LABELS: Record<string, string> = {
  cafe: "카페",
  restaurant: "음식점",
  bookstore: "서점",
  gallery: "갤러리",
  park: "공원",
  popup: "팝업",
  shop: "소품샵",
};

const FILTER_CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "cafe", label: "카페" },
  { value: "shop", label: "소품샵" },
  { value: "gallery", label: "갤러리" },
  { value: "restaurant", label: "식당" },
  { value: "popup", label: "팝업" },
];

interface PlacePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  insertAfterIndex: number;
  coursePlaces: CourseDetailPlace[];
  district: string;
  onAddPlace: (place: PickerPlace, insertAfterIndex: number) => void;
}

export function PlacePickerSheet({
  isOpen,
  onClose,
  insertAfterIndex,
  coursePlaces,
  district,
  onAddPlace,
}: PlacePickerSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [walkMins, setWalkMins] = useState<Record<string, number | null>>({});
  const [isWalkLoading, setIsWalkLoading] = useState(false);
  const [districtPlaces, setDistrictPlaces] = useState<PickerPlace[]>([]);
  const [isPlacesLoading, setIsPlacesLoading] = useState(false);

  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const isDraggingSheet = useRef(false);

  // 현재 코스에 이미 포함된 장소 id 집합
  const existingIds = new Set(coursePlaces.map((cp) => cp.places.id));

  // 삽입 위치 직전 장소 이름 (minimap 표시용)
  const prevPlace =
    insertAfterIndex >= 0 ? coursePlaces[insertAfterIndex]?.places.name : null;
  const nextPlace =
    insertAfterIndex + 1 < coursePlaces.length
      ? coursePlaces[insertAfterIndex + 1]?.places.name
      : null;

  // 시트가 열릴 때 district 기반 장소 목록 조회
  useEffect(() => {
    if (!isOpen) return;
    setIsPlacesLoading(true);

    const supabase = createClient();
    supabase
      .from("places")
      .select("id, name, category, address, lat, lng, images")
      .eq("is_active", true)
      .eq("district", district)
      .order("name")
      .then(({ data }) => {
        const places: PickerPlace[] = (data ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category ?? "cafe",
          address: p.address ?? "",
          lat: p.lat ?? 0,
          lng: p.lng ?? 0,
          images: p.images ?? null,
          mongle_score: 0,
        }));
        setDistrictPlaces(places);
        setIsPlacesLoading(false);
      });
  }, [isOpen, district]);

  // 삽입 위치 기준 도보 시간 계산
  useEffect(() => {
    if (!isOpen || districtPlaces.length === 0) return;

    const fromPlace =
      insertAfterIndex >= 0 ? coursePlaces[insertAfterIndex] : null;
    if (!fromPlace?.places.lat || !fromPlace?.places.lng) {
      setWalkMins({});
      return;
    }

    setIsWalkLoading(true);
    setWalkMins({});

    const from = { lat: fromPlace.places.lat, lng: fromPlace.places.lng };
    const candidates = districtPlaces.filter(
      (p) => !existingIds.has(p.id) && p.lat && p.lng
    );

    Promise.all(
      candidates.map(async (place) => {
        try {
          const res = await fetch("/api/walking-route", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              waypoints: [from, { lat: place.lat, lng: place.lng }],
            }),
          });
          const { durations } = await res.json();
          return { id: place.id, min: durations?.[0] ?? null };
        } catch {
          return { id: place.id, min: null };
        }
      })
    ).then((results) => {
      const map: Record<string, number | null> = {};
      results.forEach(({ id, min }) => { map[id] = min; });
      setWalkMins(map);
      setIsWalkLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, insertAfterIndex, districtPlaces]);

  // 시트 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setActiveCategory("all");
      setIsSearchFocused(false);
    }
  }, [isOpen]);

  // 드래그 다운으로 닫기
  const handleDragStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    isDraggingSheet.current = false;
  }, []);

  const handleDragMove = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 20) {
      isDraggingSheet.current = true;
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (isDraggingSheet.current) {
      onClose();
    }
    dragStartY.current = null;
    isDraggingSheet.current = false;
  }, [onClose]);

  // 카테고리 변경 시 스크롤 위치 초기화
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [activeCategory, searchQuery]);

  const filteredPlaces = districtPlaces.filter((place) => {
    const matchesCategory =
      activeCategory === "all" || place.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.address.includes(searchQuery);
    return matchesCategory && matchesSearch && !existingIds.has(place.id);
  });

  if (!isOpen) return null;

  return (
    <>
      {/* 백드롭 */}
      <div
        className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      {/* 바텀 시트 */}
      <div
        ref={sheetRef}
        className="fixed left-0 right-0 bottom-0 z-50 mx-auto max-w-2xl flex flex-col rounded-t-3xl overflow-hidden animate-slideUp"
        style={{
          background: "var(--mongle-cream)",
          height: isSearchFocused ? "90dvh" : "68dvh",
          transition: "height 250ms ease-in-out",
        }}
      >
        {/* 드래그 핸들 */}
        <div
          className="flex-shrink-0 flex justify-center pt-3 pb-2 cursor-grab"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <div
            className="rounded-full"
            style={{
              width: 32,
              height: 4,
              background: "rgba(92,61,46,0.2)",
            }}
          />
        </div>

        {/* 헤더 영역 */}
        <div className="flex-shrink-0 px-4 pb-3 space-y-3">
          {/* 삽입 위치 미니맵 */}
          <div
            className="flex items-center justify-between gap-2 rounded-xl px-4 py-2.5"
            style={{ background: "rgba(255,140,105,0.08)" }}
          >
            <span
              className="text-xs truncate max-w-[35%]"
              style={{ color: "var(--mongle-brown)", opacity: 0.55 }}
            >
              {insertAfterIndex < 0 ? "← 코스 맨 앞에" : `← ${prevPlace ?? ""}`}
            </span>
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full"
              style={{
                width: 22,
                height: 22,
                background: "var(--mongle-peach)",
              }}
            >
              <Plus size={12} color="white" />
            </div>
            <span
              className="text-xs truncate max-w-[35%] text-right"
              style={{ color: "var(--mongle-brown)", opacity: 0.55 }}
            >
              {insertAfterIndex + 1 >= coursePlaces.length
                ? "코스 맨 끝에 →"
                : `${nextPlace ?? ""} →`}
            </span>
          </div>

          {/* 검색창 */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "rgba(92,61,46,0.4)" }}
            />
            <input
              type="text"
              placeholder={`${district}에서 장소 찾기…`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full pl-9 pr-4 text-sm outline-none transition-all"
              style={{
                height: 44,
                borderRadius: 12,
                background: "white",
                border: isSearchFocused
                  ? "1.5px solid #FF8C69"
                  : "1.5px solid rgba(255,140,105,0.3)",
                color: "var(--mongle-brown)",
              }}
            />
          </div>

          {/* 카테고리 필터 */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            {FILTER_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={
                  activeCategory === cat.value
                    ? { background: "#FF8C69", color: "white" }
                    : {
                        background: "white",
                        color: "rgba(92,61,46,0.6)",
                        border: "1px solid rgba(92,61,46,0.2)",
                      }
                }
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 장소 목록 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-24">
          <p
            className="text-xs font-semibold mb-3"
            style={{ color: "var(--mongle-brown)", opacity: 0.45 }}
          >
            몽글 추천
          </p>

          {isPlacesLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <div
                className="w-6 h-6 rounded-full border-2 animate-spin"
                style={{ borderColor: "rgba(255,140,105,0.2)", borderTopColor: "#FF8C69" }}
              />
              <p className="text-xs" style={{ color: "rgba(92,61,46,0.4)" }}>장소 찾는 중…</p>
            </div>
          ) : filteredPlaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <p className="text-sm" style={{ color: "rgba(92,61,46,0.4)" }}>
                {searchQuery ? "검색 결과가 없어요" : `${district}에 등록된 장소가 없어요`}
              </p>
            </div>
          ) : (
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: "calc(50% - 6px) calc(50% - 6px)" }}
            >
              {filteredPlaces.map((place) => {
                const alreadyAdded = existingIds.has(place.id);
                const walkMin =
                  place.id in walkMins ? walkMins[place.id] : undefined;

                return (
                  <PickerPlaceCard
                    key={place.id}
                    place={place}
                    alreadyAdded={alreadyAdded}
                    walkMin={walkMin}
                    isWalkLoading={isWalkLoading}
                    onAdd={() => onAddPlace(place, insertAfterIndex)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* 닫기 버튼 (접근성용 고정 버튼) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex items-center justify-center rounded-full transition-all active:scale-95"
          style={{
            width: 28,
            height: 28,
            background: "rgba(92,61,46,0.08)",
          }}
          aria-label="닫기"
        >
          <X size={14} style={{ color: "var(--mongle-brown)" }} />
        </button>
      </div>
    </>
  );
}

function PickerPlaceCard({
  place,
  alreadyAdded,
  walkMin,
  isWalkLoading,
  onAdd,
}: {
  place: PickerPlace;
  alreadyAdded: boolean;
  walkMin: number | null | undefined;
  isWalkLoading: boolean;
  onAdd: () => void;
}) {
  const imgSrc = place.images?.[0];
  const [imgLoaded, setImgLoaded] = useState(false);

  let distanceText: string;
  if (walkMin != null) {
    distanceText = `도보 ${walkMin}분`;
  } else if (isWalkLoading || walkMin === undefined) {
    distanceText = "도보 ···";
  } else {
    distanceText = "도보 ···";
  }

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden"
      style={{ boxShadow: "0 2px 8px rgba(92,61,46,0.06)" }}
    >
      {/* 이미지 */}
      <div
        className="relative overflow-hidden flex-shrink-0"
        style={{ height: 110, borderRadius: "12px 12px 0 0" }}
      >
        {imgSrc ? (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 bg-gradient-to-r from-[#f0e8e0] via-[#fdf6f0] to-[#f0e8e0] bg-[length:200%_100%] animate-shimmer" />
            )}
            <Image
              src={imgSrc}
              alt={place.name}
              fill
              className={cn("object-cover transition-opacity duration-300", imgLoaded ? "opacity-100" : "opacity-0")}
              sizes="(max-width: 768px) 50vw, 200px"
              unoptimized
              onLoad={() => setImgLoaded(true)}
            />
          </>
        ) : (
          <div
            className="w-full h-full"
            style={{ background: "var(--mongle-warm)" }}
          />
        )}
      </div>

      {/* 정보 */}
      <div
        className="flex flex-col gap-1"
        style={{
          background: "white",
          padding: "10px 12px 12px",
          borderRadius: "0 0 12px 12px",
        }}
      >
        <span
          className="self-start px-1.5 rounded-full font-medium"
          style={{
            fontSize: 10,
            height: 20,
            lineHeight: "20px",
            background: "var(--mongle-warm)",
            color: "var(--mongle-brown)",
          }}
        >
          {CATEGORY_LABELS[place.category] ?? place.category}
        </span>
        <p
          className="font-semibold leading-snug truncate"
          style={{ fontSize: 14, color: "var(--mongle-brown)" }}
        >
          {place.name}
        </p>
        <p
          className="truncate"
          style={{ fontSize: 12, color: "rgba(92,61,46,0.5)" }}
        >
          {distanceText}
        </p>

        <button
          onClick={alreadyAdded ? undefined : onAdd}
          disabled={alreadyAdded}
          className="w-full font-semibold transition-all active:scale-[0.98]"
          style={{
            height: 32,
            borderRadius: 8,
            fontSize: 13,
            marginTop: 4,
            ...(alreadyAdded
              ? {
                  background: "rgba(92,61,46,0.06)",
                  color: "rgba(92,61,46,0.35)",
                  cursor: "not-allowed",
                }
              : {
                  background: "rgba(255,140,105,0.12)",
                  color: "#FF8C69",
                  cursor: "pointer",
                }),
          }}
        >
          {alreadyAdded ? "이미 추가됨" : "＋ 추가"}
        </button>
      </div>
    </div>
  );
}
