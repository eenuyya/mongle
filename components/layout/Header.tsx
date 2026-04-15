"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useCallback, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { MapPin, ChevronDown, X, Check, Bookmark, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

/* ── 지역 데이터 ─────────────────────────────────────────────────────────── */
interface District {
  id: string;
  name: string;
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
    count: 8,
    districts: [
      { id: "mangwon", name: "망원" },
      { id: "mullae", name: "문래" },
      // { id: "bukchon", name: "북촌/안국" },
      { id: "seochon", name: "서촌" },
      { id: "seongsu", name: "성수" },
      // { id: "yangjae", name: "양재" },
      { id: "yeonnam", name: "연남" },
      // { id: "yongsan", name: "용산" },
      { id: "ikseon", name: "익선" },
      { id: "hannam", name: "한남" },
      // { id: "hyehwa", name: "혜화" },
      { id: "hoegi", name: "회기" },
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

const POPULAR_DISTRICT_IDS = ["seongsu", "hannam", "yeonnam", "seochon", "ikseon"];

/* ── 지역 선택 모달 ───────────────────────────────────────────────────────── */
function RegionPickerModal({
  isOpen,
  onClose,
  onConfirm,
  selectedRegion,
  selectedDistrict,
  onRegionSelect,
  onDistrictSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedRegion: string;
  selectedDistrict: string | null;
  onRegionSelect: (id: string) => void;
  onDistrictSelect: (id: string, name: string) => void;
}) {
  const currentRegion = REGIONS.find((r) => r.id === selectedRegion)!;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="지역 선택"
        className="fixed inset-x-0 bottom-0 z-50 md:inset-0 md:flex md:items-start md:justify-center md:pt-20"
      >
        <div
          className="relative w-full md:w-[520px] rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col"
          style={{
            background: "#FFFFFF",
            maxHeight: "calc(100dvh - env(safe-area-inset-top, 0px) - 8px)",
          }}
        >
          {/* 모달 헤더 */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b"
            style={{ borderColor: "var(--mongle-peach-light)" }}
          >
            <div className="flex items-center gap-2">
              <MapPin size={17} style={{ color: "var(--mongle-peach)" }} />
              <span className="text-base font-semibold" style={{ color: "var(--mongle-brown)" }}>
                어느 동네로 갈까요?
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-black/5"
              aria-label="닫기"
            >
              <X size={17} style={{ color: "var(--mongle-brown)" }} />
            </button>
          </div>

          {/* 2단 선택 — 남은 공간을 채우며 내부 스크롤 */}
          <div className="flex flex-1 min-h-0 md:max-h-[360px]">
            {/* 시/도 */}
            <div
              className="w-[44%] overflow-y-auto border-r"
              style={{ borderColor: "var(--mongle-peach-light)" }}
            >
              {REGIONS.map((region) => {
                const isSelected = region.id === selectedRegion;
                return (
                  <button
                    key={region.id}
                    onClick={() => !region.comingSoon && onRegionSelect(region.id)}
                    disabled={!!region.comingSoon}
                    className={cn(
                      "w-full flex items-center justify-between px-5 py-4 text-left text-sm transition-colors",
                      !isSelected && !region.comingSoon && "hover:bg-black/[0.03]",
                      region.comingSoon && "opacity-35 cursor-not-allowed"
                    )}
                    style={{
                      background: isSelected ? "var(--mongle-warm)" : "transparent",
                      color: "var(--mongle-brown)",
                      fontWeight: isSelected ? 600 : 400,
                      borderBottom: "1px solid rgba(92,61,46,0.06)",
                    }}
                  >
                    <span>
                      {region.name}
                      {region.count > 0 && (
                        <span className="ml-1 text-xs" style={{ color: "var(--mongle-peach)" }}>
                          ({region.count})
                        </span>
                      )}
                    </span>
                    {isSelected && <Check size={14} style={{ color: "var(--mongle-peach)" }} />}
                  </button>
                );
              })}
            </div>

            {/* 동네 */}
            <div className="flex-1 overflow-y-auto">
              {currentRegion.districts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 opacity-35">
                  <MapPin size={26} style={{ color: "var(--mongle-brown)" }} />
                  <p className="text-sm" style={{ color: "var(--mongle-brown)" }}>준비 중이에요</p>
                </div>
              ) : (
                <>
                  {/* 인기 동네 칩 */}
                  {(() => {
                    const popular = currentRegion.districts.filter((d) =>
                      POPULAR_DISTRICT_IDS.includes(d.id)
                    );
                    if (popular.length === 0) return null;
                    return (
                      <div className="px-4 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(92,61,46,0.08)" }}>
                        <p className="text-[11px] font-semibold mb-2.5" style={{ color: "var(--mongle-brown)", opacity: 0.4 }}>
                          인기 동네
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {popular.map((d) => {
                            const isSelected = selectedDistrict === d.id;
                            return (
                              <button
                                key={d.id}
                                onClick={() => onDistrictSelect(d.id, d.name)}
                                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
                                style={
                                  isSelected
                                    ? { background: "var(--mongle-peach)", color: "white" }
                                    : { background: "var(--mongle-peach-light)", color: "var(--mongle-peach-dark)" }
                                }
                              >
                                {d.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 전체 목록 */}
                  <div>
                    <p className="px-5 pt-3 pb-1 text-[11px] font-semibold" style={{ color: "var(--mongle-brown)", opacity: 0.4 }}>
                      전체
                    </p>
                    {currentRegion.districts.map((district) => {
                      const isSelected = selectedDistrict === district.id;
                      return (
                        <button
                          key={district.id}
                          onClick={() => onDistrictSelect(district.id, district.name)}
                          className={cn(
                            "w-full px-5 py-3.5 text-left text-sm transition-colors",
                            !isSelected && "hover:bg-black/[0.03]"
                          )}
                          style={{
                            background: isSelected ? "var(--mongle-peach-light)" : "transparent",
                            color: isSelected ? "var(--mongle-peach-dark)" : "var(--mongle-brown)",
                            fontWeight: isSelected ? 600 : 400,
                            borderBottom: "1px solid rgba(92,61,46,0.06)",
                          }}
                        >
                          {district.name}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 확인 버튼 — flex-shrink-0으로 항상 표시, 탭바+safe-area 여백 */}
          <div
            className="flex-shrink-0 px-6 pt-4 border-t"
            style={{
              borderColor: "var(--mongle-peach-light)",
              paddingBottom: "max(16px, calc(env(safe-area-inset-bottom) + 60px))",
            }}
          >
            <button
              onClick={onConfirm}
              disabled={!selectedDistrict}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 hover:opacity-90 active:scale-[0.99]"
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

/* ── 헤더 ─────────────────────────────────────────────────────────────────── */
export function Header() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);
  const [selectedRegion, setSelectedRegion] = useState("seoul");
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedDistrictName, setSelectedDistrictName] = useState<string | null>(null);

  // URL의 district 파라미터와 동기화 — 모달이 열려있으면 사용자 선택을 덮어쓰지 않음
  useEffect(() => {
    if (isPickerOpen) return;
    const districtParam = searchParams.get("district");
    if (!districtParam) {
      setSelectedDistrict(null);
      setSelectedDistrictName(null);
      return;
    }
    for (const region of REGIONS) {
      const found = region.districts.find((d) => d.name === districtParam);
      if (found) {
        setSelectedRegion(region.id);
        setSelectedDistrict(found.id);
        setSelectedDistrictName(found.name);
        return;
      }
    }
  }, [searchParams, isPickerOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleDistrictSelect = useCallback((id: string, name: string) => {
    setSelectedDistrict(id);
    setSelectedDistrictName(name);
  }, []);

  const handleConfirm = useCallback((districtName: string | null) => {
    setIsPickerOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    if (districtName) {
      params.set("district", districtName);
    } else {
      params.delete("district");
    }
    const qs = params.toString();
    window.location.href = `${pathname}${qs ? `?${qs}` : ""}`;
  }, [pathname, searchParams]);

  const handleClearDistrict = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("district");
    const qs = params.toString();
    window.location.href = `${pathname}${qs ? `?${qs}` : ""}`;
  }, [pathname, searchParams]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "backdrop-blur-md shadow-[0_2px_16px_rgba(255,140,105,0.10)]"
            : "backdrop-blur-sm"
        )}
        style={{
          background: scrolled
            ? "rgba(255,255,255,0.95)"
            : "rgba(255,255,255,0.80)",
          borderBottom: "1px solid rgba(255,140,105,0.13)",
          boxShadow: scrolled ? "0 2px 16px rgba(255,140,105,0.08)" : "none",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-12 md:h-16 flex items-center">

          {/* 로고 — 모바일: 왼쪽 고정 / 데스크탑: 절대 중앙 */}
          <Link
            href="/"
            className="flex items-center gap-2 group shrink-0 md:absolute md:left-1/2 md:-translate-x-1/2"
            aria-label="몽글 홈으로 이동"
          >
            <div className="transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3">
              <Image
                src="/logo.png"
                alt="몽글 로고"
                width={32}
                height={40}
                className="w-5 h-[26px] md:w-7 md:h-9 object-contain"
                priority
                loading="eager"
              />
            </div>
            <span
              className="leading-none font-jua text-2xl md:text-[1.75rem]"
              style={{ color: "var(--mongle-peach)" }}
            >
              몽글
            </span>
          </Link>

          {/* 좌측 네비 — 데스크탑만 표시 */}
          <nav className="hidden md:flex items-center gap-5 shrink-0" aria-label="주 내비게이션">
            {[
              { href: "/places", label: "장소" },
              { href: "/courses", label: "코스" },
            ].map(({ href, label }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className="group relative py-2 text-sm transition-all duration-200"
                  style={{
                    color: "var(--mongle-brown)",
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  {label}
                  <span
                    className={cn(
                      "absolute bottom-0 left-0 right-0 h-[3px] rounded-full transition-all duration-200",
                      isActive ? "opacity-100" : "opacity-30 group-hover:opacity-80"
                    )}
                    style={{ background: "var(--mongle-peach)" }}
                  />
                </Link>
              );
            })}
          </nav>

          {/* 우측 — 동네 선택 + 저장 + 프로필 */}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {/* 동네 선택 버튼 */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsPickerOpen(true)}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: selectedDistrictName ? "var(--mongle-peach)" : "rgba(255,255,255,0.85)",
                  border: "1.5px solid var(--mongle-peach-light)",
                }}
                aria-label="지역 선택"
              >
                <MapPin size={13} style={{ color: selectedDistrictName ? "white" : "var(--mongle-peach)" }} />
                <span
                  className="text-xs font-medium whitespace-nowrap"
                  style={{ color: selectedDistrictName ? "white" : "var(--mongle-brown)" }}
                >
                  {selectedDistrictName ?? "동네"}
                </span>
                {!selectedDistrictName && (
                  <ChevronDown size={12} style={{ color: "var(--mongle-brown)", opacity: 0.5 }} />
                )}
              </button>
              {selectedDistrictName && (
                <button
                  onClick={handleClearDistrict}
                  className="w-6 h-6 flex items-center justify-center rounded-full transition-colors hover:bg-black/10"
                  style={{ background: "rgba(255,255,255,0.85)", border: "1.5px solid var(--mongle-peach-light)" }}
                  aria-label="동네 선택 해제"
                >
                  <X size={11} style={{ color: "var(--mongle-brown)" }} />
                </button>
              )}
            </div>

            {/* 저장 + 프로필 */}
            {isLoggedIn ? (
              <>
                <Link
                  href="/saved"
                  className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 hover:bg-black/5"
                  style={{ color: "var(--mongle-brown)" }}
                  aria-label="저장 목록"
                >
                  <Bookmark size={16} />
                </Link>
                <Link
                  href="/profile"
                  className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 hover:opacity-80"
                  style={{
                    background: "var(--mongle-warm)",
                    border: "1.5px solid var(--mongle-peach-light)",
                    color: "var(--mongle-peach)",
                  }}
                  aria-label="프로필"
                >
                  <UserRound size={16} />
                </Link>
              </>
            ) : (
              <a
                href="/login"
                className="px-3 py-1.5 rounded-full text-xs font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-95 md:px-4 md:py-2 md:text-sm"
                style={{ background: "var(--mongle-peach)" }}
              >
                로그인
              </a>
            )}
          </div>

        </div>
      </header>

      <RegionPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onConfirm={() => handleConfirm(selectedDistrictName)}
        selectedRegion={selectedRegion}
        selectedDistrict={selectedDistrict}
        onRegionSelect={setSelectedRegion}
        onDistrictSelect={handleDistrictSelect}
      />
    </>
  );
}

