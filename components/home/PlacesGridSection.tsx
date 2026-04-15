/**
 * PlacesGridSection 컴포넌트 (async Server Component)
 * - "지금 느낌 좋은 장소들" 섹션
 * - 초기 8개는 서버에서, "더 보기"는 클라이언트에서 /api/places 호출로 append
 */

import { createClient } from "@/lib/supabase/server";
import { PlacesGridClient } from "./PlacesGridClient";

export async function PlacesGridSection({ district }: { district?: string }) {
  const supabase = await createClient();

  const INITIAL_LIMIT = 8;

  let query = supabase
    .from("places")
    .select("id, name, district, category, tags, images")
    .eq("is_active", true);

  if (district) query = query.eq("district", district);

  const { data } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(INITIAL_LIMIT + 1);
  const allFetched = data ?? [];
  const hasMore = allFetched.length > INITIAL_LIMIT;
  const places = allFetched.slice(0, INITIAL_LIMIT);

  const { data: { user } } = await supabase.auth.getUser();
  let savedIds: string[] = [];
  if (user) {
    const { data: saved } = await supabase
      .from("saved_places")
      .select("place_id")
      .eq("user_id", user.id);
    savedIds = (saved ?? []).map((s) => s.place_id);
  }

  return (
    <PlacesGridClient
      initialPlaces={places}
      initialHasMore={hasMore}
      initialSavedIds={savedIds}
      district={district}
    />
  );
}
