"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Coffee, UtensilsCrossed, BookOpen, Frame, TreePine, Sparkles, ShoppingBag, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleSavedPlace } from "@/app/actions/saved";

const CATEGORY_LABELS: Record<string, string> = {
  cafe: "카페", restaurant: "음식점", bookstore: "서점",
  gallery: "갤러리", park: "공원", popup: "팝업", shop: "소품샵",
};

type IconComponent = React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>;

const CATEGORY_BADGE: Record<string, { bg: string; color: string; icon: IconComponent }> = {
  cafe:       { bg: "#FFF0E6", color: "#C25E30", icon: Coffee },
  restaurant: { bg: "#FDE8D8", color: "#A83E1A", icon: UtensilsCrossed },
  bookstore:  { bg: "#F3EBE0", color: "#7A5533", icon: BookOpen },
  gallery:    { bg: "#F8F0E8", color: "#8B6842", icon: Frame },
  park:       { bg: "#EDF5EC", color: "#3D7A4E", icon: TreePine },
  popup:      { bg: "#FFF3E0", color: "#C25E30", icon: Sparkles },
  shop:       { bg: "#FFF9E6", color: "#8B6E2A", icon: ShoppingBag },
  default:    { bg: "#FFEDE4", color: "#C25E30", icon: MapPin },
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  cafe:       "linear-gradient(145deg, #FFDBC6 0%, #FFAA80 50%, #FF8C69 100%)",
  restaurant: "linear-gradient(145deg, #FFCBA4 0%, #E07030 100%)",
  bookstore:  "linear-gradient(145deg, #E8D5BC 0%, #C49A6C 100%)",
  gallery:    "linear-gradient(145deg, #F5EAD8 0%, #D4A978 100%)",
  park:       "linear-gradient(145deg, #D9EDD4 0%, #8FBF82 100%)",
  popup:      "linear-gradient(145deg, #FFD6A0 0%, #E07030 100%)",
  shop:       "linear-gradient(145deg, #FFF1C2 0%, #C9A86C 100%)",
  default:    "linear-gradient(145deg, #FFCDB8 0%, #FF8C69 100%)",
};

interface PlaceListRowProps {
  id: string;
  name: string;
  district: string | null;
  category: string | null;
  tags: string[] | null;
  images: string[] | null;
  keywords?: { keyword: string; direction: string; frequency: number }[] | null;
  initialSaved: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
  /**
   * true: 이미지·장소명만 상세 페이지 이동, 나머지 터치는 onClick(지도 포커스)
   * false(기본): 카드 전체가 상세 페이지 Link
   */
  splitInteraction?: boolean;
}

export function PlaceListRow({
  id, name, category, images, keywords, initialSaved, isHighlighted, onClick,
  splitInteraction = false,
}: PlaceListRowProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [imgFailed, setImgFailed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleSave = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved(p => !p);
    await toggleSavedPlace(id).catch(() => setSaved(p => !p));
  }, [id]);

  const imageUrl = !imgFailed ? (images?.[0] ?? null) : null;
  const gradient = CATEGORY_GRADIENTS[category ?? ""] ?? CATEGORY_GRADIENTS.default;
  const label    = CATEGORY_LABELS[category ?? ""] ?? category ?? "";
  const badge    = CATEGORY_BADGE[category ?? ""] ?? CATEGORY_BADGE.default;

  const cardStyle = {
    background: isHighlighted
      ? "linear-gradient(135deg,#FFF6F1 0%,#FFF0E6 100%)"
      : "white",
    border: isHighlighted ? "none" : "1px solid rgba(92,61,46,0.07)",
    padding: "12px",
  };

  const cardClass = cn(
    "flex gap-3.5 rounded-md transition-all duration-200 group overflow-hidden",
    isHighlighted
      ? "shadow-[0_0_0_2px_#FF8C69,0_4px_16px_rgba(255,140,105,0.18)]"
      : "shadow-[0_1px_6px_rgba(92,61,46,0.08)] hover:shadow-[0_3px_14px_rgba(92,61,46,0.13)]"
  );

  /* ── 썸네일 ── */
  const thumbnail = (
    <div
      className="relative flex-shrink-0 rounded-sm overflow-hidden"
      style={{ width: 104, height: 104 }}
    >
      {imageUrl ? (
        <>
          {!imgLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-[#f0e8e0] via-[#fdf6f0] to-[#f0e8e0] bg-[length:200%_100%] animate-shimmer" />
          )}
          <Image
            src={imageUrl}
            alt={name}
            fill
            className={cn("object-cover transition-all duration-300 group-hover:scale-[1.06]", imgLoaded ? "opacity-100" : "opacity-0")}
            sizes="104px"
            unoptimized
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgFailed(true)}
          />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center" style={{ background: gradient }}>
          <badge.icon size={28} strokeWidth={1.5} style={{ color: badge.color, opacity: 0.6 }} />
        </div>
      )}
      {imageUrl && label && (
        <div
          className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{
            background: "rgba(255,255,255,0.88)",
            color: badge.color,
            backdropFilter: "blur(4px)",
            letterSpacing: "0.01em",
          }}
        >
          <badge.icon size={9} strokeWidth={2.5} /> {label}
        </div>
      )}
    </div>
  );

  /* ── 장소명 ── */
  const placeName = (
    <p
      className="font-bold truncate leading-tight mb-1"
      style={{ color: "var(--mongle-brown)", fontSize: 15, letterSpacing: "-0.01em" }}
    >
      {name}
    </p>
  );

  /* ── 키워드 ── */
  const keywordsEl = (() => {
    const topKeywords = (keywords ?? [])
      .filter(k => k.direction === "positive")
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3);
    return topKeywords.length > 0 ? (
      <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-2">
        {topKeywords.map(k => (
          <span
            key={k.keyword}
            className="whitespace-nowrap text-[10.5px] leading-[1.5]"
            style={{ color: "rgba(92,61,46,0.6)", letterSpacing: "0.01em" }}
          >
            #{k.keyword}
          </span>
        ))}
      </div>
    ) : null;
  })();

  /* ── 저장 버튼 ── */
  const saveBtn = (
    <div className="flex-shrink-0 self-start">
      <button
        onClick={handleSave}
        className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200"
        style={{ background: saved ? "rgba(255,140,105,0.12)" : "transparent" }}
        aria-label={saved ? "저장 취소" : "저장"}
      >
        <Heart
          size={16}
          strokeWidth={2}
          fill={saved ? "var(--mongle-peach)" : "none"}
          style={{ color: saved ? "var(--mongle-peach)" : "rgba(92,61,46,0.3)" }}
        />
      </button>
    </div>
  );

  /* ── splitInteraction 모드 (모바일 바텀시트) ── */
  if (splitInteraction) {
    return (
      <div
        onClick={onClick}
        className={cn(cardClass, "cursor-pointer")}
        style={cardStyle}
      >
        {/* 이미지 → 상세 이동 */}
        <Link
          href={`/places/${id}`}
          onClick={e => e.stopPropagation()}
          className="flex-shrink-0"
        >
          {thumbnail}
        </Link>

        {/* 텍스트 영역 */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
          <div>
            {!imageUrl && label && (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5"
                style={{ background: badge.bg, color: badge.color }}
              >
                <badge.icon size={9} strokeWidth={2.5} /> {label}
              </span>
            )}
            {/* 장소명 → 상세 이동 */}
            <Link
              href={`/places/${id}`}
              onClick={e => e.stopPropagation()}
              className="block"
            >
              {placeName}
            </Link>
          </div>
          {/* 키워드 → 지도 포커스 (이벤트 버블링) */}
          {keywordsEl}
        </div>

        {saveBtn}
      </div>
    );
  }

  /* ── 기본 모드 (전체 카드 Link) ── */
  return (
    <Link
      href={`/places/${id}`}
      onClick={onClick}
      className={cardClass}
      style={cardStyle}
    >
      <div className="flex-shrink-0">{thumbnail}</div>

      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        <div>
          {!imageUrl && label && (
            <span
              className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5"
              style={{ background: badge.bg, color: badge.color }}
            >
              <badge.icon size={9} strokeWidth={2.5} /> {label}
            </span>
          )}
          {placeName}
        </div>
        {keywordsEl}
      </div>

      {saveBtn}
    </Link>
  );
}
