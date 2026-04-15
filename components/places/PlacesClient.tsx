"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Suspense } from "react";
import { PlaceCardItemClient } from "@/components/home/PlaceCardItemClient";
import { PlacesFilterBar } from "./PlacesFilterBar";

interface Place {
  id: string;
  name: string;
  district: string | null;
  category: string | null;
  tags: string[] | null;
  images: string[] | null;
}

interface PlacesClientProps {
  initialPlaces: Place[];
  initialHasMore: boolean;
  initialCount: number;
  districts: string[];
  activeCategory: string | null;
  activeDistrict: string | null;
  savedIds: Set<string>;
}

const LIMIT = 12;

export function PlacesClient({
  initialPlaces,
  initialHasMore,
  initialCount,
  districts,
  activeCategory,
  activeDistrict,
  savedIds,
}: PlacesClientProps) {
  const [extraPlaces, setExtraPlaces] = useState<Place[]>([]);
  const [hasMore, setHasMore]         = useState(initialHasMore);
  const [loading, setLoading]         = useState(false);
  const offset   = useRef(LIMIT);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const params = new URLSearchParams();
    params.set("offset", String(offset.current));
    if (activeCategory && activeCategory !== "all") params.set("category", activeCategory);
    if (activeDistrict && activeDistrict !== "all") params.set("district", activeDistrict);

    try {
      const res = await fetch(`/api/places?${params.toString()}`);
      const { places, hasMore: more } = await res.json() as { places: Place[]; hasMore: boolean };
      setExtraPlaces(prev => {
        const existingIds = new Set([...initialPlaces, ...prev].map(p => p.id));
        return [...prev, ...places.filter(p => !existingIds.has(p.id))];
      });
      setHasMore(more);
      offset.current += LIMIT;
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, activeCategory, activeDistrict]);

  // IntersectionObserver — sentinel이 뷰포트에 들어오면 fetchMore
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) fetchMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchMore]);

  const allPlaces = [...initialPlaces, ...extraPlaces].filter(
    (p, i, arr) => arr.findIndex(x => x.id === p.id) === i
  );

  return (
    <>
      <Suspense>
        <PlacesFilterBar districts={districts} />
      </Suspense>

      {/* 결과 수 */}
      <p className="mb-4 text-sm" style={{ color: "var(--mongle-brown)", opacity: 0.5 }}>
        {initialCount > 0 ? `${initialCount}곳` : ""}
      </p>

      {allPlaces.length === 0 ? (
        <div
          className="mt-16 flex flex-col items-center gap-2 text-center"
          style={{ color: "var(--mongle-brown)", opacity: 0.4 }}
        >
          <span className="text-3xl">🔍</span>
          <p className="text-sm font-medium">해당하는 장소가 없어요</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {allPlaces.map((place, index) => (
              <PlaceCardItemClient
                key={place.id}
                id={place.id}
                name={place.name}
                district={place.district ?? ""}
                category={place.category ?? ""}
                tags={place.tags ?? []}
                imageUrl={place.images?.[0] ?? null}
                index={index}
                initialSaved={savedIds.has(place.id)}
                animationMode="none"
              />
            ))}
          </div>

          {/* 무한스크롤 sentinel */}
          <div ref={sentinelRef} className="h-12 flex items-center justify-center mt-4">
            {loading && (
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{
                      background: "var(--mongle-peach)",
                      opacity: 0.6,
                      animationDelay: `${i * 120}ms`,
                    }}
                  />
                ))}
              </div>
            )}
            {!hasMore && allPlaces.length > 0 && (
              <p className="text-xs" style={{ color: "var(--mongle-brown)", opacity: 0.35 }}>
                모든 장소를 불러왔어요
              </p>
            )}
          </div>
        </>
      )}
    </>
  );
}
