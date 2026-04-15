import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Phone, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NaverMap } from "@/components/place/NaverMap";
import { PlacePhotoGallery } from "@/components/place/PlacePhotoGallery";
import { BackButton } from "@/components/place/BackButton";

const CATEGORY_LABELS: Record<string, string> = {
  cafe: "카페",
  restaurant: "음식점",
  bookstore: "서점",
  gallery: "갤러리",
  park: "공원",
  popup: "팝업",
  shop: "소품샵",
};

export default async function PlaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // UUID 형식 검증 — 형식이 맞지 않으면 즉시 404 반환하여 불필요한 DB 쿼리 방지
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(id)) notFound();

  const supabase = await createClient();

  const [{ data: place }, { data: keywords }] = await Promise.all([
    supabase
      .from("places")
      .select(
        "id, name, category, subcategory, address, district, city, lat, lng, phone, naver_url, images, tags"
      )
      .eq("id", id)
      .single(),
    supabase
      .from("place_score_keywords")
      .select("score_axis, direction, keyword, frequency")
      .eq("place_id", id)
      .order("frequency", { ascending: false })
      .limit(20),
  ]);

  if (!place) notFound();

  const categoryLabel = CATEGORY_LABELS[place.category] ?? place.category;
  const images: string[] = place.images ?? [];

  // 분위기 키워드 — positive vibe/alone/together 우선
  const positiveKeywords = (keywords ?? [])
    .filter((k) => k.direction === "positive")
    .slice(0, 8);

  return (
    <main
      className="min-h-screen pt-12 md:pt-16"
      style={{ background: "var(--mongle-cream)" }}
    >
      {/* 뒤로가기 */}
      <div className="mx-auto max-w-2xl px-4 pt-6 pb-2">
        <BackButton />
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-20 space-y-6">

        {/* 이미지 갤러리 */}
        <PlacePhotoGallery images={images} name={place.name} />

        {/* 장소 기본 정보 */}
        <div
          className="rounded-2xl p-5 space-y-3"
          style={{ background: "white", boxShadow: "0 2px 12px rgba(92,61,46,0.07)" }}
        >
          {/* 카테고리 배지 + 이름 */}
          <div>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: "var(--mongle-warm)", color: "var(--mongle-brown)" }}
            >
              {categoryLabel}
            </span>
            <h1
              className="mt-2 text-2xl font-bold leading-tight"
              style={{ color: "var(--mongle-brown)" }}
            >
              {place.name}
            </h1>
          </div>

          {/* 위치 */}
          <div className="flex items-start gap-2">
            <MapPin size={15} style={{ color: "var(--mongle-peach)", marginTop: 2 }} />
            <div>
              <p className="text-sm" style={{ color: "var(--mongle-brown)" }}>
                {place.address}
              </p>
              {place.district && (
                <p className="text-xs mt-0.5" style={{ color: "var(--mongle-brown)", opacity: 0.55 }}>
                  {place.city} · {place.district}
                </p>
              )}
            </div>
          </div>

          {/* 전화번호 */}
          {place.phone && (
            <div className="flex items-center gap-2">
              <Phone size={14} style={{ color: "var(--mongle-peach)" }} />
              <a
                href={`tel:${place.phone}`}
                className="text-sm hover:underline"
                style={{ color: "var(--mongle-brown)" }}
              >
                {place.phone}
              </a>
            </div>
          )}

          {/* 외부 링크 */}
          <div className="flex items-center gap-3 flex-wrap">
            {place.naver_url && (
              <a
                href={place.naver_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: "var(--mongle-peach-dark)" }}
              >
                <ExternalLink size={14} />
                네이버 지도
              </a>
            )}
            <a
              href={`https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(place.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: "#E1306C" }}
            >
              <ExternalLink size={14} />
              인스타그램 검색
            </a>
          </div>
        </div>

        {/* 태그 */}
        {(place.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(place.tags as string[]).map((tag) => (
              <span
                key={tag}
                className="text-sm px-3 py-1.5 rounded-full font-medium"
                style={{
                  background: "white",
                  color: "var(--mongle-brown)",
                  border: "1px solid var(--mongle-peach-light)",
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 분위기 키워드 */}
        {positiveKeywords.length > 0 && (
          <div
            className="rounded-2xl p-5"
            style={{ background: "white", boxShadow: "0 2px 12px rgba(92,61,46,0.07)" }}
          >
            <h2
              className="text-base font-semibold mb-3"
              style={{ color: "var(--mongle-brown)" }}
            >
              이런 곳이에요
            </h2>
            <div className="flex flex-wrap gap-2">
              {positiveKeywords.map((k, i) => (
                <span
                  key={`${k.keyword}-${i}`}
                  className="text-sm px-3 py-1.5 rounded-full"
                  style={{
                    background: "var(--mongle-warm)",
                    color: "var(--mongle-brown)",
                  }}
                >
                  {k.keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 지도 */}
        {place.lat && place.lng && (
          <div
            className="rounded-2xl overflow-hidden p-4"
            style={{ background: "white", boxShadow: "0 2px 12px rgba(92,61,46,0.07)" }}
          >
            <h2
              className="text-base font-semibold mb-3"
              style={{ color: "var(--mongle-brown)" }}
            >
              위치
            </h2>
            <NaverMap lat={place.lat} lng={place.lng} name={place.name} />
            <p
              className="mt-2.5 text-xs text-center"
              style={{ color: "var(--mongle-brown)", opacity: 0.5 }}
            >
              {place.address}
            </p>
          </div>
        )}

      </div>
    </main>
  );
}
