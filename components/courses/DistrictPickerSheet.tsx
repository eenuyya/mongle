"use client";

import { useState, useEffect, useRef, useCallback, useId } from "react";
import { Search, X, MapPin, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// 자주 찾는 동네 (고정) — 데이터 추가 시 자동 노출 안 됨, 수동 관리
const POPULAR_DISTRICTS = ["성수", "한남", "연남", "서촌", "익선"];

interface DistrictPickerSheetProps {
  districts: string[];
  selected: string | null;
  onSelect: (district: string) => void;
}

export function DistrictPickerSheet({ districts, selected, onSelect }: DistrictPickerSheetProps) {
  const [isOpen, setIsOpen]         = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const sheetRef    = useRef<HTMLDivElement>(null);
  const searchRef   = useRef<HTMLInputElement>(null);
  const dragStartY  = useRef<number | null>(null);
  const isDragging  = useRef(false);

  const close = useCallback(() => {
    setIsOpen(false);
    setSearchQuery("");
  }, []);

  const handleSelect = (d: string) => {
    onSelect(d);
    close();
  };

  // 드래그 다운으로 닫기
  const handleDragStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  }, []);

  const handleDragMove = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 10) isDragging.current = true;
    if (sheetRef.current && delta > 0) {
      sheetRef.current.style.transform = `translateY(${delta}px)`;
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!sheetRef.current) return;
    const delta = dragStartY.current !== null
      ? parseFloat(sheetRef.current.style.transform.replace("translateY(", "") || "0")
      : 0;
    sheetRef.current.style.transform = "";
    dragStartY.current = null;
    if (delta > 80) close();
    isDragging.current = false;
  }, [close]);

  // 바깥 클릭으로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, close]);

  // 스크롤 잠금 + 검색창 자동 포커스
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 300);
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const filtered = districts.filter((d) =>
    d.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const popular = POPULAR_DISTRICTS.filter((d) => districts.includes(d));
  const others  = filtered.filter((d) => !POPULAR_DISTRICTS.includes(d));
  const popularFiltered = filtered.filter((d) => POPULAR_DISTRICTS.includes(d));

  // 검색 중이면 전체 filtered, 아니면 인기/기타 분리
  const showSearch = searchQuery.length > 0;

  return (
    <>
      {/* 트리거 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all duration-150",
          selected ? "hover:opacity-80" : "hover:border-[var(--mongle-peach)]"
        )}
        style={
          selected
            ? { background: "var(--mongle-peach)", color: "white", borderColor: "var(--mongle-peach)" }
            : { background: "white", color: "var(--mongle-brown)", borderColor: "rgba(54,69,84,0.12)", borderStyle: "dashed" }
        }
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <MapPin size={15} style={{ color: selected ? "white" : "var(--mongle-peach)" }} />
          {selected ?? "동네를 선택해주세요"}
        </span>
        {selected
          ? <Check size={16} color="white" />
          : <span className="text-xs font-medium" style={{ color: "var(--mongle-peach)" }}>필수</span>
        }
      </button>

      {/* 딤 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 transition-opacity duration-200"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={close}
        />
      )}

      {/* 바텀시트 */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 mx-auto z-50 flex flex-col rounded-t-3xl transition-transform duration-300 ease-out",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={{
          background: "var(--mongle-cream)",
          maxHeight: "75vh",
          maxWidth: 480,
          paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        }}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-9 h-1 rounded-full" style={{ background: "rgba(54,69,84,0.15)" }} />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
          <h2 className="text-base font-bold" style={{ color: "var(--mongle-brown)" }}>
            어느 동네로 갈까요?
          </h2>
          <button
            onClick={close}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
            style={{ background: "rgba(54,69,84,0.07)" }}
          >
            <X size={15} style={{ color: "var(--mongle-brown)" }} />
          </button>
        </div>

        {/* 검색 인풋 */}
        <div className="px-5 pb-3 flex-shrink-0">
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: "white", border: "1px solid rgba(54,69,84,0.1)" }}
          >
            <Search size={15} style={{ color: "var(--mongle-brown)", opacity: 0.4 }} />
            <input
              ref={searchRef}
              type="text"
              placeholder="동네 이름 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-sm outline-none bg-transparent"
              style={{ color: "var(--mongle-brown)" }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X size={13} style={{ color: "var(--mongle-brown)", opacity: 0.4 }} />
              </button>
            )}
          </div>
        </div>

        {/* 목록 */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-2">
          {showSearch ? (
            // 검색 결과
            filtered.length > 0 ? (
              <ul>
                {filtered.map((d) => (
                  <DistrictItem key={d} district={d} selected={selected} onSelect={handleSelect} />
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm" style={{ color: "var(--mongle-brown)", opacity: 0.4 }}>
                검색 결과가 없어요
              </p>
            )
          ) : (
            <>
              {/* 인기 동네 */}
              {popular.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--mongle-brown)", opacity: 0.45 }}>
                    자주 찾는 동네
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {popular.map((d) => (
                      <button
                        key={d}
                        onClick={() => handleSelect(d)}
                        className={cn(
                          "px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all duration-150",
                          selected === d ? "scale-[1.03]" : "hover:opacity-80"
                        )}
                        style={
                          selected === d
                            ? { background: "var(--mongle-peach)", color: "white", borderColor: "var(--mongle-peach)" }
                            : { background: "white", color: "var(--mongle-brown)", borderColor: "rgba(54,69,84,0.1)" }
                        }
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 전체 목록 */}
              {others.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: "var(--mongle-brown)", opacity: 0.45 }}>
                    전체
                  </p>
                  <ul>
                    {others.map((d) => (
                      <DistrictItem key={d} district={d} selected={selected} onSelect={handleSelect} />
                    ))}
                  </ul>
                </div>
              )}

              {districts.length === 0 && (
                <p className="py-8 text-center text-sm" style={{ color: "var(--mongle-brown)", opacity: 0.4 }}>
                  등록된 동네가 없어요
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function DistrictItem({
  district,
  selected,
  onSelect,
}: {
  district: string;
  selected: string | null;
  onSelect: (d: string) => void;
}) {
  const isSelected = selected === district;
  return (
    <li>
      <button
        onClick={() => onSelect(district)}
        className="w-full flex items-center justify-between px-2.5 py-2.5 rounded-[10px] transition-colors duration-150"
        style={{
          background: isSelected ? "#FFD6C2" : "transparent",
        }}
        onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "#FFEEE5"; }}
        onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
      >
        <span
          className="flex items-center gap-2.5 text-sm"
          style={{
            color: "var(--mongle-brown)",
            fontWeight: isSelected ? 600 : 400,
          }}
        >
          <MapPin size={13} style={{ color: isSelected ? "var(--mongle-peach)" : "rgba(54,69,84,0.3)" }} />
          {district}
        </span>
        {isSelected && <Check size={15} style={{ color: "var(--mongle-peach)" }} />}
      </button>
    </li>
  );
}
