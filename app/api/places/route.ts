import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT     = 30;

// 허용된 카테고리 목록 — DB enum 값과 동기화
const ALLOWED_CATEGORIES = new Set([
  "cafe", "restaurant", "bookstore", "gallery", "park", "popup", "shop",
]);

/**
 * ilike 패턴에서 와일드카드 문자를 이스케이프합니다.
 * Supabase ilike는 내부적으로 PostgreSQL ILIKE를 사용하므로
 * `%`, `_`, `\` 문자가 패턴으로 해석되지 않도록 처리합니다.
 */
function escapeLikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // offset: 음수 및 NaN 방어
  const rawOffset = parseInt(searchParams.get("offset") ?? "0", 10);
  const offset    = isNaN(rawOffset) || rawOffset < 0 ? 0 : rawOffset;

  // limit: NaN 방어 및 최대값 고정
  const rawLimit = parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10);
  const limit    = isNaN(rawLimit) || rawLimit <= 0
    ? DEFAULT_LIMIT
    : Math.min(rawLimit, MAX_LIMIT);

  const rawDistrict = searchParams.get("district");
  const rawCategory = searchParams.get("category");

  // district: 최대 길이 제한 (DB 컬럼 크기 기준)
  const district = rawDistrict && rawDistrict.length <= 50 ? rawDistrict : null;

  // category: 허용 목록 외 값 차단
  const category = rawCategory && ALLOWED_CATEGORIES.has(rawCategory) ? rawCategory : null;

  // 지도 바운드: 유효 범위 내 좌표인지 검증
  const swLat = parseFloat(searchParams.get("swLat") ?? "");
  const swLng = parseFloat(searchParams.get("swLng") ?? "");
  const neLat = parseFloat(searchParams.get("neLat") ?? "");
  const neLng = parseFloat(searchParams.get("neLng") ?? "");
  const useBounds =
    !isNaN(swLat) && !isNaN(swLng) && !isNaN(neLat) && !isNaN(neLng) &&
    swLat >= -90  && swLat <= 90   &&
    neLat >= -90  && neLat <= 90   &&
    swLng >= -180 && swLng <= 180  &&
    neLng >= -180 && neLng <= 180  &&
    swLat < neLat && swLng < neLng;

  const supabase = await createClient();

  let query = supabase
    .from("places")
    .select("id, name, district, category, tags, images, lat, lng, place_score_keywords(keyword, direction, frequency)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit);

  if (useBounds) {
    query = query.gte("lat", swLat).lte("lat", neLat).gte("lng", swLng).lte("lng", neLng);
  } else {
    // "성수" 검색 시 "성수동"도 매칭되도록 ilike 사용
    // 와일드카드 문자를 이스케이프하여 패턴 인젝션 방지
    if (district) query = query.ilike("district", `${escapeLikePattern(district)}%`);
  }
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const all = data ?? [];
  return NextResponse.json({
    places:  all.slice(0, limit),
    hasMore: all.length > limit,
  });
}
