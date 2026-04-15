"use client";

import { useState, useCallback } from "react";
import { PlaceCardItemClient } from "./PlaceCardItemClient";
import { SectionScrollObserver } from "./SectionScrollObserver";
import Link from "next/link";

const SECTION_ID = "places-grid-section";
const PAGE_SIZE = 8;

interface Place {
  id: string;
  name: string;
  district: string | null;
  category: string | null;
  tags: string[] | null;
  images: string[] | null;
}

interface PlacesGridClientProps {
  initialPlaces: Place[];
  initialHasMore: boolean;
  initialSavedIds: string[];
  district?: string;
}

export function PlacesGridClient({
  initialPlaces,
  initialHasMore,
  initialSavedIds,
  district,
}: PlacesGridClientProps) {
  const [places, setPlaces] = useState<Place[]>(initialPlaces);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [dbOffset, setDbOffset] = useState(initialPlaces.length);
  const [savedIds] = useState(() => new Set(initialSavedIds));

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        offset: String(dbOffset),
        limit: String(PAGE_SIZE),
        ...(district ? { district } : {}),
      });
      const res = await fetch(`/api/places?${params}`);
      const { places: fetched, hasMore: more } = await res.json() as { places: Place[]; hasMore: boolean };
      setPlaces(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        return [...prev, ...fetched.filter(p => !existingIds.has(p.id))];
      });
      setDbOffset(prev => prev + fetched.length);
      setHasMore(more);
    } finally {
      setLoading(false);
    }
  }, [loading, dbOffset, district]);

  return (
    <section
      id={SECTION_ID}
      className="py-7 md:py-12"
      style={{ background: "var(--mongle-cream)" }}
      aria-label="느낌 좋은 장소들"
    >
      <SectionScrollObserver sectionId={SECTION_ID} threshold={0.08} />

      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-4 md:mb-6 flex items-end justify-between">
          <div>
            <h2
              className="text-xl md:text-3xl font-bold mb-1"
              style={{ color: "var(--mongle-brown)", fontFamily: "var(--font-seoul)" }}
            >
              느낌 좋은 장소들
            </h2>
            <p
              className="text-sm md:text-base"
              style={{ color: "var(--mongle-brown)", opacity: 0.6 }}
            >
              머무는 시간이 좋아지는 곳
            </p>
          </div>
          <Link
            href={district ? `/places?district=${encodeURIComponent(district)}` : "/places"}
            className="flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--mongle-peach-dark)" }}
          >
            전체보기 →
          </Link>
        </div>

        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5"
          role="list"
          aria-label="장소 카드 목록"
        >
          {places.map((place, index) => (
            <PlaceCardItemClient
              key={place.id}
              id={place.id}
              name={place.name}
              district={place.district ?? ""}
              category={place.category ?? ""}
              tags={place.tags ?? []}
              imageUrl={place.images?.[0] ?? null}
              index={index % PAGE_SIZE}
              initialSaved={savedIds.has(place.id)}
              animationMode={index < initialPlaces.length ? "scroll" : "enter"}
            />
          ))}
        </div>

        {hasMore && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-8 py-3 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:scale-100"
              style={{
                background: "var(--mongle-peach)",
                color: "white",
                boxShadow: "0 4px 16px rgba(255,140,105,0.3)",
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full border-2 animate-spin inline-block"
                    style={{ borderColor: "rgba(255,255,255,0.4)", borderTopColor: "white" }}
                  />
                  모아오는 중…
                </span>
              ) : "장소 더 보기"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
