"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Clock, MapPin, Sparkles, User, Coffee, Palette, ShoppingBag, Tent, UtensilsCrossed } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toggleSavedCourse } from "@/app/actions/saved";

/** theme_tag 별 그라디언트 + 아이콘 (ThemeSection과 동일) */
const THEME_FALLBACK: Record<string, { gradient: string; dotColor: string; icon: LucideIcon; iconColor: string }> = {
  "혼놀코스":  { gradient: "linear-gradient(145deg, #fdeee3 0%, #f9cda8 100%)", dotColor: "#f0a070", icon: User,           iconColor: "#c96a3a" },
  "데이트코스": { gradient: "linear-gradient(145deg, #fce9f0 0%, #f5b8d2 100%)", dotColor: "#eca8c4", icon: Heart,          iconColor: "#b84d78" },
  "카공투어":  { gradient: "linear-gradient(145deg, #fdf8ea 0%, #f0d898 100%)", dotColor: "#e8c55a", icon: Coffee,         iconColor: "#a07810" },
  "브런치코스": { gradient: "linear-gradient(145deg, #fdf6ee 0%, #f5cfa0 100%)", dotColor: "#e8a85a", icon: UtensilsCrossed, iconColor: "#b06030" },
  "전시탐방":  { gradient: "linear-gradient(145deg, #f0f4fd 0%, #b8ccf0 100%)", dotColor: "#7898d8", icon: Palette,        iconColor: "#3858b8" },
  "소품샵투어": { gradient: "linear-gradient(145deg, #f5eef8 0%, #ddb8e8 100%)", dotColor: "#b878c8", icon: ShoppingBag,    iconColor: "#8838a8" },
  "팝업탐방":  { gradient: "linear-gradient(145deg, #eef8f0 0%, #a8d8b8 100%)", dotColor: "#60b080", icon: Tent,           iconColor: "#207850" },
};

const DEFAULT_FALLBACK: { gradient: string; dotColor: string; icon: LucideIcon; iconColor: string } = {
  gradient: "linear-gradient(145deg, #fdeee3 0%, #f9cda8 100%)",
  dotColor: "#f0a070",
  icon: Sparkles,
  iconColor: "#c96a3a",
};

function CourseCoverFallback({ themeTag }: { themeTag: string | null }) {
  const fb = (themeTag ? THEME_FALLBACK[themeTag] : undefined) ?? DEFAULT_FALLBACK;
  const Icon = fb.icon;
  return (
    <div
      className="w-full h-full relative flex items-center justify-center overflow-hidden"
      style={{ background: fb.gradient }}
    >
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-25" style={{ background: fb.dotColor }} />
      <div className="absolute -bottom-12 -left-8 w-32 h-32 rounded-full opacity-[0.18]" style={{ background: fb.dotColor }} />
      <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full opacity-10 -translate-y-1/2" style={{ background: fb.dotColor }} />
      <Icon size={48} strokeWidth={1.2} style={{ color: fb.iconColor, opacity: 0.45, position: "relative", zIndex: 1 }} />
    </div>
  );
}

/** shimmer → fade-in 이미지 슬롯 */
function FadeImage({ src, alt, sizes, className }: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#f0e8e0] via-[#fdf6f0] to-[#f0e8e0] bg-[length:200%_100%] animate-shimmer" />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        className={cn(
          "object-cover transition-all duration-500",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
        sizes={sizes}
        unoptimized
        onLoad={() => setLoaded(true)}
      />
    </>
  );
}

interface CourseCardProps {
  id: string;
  title: string;
  description: string | null;
  district: string | null;
  theme_tag: string | null;
  /** DB 실제 컬럼명: duration_min */
  duration_min: number | null;
  place_count: number | null;
  cover_image: string | null;
  is_editor_pick: boolean;
  initialSaved?: boolean;
  /** 코스에 포함된 장소 이미지들 (cover_image 없을 때 폴백) */
  placeImages?: string[];
}

export function CourseCard({
  id,
  title,
  description: _description,
  district,
  theme_tag,
  duration_min,
  place_count,
  cover_image,
  is_editor_pick,
  initialSaved = false,
  placeImages = [],
}: CourseCardProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isBouncing, setIsBouncing] = useState(false);

  const handleSaveToggle = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved((prev) => !prev);
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 450);

    const result = await toggleSavedCourse(id);
    if (result.error) {
      setIsSaved((prev) => !prev);
      if (result.error === "로그인이 필요해요") {
        router.push("/login");
      }
    }
  }, [id, router]);

  // duration_min → "2.5시간" / "45분" 형식
  const durationLabel = duration_min
    ? duration_min >= 60
      ? `${+(duration_min / 60).toFixed(1)}시간`
      : `${duration_min}분`
    : null;

  // 표시할 이미지 결정: cover_image > placeImages > fallback
  const displayImages = cover_image ? [cover_image] : placeImages.slice(0, 3);

  return (
    <Link
      href={`/courses/${id}`}
      className="group relative block rounded overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
    >
      {/* SVG spacer — 카드 전체를 1:1 정사각형으로 */}
      <svg viewBox="0 0 1 1" className="block w-full" aria-hidden="true" />

      {/* 이미지 — 카드 전체 배경 */}
      <div className="absolute inset-0">
        {displayImages.length >= 3 ? (
          <div className="w-full h-full flex gap-0.5">
            <div className="relative flex-1 h-full">
              <FadeImage src={displayImages[0]} alt={title} sizes="50vw" className="group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="flex flex-col gap-0.5 w-[38%] h-full">
              <div className="relative flex-1">
                <FadeImage src={displayImages[1]} alt="" sizes="25vw" className="group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="relative flex-1">
                <FadeImage src={displayImages[2]} alt="" sizes="25vw" className="group-hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
          </div>
        ) : displayImages.length === 2 ? (
          <div className="w-full h-full flex gap-0.5">
            <div className="relative flex-1 h-full">
              <FadeImage src={displayImages[0]} alt={title} sizes="50vw" className="group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="relative flex-1 h-full">
              <FadeImage src={displayImages[1]} alt="" sizes="50vw" className="group-hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
        ) : displayImages.length === 1 ? (
          <FadeImage
            src={displayImages[0]}
            alt={title}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <CourseCoverFallback themeTag={theme_tag} />
        )}
      </div>

      {/* 테마 배지 — 좌상단 */}
      {theme_tag && (
        <div className="absolute top-2.5 left-2.5">
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{ background: "rgba(255,255,255,0.92)", color: "var(--mongle-brown)" }}
          >
            {theme_tag}
          </span>
        </div>
      )}

      {/* 저장 버튼 — 우상단 */}
      <button
        onClick={handleSaveToggle}
        className={cn(
          "absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200",
          isBouncing && "scale-125"
        )}
        style={{ background: "rgba(255,255,255,0.9)" }}
        aria-label={isSaved ? "코스 저장 해제" : "코스 저장"}
      >
        <Heart
          size={13}
          className="transition-colors duration-200"
          style={{
            color: isSaved ? "var(--mongle-peach)" : "var(--mongle-brown)",
            fill: isSaved ? "var(--mongle-peach)" : "transparent",
            opacity: isSaved ? 1 : 0.5,
          }}
        />
      </button>

      {/* 하단 그라디언트 오버레이 + 텍스트 */}
      <div
        className="absolute bottom-0 left-0 right-0 px-3 pt-10 pb-3"
        style={{
          background: "linear-gradient(to top, rgba(20,8,2,0.88) 0%, rgba(20,8,2,0.55) 55%, transparent 100%)",
        }}
      >
        <h3
          className="text-xs md:text-sm font-bold leading-snug line-clamp-2 mb-1.5"
          style={{ color: "white", textShadow: "0 1px 6px rgba(0,0,0,0.6)", wordBreak: "keep-all", textWrap: "pretty" } as React.CSSProperties}
        >
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {district && (
            <span className="flex items-center gap-0.5 text-[10px] md:text-[12px]" style={{ color: "rgba(255,255,255,0.85)" }}>
              <MapPin size={10} />
              {district}
            </span>
          )}
          {durationLabel && (
            <span className="flex items-center gap-0.5 text-[10px] md:text-[12px]" style={{ color: "rgba(255,255,255,0.85)" }}>
              <Clock size={10} />
              {durationLabel}
            </span>
          )}
          {place_count != null && place_count > 0 && (
            <span className="text-[10px] md:text-[12px]" style={{ color: "rgba(255,255,255,0.85)" }}>
              {place_count}곳
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
