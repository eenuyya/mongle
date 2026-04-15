"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Bookmark, RouteIcon } from "lucide-react";

const COVER_GRADIENTS: Record<string, string> = {
  혼자:   "linear-gradient(135deg, #FF8C69 0%, #FFD166 100%)",
  데이트: "linear-gradient(135deg, #FFCDB8 0%, #FF8C69 100%)",
  친구랑: "linear-gradient(135deg, #FFB347 0%, #FF8C69 100%)",
  카공:   "linear-gradient(135deg, #C9A86C 0%, #E8C9A0 100%)",
  전시:   "linear-gradient(135deg, #8B6842 0%, #C49A6C 100%)",
  산책:   "linear-gradient(135deg, #A8C5A0 0%, #E8C9A0 100%)",
  팝업:   "linear-gradient(135deg, #FFB347 0%, #E07030 100%)",
  default:"linear-gradient(135deg, #FF8C69 0%, #FFD166 100%)",
};

function getCoverGradient(themeTag?: string | null): string {
  if (!themeTag) return COVER_GRADIENTS.default;
  const match = Object.keys(COVER_GRADIENTS).find((k) => themeTag.includes(k));
  return match ? COVER_GRADIENTS[match] : COVER_GRADIENTS.default;
}

export interface SavedCourseCardProps {
  id: string;
  title: string;
  description: string | null;
  district: string | null;
  theme_tag: string | null;
  duration_min: number | null;
  place_count: number | null;
  cover_image: string | null;
  placeImages?: string[];
  onUnsave: (id: string) => void;
  style?: React.CSSProperties;
}

export function SavedCourseCard({
  id, title, description, district, theme_tag,
  duration_min, place_count, cover_image, placeImages = [], onUnsave, style,
}: SavedCourseCardProps) {
  const durationLabel = duration_min
    ? duration_min >= 60
      ? `${Math.floor(duration_min / 60)}시간${duration_min % 60 ? ` ${duration_min % 60}분` : ""}`
      : `${duration_min}분`
    : null;

  const coverGradient = getCoverGradient(theme_tag);
  const displayImages = cover_image ? [cover_image] : placeImages.slice(0, 2);

  return (
    <div
      className="flex rounded-lg overflow-hidden"
      style={{
        background: "white",
        boxShadow: "0 2px 12px rgba(92,61,46,0.08)",
        border: "1px solid rgba(92,61,46,0.06)",
        minHeight: 112,
        ...style,
      }}
    >
      {/* 커버 이미지 */}
      <Link href={`/courses/${id}`} className="relative flex-shrink-0 overflow-hidden" style={{ width: 108, minHeight: 112 }}>
        {displayImages.length >= 2 ? (
          <div className="absolute inset-0 flex flex-col gap-0.5">
            <div className="relative flex-1">
              <Image src={displayImages[0]} alt={title} fill className="object-cover" sizes="108px" unoptimized />
            </div>
            <div className="relative flex-1">
              <Image src={displayImages[1]} alt="" fill className="object-cover" sizes="108px" unoptimized />
            </div>
          </div>
        ) : displayImages.length === 1 ? (
          <Image src={displayImages[0]} alt={title} fill className="object-cover" sizes="108px" unoptimized />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: coverGradient }}
          >
            <RouteIcon size={22} color="rgba(255,255,255,0.7)" />
          </div>
        )}
      </Link>

      {/* 정보 */}
      <Link
        href={`/courses/${id}`}
        className="flex-1 flex flex-col justify-center gap-1.5 px-3.5 py-3.5 min-w-0"
      >
        {theme_tag && (
          <span
            className="self-start px-2 rounded-full font-medium"
            style={{
              fontSize: 10,
              lineHeight: "18px",
              background: "var(--mongle-warm)",
              color: "var(--mongle-brown)",
            }}
          >
            {theme_tag}
          </span>
        )}
        <p
          className="font-semibold leading-snug line-clamp-1"
          style={{ fontSize: 14, color: "var(--mongle-brown)" }}
        >
          {title}
        </p>
        {description && (
          <p
            className="line-clamp-1"
            style={{ fontSize: 12, color: "var(--mongle-brown)", opacity: 0.5 }}
          >
            {description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-0.5">
          {district && (
            <span className="flex items-center gap-0.5 text-xs" style={{ color: "var(--mongle-brown)", opacity: 0.45 }}>
              <MapPin size={10} />
              {district}
            </span>
          )}
          {durationLabel && (
            <span className="flex items-center gap-0.5 text-xs" style={{ color: "var(--mongle-brown)", opacity: 0.45 }}>
              <Clock size={10} />
              {durationLabel}
            </span>
          )}
          {place_count != null && place_count > 0 && (
            <span className="text-xs" style={{ color: "var(--mongle-brown)", opacity: 0.45 }}>
              {place_count}곳
            </span>
          )}
        </div>
      </Link>

      {/* 저장 해제 버튼 */}
      <button
        onClick={() => onUnsave(id)}
        className="flex-shrink-0 flex items-center justify-center self-center mr-3.5 rounded-full transition-all active:scale-90 hover:opacity-70"
        style={{ width: 34, height: 34, background: "rgba(255,140,105,0.1)" }}
        aria-label="저장 해제"
      >
        <Bookmark
          size={16}
          style={{ color: "var(--mongle-peach)", fill: "var(--mongle-peach)" }}
        />
      </button>
    </div>
  );
}
