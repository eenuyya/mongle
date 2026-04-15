import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PlacesMapLayout } from "@/components/places/PlacesMapLayout";

export default async function PlacesPage() {
  const supabase = await createClient();

  // 초기 장소 (lat/lng 포함) — 지도 마커용
  const { data } = await supabase
    .from("places")
    .select("id, name, district, category, tags, images, lat, lng, place_score_keywords(keyword, direction, frequency)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50);

  const places = data ?? [];

  // DB에 실제 존재하는 동네 목록
  const { data: districtRows } = await supabase
    .from("places")
    .select("district")
    .eq("is_active", true)
    .not("district", "is", null);

  // DB 값(예: "성수동")을 NEIGHBORHOOD_DATA id(예: "성수")와 매칭되도록 정규화
  const KNOWN_NEIGHBORHOODS = ["망원", "연남", "문래", "서촌", "익선", "한남", "성수", "회기"];
  const rawDistricts = (districtRows ?? []).map((r) => r.district as string);
  const availableDistricts = [
    ...new Set(
      rawDistricts.map((d) =>
        KNOWN_NEIGHBORHOODS.find((n) => d.startsWith(n)) ?? d
      )
    ),
  ];

  // 로그인 유저 저장 목록
  const { data: { user } } = await supabase.auth.getUser();
  let savedIds = new Set<string>();
  if (user) {
    const { data: saved } = await supabase
      .from("saved_places")
      .select("place_id")
      .eq("user_id", user.id);
    savedIds = new Set((saved ?? []).map(s => s.place_id));
  }

  return (
    <main className="overflow-hidden" style={{ background: "var(--mongle-cream)" }}>
      <Suspense>
        <PlacesMapLayout
          initialPlaces={places}
          savedIds={savedIds}
          availableDistricts={availableDistricts}
        />
      </Suspense>
    </main>
  );
}
