"use client";

/**
 * PlaceCardItemClient 컴포넌트
 * - 개별 장소 카드의 인터랙티브 영역을 담당하는 Client Component
 * - 저장(하트) 토글 상태 및 heartBounce 애니메이션 관리
 * - 이미지 영역 패럴렉스 효과 (스크롤 속도 차이)
 * - Intersection Observer fadeUp stagger는 부모 Server Component에서
 *   부여한 CSS 클래스를 그대로 유지하여 전역 CSS가 처리하게 함
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Heart, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleSavedPlace } from "@/app/actions/saved";

/** 카테고리별 gradient fallback */
const CATEGORY_GRADIENTS: Record<string, string> = {
  cafe: "linear-gradient(135deg, #7B8FA6 0%, #FFD166 100%)",
  restaurant: "linear-gradient(135deg, #506070 0%, #7B8FA6 100%)",
  bookstore: "linear-gradient(135deg, #C49A6C 0%, #8B6842 100%)",
  gallery: "linear-gradient(135deg, #F8E4CF 0%, #C9A86C 100%)",
  park: "linear-gradient(135deg, #C9A86C 0%, #E8C9A0 100%)",
  popup: "linear-gradient(135deg, #7B8FA6 0%, #506070 100%)",
  shop: "linear-gradient(135deg, #FFD166 0%, #C9A86C 100%)",
  default: "linear-gradient(135deg, #B0BFCC 0%, #7B8FA6 100%)",
};

/** 카테고리 → 한국어 label */
const CATEGORY_LABELS: Record<string, string> = {
  cafe: "카페",
  restaurant: "음식점",
  bookstore: "서점",
  gallery: "갤러리",
  park: "공원",
  popup: "팝업",
  shop: "소품샵",
};

/** PlaceCardItemClient Props */
export interface PlaceCardItemClientProps {
  id: string;
  name: string;
  district: string;
  category: string;
  tags: string[];
  imageUrl?: string | null;
  index: number;
  /** 서버에서 전달받은 초기 저장 여부 */
  initialSaved?: boolean;
  /** "scroll": 홈 화면 Observer 기반 (기본값), "enter": 즉시 재생, "none": 애니메이션 없음 */
  animationMode?: "scroll" | "enter" | "none";
  /** 저장 해제 시 호출 (저장 목록 페이지 전용 — 제공 시 기본 toggle 대신 호출) */
  onUnsave?: (id: string) => void;
}

/**
 * 개별 장소 카드 Client Component
 * - 저장 버튼(하트) 인터랙션 및 패럴렉스 처리
 */
export function PlaceCardItemClient({
  id,
  name,
  district,
  category,
  tags,
  imageUrl,
  index,
  initialSaved = false,
  animationMode = "scroll",
  onUnsave,
}: PlaceCardItemClientProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isBouncing, setIsBouncing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  // 이미지 영역 패럴렉스 대상 ref
  const imageRef = useRef<HTMLDivElement>(null);

  /** 이미지 영역 패럴렉스 — 스크롤에 따라 미세하게 다른 속도로 이동 */
  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;

    const handleScroll = () => {
      const rect = image.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      // 화면 중앙 기준으로 상대 위치 계산 (-1 ~ 1 범위)
      const relativePos =
        (rect.top + rect.height / 2 - windowHeight / 2) / windowHeight;
      // 최대 ±10px 패럴렉스 이동
      const parallaxOffset = relativePos * 10;
      image.style.transform = `translateY(${parallaxOffset}px)`;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /**
   * 저장 버튼 클릭 처리
   * - 하트 fill 토글 + heartBounce 애니메이션
   */
  const handleSaveToggle = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 450);

    // 저장 목록 페이지에서 호출된 경우 — undo 흐름을 상위에 위임
    if (onUnsave && isSaved) {
      setIsSaved(false);
      onUnsave(id);
      return;
    }

    // 일반 토글
    setIsSaved((prev) => !prev);
    const result = await toggleSavedPlace(id);
    if (result.error) {
      setIsSaved((prev) => !prev);
      if (result.error === "로그인이 필요해요") {
        router.push("/login");
      }
    }
  }, [id, isSaved, onUnsave, router]);

  // 카테고리에 맞는 gradient 선택
  const fallbackGradient =
    CATEGORY_GRADIENTS[category] ?? CATEGORY_GRADIENTS.default;

  // 카테고리 한국어 label
  const categoryLabel = CATEGORY_LABELS[category] ?? category;

  return (
    <article
      className={cn(
        animationMode === "none"
          ? ""
          : animationMode === "enter"
          ? `saved-card-enter stagger-${Math.min(index + 1, 8)}`
          : `animate-on-scroll stagger-${Math.min(index + 1, 8)}`,
        "rounded-lg overflow-hidden cursor-pointer",
        "transition-shadow duration-200 hover:-translate-y-1"
      )}
      style={{
        background: "white",
        boxShadow: "0 2px 12px rgba(54,69,84,0.08)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 8px 28px rgba(54,69,84,0.16)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 2px 12px rgba(54,69,84,0.08)";
      }}
      onClick={() => router.push(`/places/${id}`)}
      role="listitem"
      aria-label={`${name}, ${district}`}
    >
      {/* 이미지 영역 — 패럴렉스 컨테이너 */}
      <div
        className="relative overflow-hidden"
        style={{ height: "140px" }}
        aria-hidden="true"
      >
        {/* 실제 이미지 요소 — 패럴렉스 transform 대상 */}
        <div
          ref={imageRef}
          className="absolute inset-0 will-change-transform"
          style={{ top: "-10px", bottom: "-10px" }}
        >
          {/* Skeleton shimmer — 이미지 로드 전 표시 */}
          {imageUrl && !imageLoaded && (
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, var(--mongle-warm) 25%, #B0BFCC 50%, var(--mongle-warm) 75%)",
                backgroundSize: "200% 100%",
                animation: "skeletonShimmer 1.4s ease infinite",
              }}
            />
          )}
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover"
              unoptimized
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              onLoad={() => setImageLoaded(true)}
              style={{ opacity: imageLoaded ? 1 : 0, transition: "opacity 0.35s ease" }}
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: fallbackGradient }}
            />
          )}
        </div>

        {/* 저장 버튼 — 하트 아이콘 */}
        <button
          type="button"
          className="absolute top-2.5 right-2.5 flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200"
          style={{
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(6px)",
          }}
          onClick={handleSaveToggle}
          aria-label={isSaved ? `${name} 저장 취소` : `${name} 저장`}
          aria-pressed={isSaved}
        >
          <Heart
            size={16}
            className="transition-all duration-200"
            style={{
              color: isSaved ? "#FF4444" : "var(--mongle-brown)",
              fill: isSaved ? "#FF4444" : "transparent",
              animation: isBouncing ? "heartBounce 0.4s ease" : undefined,
            }}
            aria-hidden="true"
          />
        </button>

        {/* 카테고리 배지 */}
        <span
          className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            background: "rgba(255,255,255,0.88)",
            color: "var(--mongle-brown)",
            backdropFilter: "blur(6px)",
          }}
        >
          {categoryLabel}
        </span>
      </div>

      {/* 카드 텍스트 정보 */}
      <div className="p-3">
        {/* 장소명 */}
        <h3
          className="font-semibold text-sm leading-tight mb-1.5 truncate"
          style={{ color: "var(--mongle-brown)" }}
        >
          {name}
        </h3>

        {/* 동네 */}
        <div className="flex items-center mb-2">
          <span
            className="flex items-center gap-0.5 text-xs"
            style={{ color: "var(--mongle-brown)", opacity: 0.6 }}
          >
            <MapPin size={11} aria-hidden="true" />
            {district}
          </span>
        </div>

        {/* 태그 */}
        {/* <div className="flex flex-wrap gap-1">
          {(tags ?? []).map((tag) => (
            <span
              key={tag}
              className="text-xs px-1.5 py-0.5 rounded-md"
              style={{
                background: "var(--mongle-warm)",
                color: "var(--mongle-brown)",
                opacity: 0.8,
              }}
            >
              #{tag}
            </span>
          ))}
        </div> */}
      </div>
    </article>
  );
}
