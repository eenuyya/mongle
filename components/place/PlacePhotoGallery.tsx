"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

function ShimmerBox({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`bg-gradient-to-r from-[#dce3ea] via-[#edf1f5] to-[#dce3ea] bg-[length:200%_100%] animate-shimmer ${className ?? ""}`}
      style={style}
    />
  );
}

function MainImage({ src, name, totalCount, onClick }: { src: string; name: string; totalCount: number; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden cursor-zoom-in"
      style={{ height: "280px" }}
      onClick={onClick}
    >
      {!loaded && <ShimmerBox className="absolute inset-0" />}
      <Image
        src={src}
        alt={name}
        fill
        className={`object-cover transition-all duration-500 hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
        unoptimized
        priority
        onLoad={() => setLoaded(true)}
      />
      {totalCount > 1 && (
        <span
          className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ background: "rgba(0,0,0,0.45)", color: "white", backdropFilter: "blur(4px)" }}
        >
          {totalCount}장
        </span>
      )}
    </div>
  );
}

function ThumbImage({ src, alt, onClick, extra }: { src: string; alt: string; onClick: () => void; extra?: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className="relative rounded-xl overflow-hidden cursor-pointer"
      style={{ height: "72px" }}
      onClick={onClick}
    >
      {!loaded && <ShimmerBox className="absolute inset-0" />}
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover transition-all duration-300 hover:opacity-80 ${loaded ? "opacity-100" : "opacity-0"}`}
        unoptimized
        onLoad={() => setLoaded(true)}
      />
      {extra && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
          <span className="text-sm font-semibold text-white">{extra}</span>
        </div>
      )}
    </div>
  );
}

interface PlacePhotoGalleryProps {
  images: string[];
  name: string;
}

export function PlacePhotoGallery({ images, name }: PlacePhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const openLightbox = useCallback((index: number) => setLightboxIndex(index), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const prev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  }, [images.length]);

  const next = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % images.length));
  }, [images.length]);

  // 키보드 지원
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, prev, next, closeLightbox]);

  // 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxIndex]);

  // 터치 스와이프
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 50) prev();
    else if (delta < -50) next();
    touchStartX.current = null;
  };

  if (images.length === 0) return null;

  return (
    <>
      {/* 갤러리 — 메인 이미지 + 썸네일 */}
      <div className="space-y-2">
        {/* 메인 이미지 */}
        <MainImage src={images[0]} name={name} totalCount={images.length} onClick={() => openLightbox(0)} />

        {/* 썸네일 */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {images.slice(1, 5).map((url, i) => (
              <ThumbImage
                key={i}
                src={url}
                alt={`${name} ${i + 2}`}
                onClick={() => openLightbox(i + 1)}
                extra={i === 3 && images.length > 5 ? `+${images.length - 5}` : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* 라이트박스 */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn"
          style={{ background: "rgba(0,0,0,0.92)" }}
          onClick={closeLightbox}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* 닫기 */}
          <button
            className="absolute top-5 right-5 flex items-center justify-center rounded-full transition-all active:scale-90 z-10"
            style={{ width: 40, height: 40, background: "rgba(255,255,255,0.12)" }}
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            aria-label="닫기"
          >
            <X size={20} color="white" />
          </button>

          {/* 인덱스 표시 */}
          <span
            className="absolute top-5 left-1/2 -translate-x-1/2 text-sm font-medium"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            {lightboxIndex + 1} / {images.length}
          </span>

          {/* 이전 버튼 */}
          {images.length > 1 && (
            <button
              className="absolute left-3 flex items-center justify-center rounded-full transition-all active:scale-90 z-10"
              style={{ width: 44, height: 44, background: "rgba(255,255,255,0.12)" }}
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="이전 사진"
            >
              <ChevronLeft size={24} color="white" />
            </button>
          )}

          {/* 다음 버튼 */}
          {images.length > 1 && (
            <button
              className="absolute right-3 flex items-center justify-center rounded-full transition-all active:scale-90 z-10"
              style={{ width: 44, height: 44, background: "rgba(255,255,255,0.12)" }}
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="다음 사진"
            >
              <ChevronRight size={24} color="white" />
            </button>
          )}

          {/* 이미지 */}
          <div
            className="relative w-full mx-4"
            style={{ maxWidth: 680, aspectRatio: "4/3" }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              key={lightboxIndex}
              src={images[lightboxIndex]}
              alt={`${name} ${lightboxIndex + 1}`}
              fill
              className="object-contain animate-fadeIn"
              unoptimized
            />
          </div>

          {/* 하단 닷 인디케이터 */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                  style={{
                    width: i === lightboxIndex ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === lightboxIndex ? "white" : "rgba(255,255,255,0.35)",
                    transition: "all 0.2s ease",
                  }}
                  aria-label={`${i + 1}번째 사진`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
