"use client";

import { useState, useCallback, useEffect } from "react";
import { MapPin, ChevronDown, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** 지역 데이터 — 추후 DB 연동 시 API로 교체 */
interface District {
  id: string;
  name: string;
  available: boolean;
}

interface Region {
  id: string;
  name: string;
  count: number;
  districts: District[];
  comingSoon?: boolean;
}

const REGIONS: Region[] = [
  {
    id: "seoul",
    name: "서울",
    count: 5,
    districts: [
      { id: "seongsu", name: "성수", available: true },
      { id: "yeonnam", name: "연남", available: true },
      { id: "seochon", name: "서촌", available: true },
      { id: "hannam", name: "한남", available: true },
      { id: "ikseon", name: "익선", available: true },
    ],
  },
  { id: "gyeonggi", name: "경기/인천", count: 0, districts: [], comingSoon: true },
  { id: "chungcheong", name: "충청/대전", count: 0, districts: [], comingSoon: true },
  { id: "jeonla", name: "전라/광주", count: 0, districts: [], comingSoon: true },
  { id: "gyeongbuk", name: "경북/대구", count: 0, districts: [], comingSoon: true },
  { id: "gyeongnam", name: "경남/부산/울산", count: 0, districts: [], comingSoon: true },
  { id: "gangwon", name: "강원", count: 0, districts: [], comingSoon: true },
  { id: "jeju", name: "제주", count: 0, districts: [], comingSoon: true },
];

type RegionId = string;
type DistrictId = string;

/** 지역 선택 모달 */
function RegionPickerModal({
  isOpen,
  onClose,
  selectedRegion,
  selectedDistrict,
  onRegionSelect,
  onDistrictSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedRegion: RegionId;
  selectedDistrict: DistrictId | null;
  onRegionSelect: (id: RegionId) => void;
  onDistrictSelect: (id: DistrictId, name: string) => void;
}) {
  const currentRegion = REGIONS.find((r) => r.id === selectedRegion)!;

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // 배경 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 모달 */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="지역 선택"
        className="fixed inset-x-0 bottom-0 z-50 md:inset-0 md:flex md:items-center md:justify-center"
      >
        <div
          className="relative w-full md:w-[520px] md:mx-auto rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: "#FFFFFF" }}
        >
          {/* 모달 헤더 */}
          <div
            className="flex items-center justify-between px-6 py-5 border-b"
            style={{ borderColor: "var(--mongle-peach-light)" }}
          >
            <div className="flex items-center gap-2">
              <MapPin size={18} style={{ color: "var(--mongle-peach)" }} />
              <span
                className="text-base font-semibold"
                style={{ color: "var(--mongle-brown)" }}
              >
                어느 동네로 갈까요?
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-black/5"
              aria-label="닫기"
            >
              <X size={18} style={{ color: "var(--mongle-brown)" }} />
            </button>
          </div>

          {/* 2단 선택 영역 */}
          <div className="flex h-[420px] md:h-[380px]">
            {/* 왼쪽: 시/도 목록 */}
            <div
              className="w-[44%] overflow-y-auto border-r"
              style={{ borderColor: "var(--mongle-peach-light)" }}
            >
              {REGIONS.map((region) => {
                const isSelected = region.id === selectedRegion;
                return (
                  <button
                    key={region.id}
                    onClick={() =>
                      !region.comingSoon &&
                      onRegionSelect(region.id as RegionId)
                    }
                    disabled={!!region.comingSoon}
                    className={cn(
                      "w-full flex items-center justify-between px-5 py-4 text-left transition-colors text-sm",
                      isSelected
                        ? "font-semibold"
                        : region.comingSoon
                        ? "opacity-35 cursor-not-allowed"
                        : "hover:bg-black/[0.03]"
                    )}
                    style={{
                      background: isSelected
                        ? "var(--mongle-warm)"
                        : "transparent",
                      color: "var(--mongle-brown)",
                      borderBottom: "1px solid rgba(92,61,46,0.06)",
                    }}
                  >
                    <span>
                      {region.name}
                      {region.count > 0 && (
                        <span
                          className="ml-1 text-xs"
                          style={{ color: "var(--mongle-peach)" }}
                        >
                          ({region.count})
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <Check
                        size={15}
                        style={{ color: "var(--mongle-peach)" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* 오른쪽: 동네 목록 */}
            <div className="flex-1 overflow-y-auto">
              {currentRegion.districts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40">
                  <MapPin size={28} style={{ color: "var(--mongle-brown)" }} />
                  <p
                    className="text-sm text-center"
                    style={{ color: "var(--mongle-brown)" }}
                  >
                    준비 중이에요
                  </p>
                </div>
              ) : (
                currentRegion.districts.map((district) => {
                  const isSelected = selectedDistrict === district.id;
                  return (
                    <button
                      key={district.id}
                      onClick={() =>
                        onDistrictSelect(district.id, district.name)
                      }
                      className={cn(
                        "w-full px-5 py-4 text-left text-sm transition-all duration-150",
                        isSelected ? "font-semibold" : "hover:bg-black/[0.03]"
                      )}
                      style={{
                        background: isSelected
                          ? "var(--mongle-peach-light)"
                          : "transparent",
                        color: isSelected
                          ? "var(--mongle-peach-dark)"
                          : "var(--mongle-brown)",
                        borderBottom: "1px solid rgba(92,61,46,0.06)",
                      }}
                    >
                      {district.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* 하단 확인 버튼 */}
          <div className="px-6 py-4 border-t" style={{ borderColor: "var(--mongle-peach-light)" }}>
            <button
              onClick={onClose}
              disabled={!selectedDistrict}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: "var(--mongle-peach)" }}
            >
              {selectedDistrict
                ? `${currentRegion.districts.find((d) => d.id === selectedDistrict)?.name} 장소 보기`
                : "동네를 선택해주세요"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/** 히어로 섹션 */
export function HeroSection() {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<RegionId>("seoul");
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictId | null>(null);
  const [selectedDistrictName, setSelectedDistrictName] = useState<string | null>(null);

  const handleDistrictSelect = useCallback((id: DistrictId, name: string) => {
    setSelectedDistrict(id);
    setSelectedDistrictName(name);
  }, []);

  const handleConfirm = useCallback(() => {
    setIsPickerOpen(false);
  }, []);

  return (
    <>
      <section
        className="relative w-full overflow-hidden"
        aria-label="몽글 서비스 소개"
      >
        {/* 배경 그라디언트 */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(160deg, var(--mongle-cream) 0%, var(--mongle-peach-light) 60%, var(--mongle-peach) 100%)",
          }}
          aria-hidden="true"
        />

        {/* 배경 장식 원 */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-20 -z-10"
          style={{
            background: "var(--mongle-peach)",
            animation: "heroFloat 6s ease-in-out infinite",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-15 -z-10"
          style={{
            background: "var(--mongle-gold)",
            animation: "heroFloat 8s ease-in-out infinite 2s",
          }}
          aria-hidden="true"
        />

        <div className="mx-auto max-w-4xl px-4 py-10 md:py-14 flex flex-col items-center text-center">
          {/* 지역 선택 버튼 */}
          <div className="hero-animate hero-animate-2 w-full max-w-sm">
            <button
              onClick={() => setIsPickerOpen(true)}
              className="group w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 4px 24px rgba(255,140,105,0.15)",
              }}
              aria-label="지역 선택하기"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--mongle-peach-light)" }}
                >
                  <MapPin size={18} style={{ color: "var(--mongle-peach)" }} />
                </div>
                <div className="text-left">
                  <p
                    className="text-xs opacity-50 leading-none mb-1"
                    style={{ color: "var(--mongle-brown)" }}
                  >
                    지금 어디서 놀까요?
                  </p>
                  <p
                    className="text-base font-semibold leading-none"
                    style={{ color: "var(--mongle-brown)" }}
                  >
                    {selectedDistrictName ?? "동네 선택하기"}
                  </p>
                </div>
              </div>
              <ChevronDown
                size={20}
                className="transition-transform duration-200 group-hover:translate-y-0.5"
                style={{ color: "var(--mongle-brown)", opacity: 0.4 }}
              />
            </button>

            {/* 선택된 동네 태그 표시 */}
            {selectedDistrictName && (
              <div className="mt-3 flex justify-center">
                <span
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium text-white"
                  style={{ background: "var(--mongle-peach)" }}
                >
                  <MapPin size={13} />
                  {selectedDistrictName} 장소 탐색 중
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 지역 선택 모달 */}
      <RegionPickerModal
        isOpen={isPickerOpen}
        onClose={handleConfirm}
        selectedRegion={selectedRegion}
        selectedDistrict={selectedDistrict}
        onRegionSelect={setSelectedRegion}
        onDistrictSelect={handleDistrictSelect}
      />
    </>
  );
}
