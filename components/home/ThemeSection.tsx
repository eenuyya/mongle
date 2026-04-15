"use client";

/**
 * ThemeSection 컴포넌트
 * - "테마별 코스" 가로 스크롤 섹션
 * - 8개 테마 카드를 마우스 드래그로 스크롤 가능
 * - 각 카드는 따뜻한 색상 그라디언트 배경 + Lucide 아이콘 + 테마명 + 장소 수 배지
 * - hover: scale(1.04) + 더 깊은 shadow + 살짝 위로 float
 * - 섹션 진입 시 Intersection Observer fadeUp 애니메이션
 */

import { useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  User, Heart, Coffee, Palette, ShoppingBag,
  Tent, UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEMES as THEME_METAS } from "@/lib/constants/themes";

interface ThemeCard {
  id: string;
  icon: LucideIcon;
  label: string;
  count: number;
  gradient: string;
  textColor: string;
  image: string;
}

/** 테마 카드 시각 데이터 — id는 THEME_METAS와 일치해야 함 */
const THEME_VISUALS: Record<string, Omit<ThemeCard, "id" | "label" | "count">> = {
  혼놀코스:  { icon: User,           gradient: "linear-gradient(145deg, #FFD166 0%, #FF8C69 100%)",  textColor: "#5C3D2E", image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=320&q=80&auto=format&fit=crop" },
  데이트코스: { icon: Heart,          gradient: "linear-gradient(145deg, #FFCDB8 0%, #FF8C69 100%)",  textColor: "#5C3D2E", image: "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=320&q=80&auto=format&fit=crop" },
  브런치코스: { icon: UtensilsCrossed, gradient: "linear-gradient(145deg, #FFECD2 0%, #FCB69F 100%)",  textColor: "#5C3D2E", image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=320&q=80&auto=format&fit=crop" },
  카공투어:  { icon: Coffee,          gradient: "linear-gradient(145deg, #E8C9A0 0%, #C49A6C 100%)",  textColor: "#3D2408", image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=320&q=80&auto=format&fit=crop" },
  전시탐방:  { icon: Palette,         gradient: "linear-gradient(145deg, #F8E4CF 0%, #E8A87C 100%)",  textColor: "#5C3D2E", image: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=320&q=80&auto=format&fit=crop" },
  소품샵투어: { icon: ShoppingBag,     gradient: "linear-gradient(145deg, #FFF0C8 0%, #FFD166 100%)",  textColor: "#5C3D2E", image: "https://images.unsplash.com/photo-1555212697-194d092e3b8f?w=320&q=80&auto=format&fit=crop" },
  팝업탐방:  { icon: Tent,            gradient: "linear-gradient(145deg, #FFB347 0%, #E07030 100%)",  textColor: "#fff",    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=320&q=80&auto=format&fit=crop" },
};

const THEME_CARDS: ThemeCard[] = THEME_METAS.map((t) => ({
  id: t.id,
  label: t.hashLabel,
  count: 0,
  ...THEME_VISUALS[t.id],
}));

export function ThemeSection({ themeCounts = {}, themeImages = {} }: { themeCounts?: Record<string, number>; themeImages?: Record<string, string> }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const isDragging = useRef(false);
  const wasDragged = useRef(false);
  const dragStartX = useRef(0);
  const scrollStartLeft = useRef(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            section.querySelectorAll(".animate-on-scroll").forEach((el) => {
              el.classList.add("is-visible");
            });
            observer.unobserve(section);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    isDragging.current = true;
    wasDragged.current = false;
    dragStartX.current = e.pageX - container.offsetLeft;
    scrollStartLeft.current = container.scrollLeft;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - dragStartX.current) * 1.2;
    if (Math.abs(walk) > 4) wasDragged.current = true;
    container.scrollLeft = scrollStartLeft.current - walk;
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-10 md:py-16"
      style={{ background: "var(--mongle-cream)" }}
      aria-label="테마별 코스"
    >
      <div className="mx-auto max-w-7xl px-4">
        <div className="animate-on-scroll mb-4 md:mb-6 flex items-end justify-between">
          <div>
            <h2
              className="text-xl md:text-3xl font-bold mb-1"
              style={{ color: "var(--mongle-brown)", fontFamily: "var(--font-seoul)" }}
            >
              테마별 코스
            </h2>
            <p
              className="text-sm md:text-base"
              style={{ color: "var(--mongle-brown)", opacity: 0.6 }}
            >
              원하는 분위기로 하루를 채워보세요
            </p>
          </div>
          <Link
            href="/courses"
            className="flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--mongle-peach-dark)" }}
            aria-label="전체 코스 보기"
          >
            전체 보기 →
          </Link>
        </div>

        <div
          ref={scrollContainerRef}
          className="drag-scroll scrollbar-hide flex gap-4 overflow-x-auto pt-3 pb-8 -mx-4 px-4"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          role="list"
          aria-label="테마 카드 목록"
        >
          {THEME_CARDS.map((card, index) => (
            <ThemeCard key={card.id} card={{ ...card, count: themeCounts[card.id] ?? card.count }} index={index} wasDragged={wasDragged} image={themeImages[card.id]} />
          ))}
        </div>

        <p
          className="mt-1 text-center text-xs md:hidden"
          style={{ color: "var(--mongle-brown)", opacity: 0.4 }}
          aria-hidden="true"
        >
          옆으로 밀어보세요 →
        </p>
      </div>
    </section>
  );
}

function ThemeCard({ card, index, wasDragged, image }: { card: ThemeCard; index: number; wasDragged: React.RefObject<boolean>; image?: string }) {
  const Icon = card.icon;
  return (
    <Link
      href={`/courses?theme=${encodeURIComponent(card.id)}`}
      onClick={(e) => { if (wasDragged.current) e.preventDefault(); }}
      className={cn(
        "animate-on-scroll flex-none flex-shrink-0",
        "rounded-lg transition-all duration-200 ease-out cursor-pointer overflow-hidden",
        "hover:scale-[1.04] hover:-translate-y-1.5 active:scale-[0.98]",
        `stagger-${Math.min(index + 1, 8)}`
      )}
      style={{
        width: "160px",
        height: "210px",
        background: "white",
        boxShadow: "0 4px 20px rgba(220,100,40,0.13)",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 10px 30px rgba(220,100,40,0.30)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 20px rgba(220,100,40,0.15)";
      }}
      role="listitem"
      aria-label={`${card.label} — ${card.count}곳`}
    >
      {/* 상단 절반 — DB 이미지 → 테마 기본 이미지 → 그라디언트 순 폴백 */}
      <div className="w-full relative" style={{ height: "105px" }}>
        {(image || card.image) ? (
          <Image
            src={image ?? card.image}
            alt={card.label}
            fill
            className="object-cover"
            sizes="160px"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0" style={{ background: card.gradient }} />
        )}
      </div>

      {/* 하단 절반 — 흰 배경 + 테마명 */}
      <div className="flex flex-col items-center justify-center gap-2 pt-7 pb-4 px-2" style={{ height: "105px" }}>
        <span className="text-sm font-semibold text-center leading-tight" style={{ color: "var(--mongle-brown)" }}>
          {card.label}
        </span>
      </div>

      {/* 가운데 아이콘 서클 — 상/하단 경계 위에 오버랩 */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full bg-white"
        style={{
          top: "81px",
          width: "48px",
          height: "48px",
          boxShadow: "0 2px 10px rgba(92,61,46,0.15)",
          border: "2px solid var(--mongle-warm)",
          zIndex: 10,
        }}
      >
        <Icon size={22} strokeWidth={1.5} style={{ color: "var(--mongle-peach)" }} aria-hidden="true" />
      </div>
    </Link>
  );
}
