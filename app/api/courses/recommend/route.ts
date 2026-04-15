/**
 * POST /api/courses/recommend
 * - party(인원), duration(소요시간), district(동네, optional) 수신
 * - DB에서 활성 장소 조회 → Claude Haiku가 코스 구성 (장소 선택 + 순서 + 제목/설명)
 * - courses + course_places 테이블에 INSERT
 * - { courseId, reason } 반환
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic();

// service role로 RLS 우회 (INSERT 권한)
function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const PARTY_THEME: Record<string, string> = {
  solo:  "혼놀코스",
  duo:   "데이트코스",
  group: "데이트코스",
};

const DURATION_LABEL: Record<string, string> = {
  short: "가볍게 (2시간 이내)",
  half:  "반나절 (3~5시간)",
  day:   "하루 종일 (6시간+)",
};

// 소요시간 파라미터 → 코스 총 시간(분) 가이드
const DURATION_TARGET_MIN: Record<string, number> = {
  short: 100,
  half:  210,
  day:   400,
};

// 최근접 이웃 알고리즘 — 첫 번째 장소 기준으로 가장 가까운 순서로 정렬
function nearestNeighbor<T extends { id: string; lat: number; lng: number }>(places: T[]): T[] {
  if (places.length <= 2) return places;
  const remaining = [...places];
  const result: T[] = [remaining.shift()!];
  while (remaining.length > 0) {
    const last = result[result.length - 1];
    let nearestIdx = 0;
    let minDist = Infinity;
    remaining.forEach((p, i) => {
      const dist = Math.hypot(p.lat - last.lat, p.lng - last.lng);
      if (dist < minDist) { minDist = dist; nearestIdx = i; }
    });
    result.push(remaining.splice(nearestIdx, 1)[0]);
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const { party, duration, district } = await req.json() as {
      party: string;
      duration: string;
      district?: string;
    };

    // 로그인 유저 확인
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ courseId: null, reason: null, error: "로그인이 필요합니다." }, { status: 401 });
    }

    const supabase = createAdminClient();

    // ── 1. 활성 장소 조회 ──────────────────────────────────────────────────
    let query = supabase
      .from("places")
      .select("id, name, category, subcategory, address, district, tags, lat, lng")
      .eq("is_active", true);

    if (district) query = query.eq("district", district);

    const { data: placesData, error: placesError } = await query.limit(60);
    if (placesError) throw placesError;

    const places = placesData ?? [];
    if (places.length < 2) {
      return NextResponse.json({ courseId: null, reason: null, error: "장소 데이터가 부족합니다." });
    }

    // ── 2. Claude에게 코스 구성 요청 ────────────────────────────────────────
    const placeList = places.map((p) =>
      `id=${p.id} | ${p.name} | ${p.category}${p.subcategory ? `(${p.subcategory})` : ""} | ${p.district ?? "미정"} | 태그: ${(p.tags ?? []).join(", ")}`
    ).join("\n");

    const themeLabel = PARTY_THEME[party] ?? party;
    const durationLabel = DURATION_LABEL[duration] ?? duration;
    const targetMin = DURATION_TARGET_MIN[duration] ?? 200;

    const prompt = `당신은 감성적인 서울 로컬 코스 큐레이터입니다.
사용자 조건:
- 인원: ${themeLabel}
- 소요 시간: ${durationLabel}${district ? `\n- 선호 동네: ${district}` : ""}

아래 장소 목록 중에서 위 조건에 가장 잘 맞는 장소들을 골라 하나의 코스를 구성해주세요.

규칙:
- 총 ${Math.round(targetMin / 60 * 10) / 10}시간 내외의 코스
- 장소 수: ${duration === "short" ? "2~3" : duration === "half" ? "3~4" : "4~5"}곳 (반드시 2곳 이상)
- 같은 동네이거나 이동하기 편한 장소들로 구성
- 흐름이 자연스럽게 (카페 → 산책 → 식사 등)
- 인원 특성에 맞게:
  * 혼자: 조용한 카페/서점 우선. 식당은 반드시 혼밥 가능한 구조(카운터석·1인 테이블·베이커리 카페)여야 함. 태그에 "혼밥" "1인" "카운터" 포함된 장소 우선. 단체 회식용 고깃집·대형 포차 절대 제외
  * 데이트: 분위기 좋고 함께 앉기 편한 곳, 사진 찍기 예쁜 공간
  * 그룹: 넓고 활기차며 단체 수용 가능한 곳

장소 목록:
${placeList}

응답은 반드시 아래 JSON 형식만 (다른 텍스트 없음):
{
  "title": "코스 제목 (20자 이내, 감성적으로)",
  "description": "코스 소개 (50자 이내, 따뜻하게)",
  "theme_tag": "${themeLabel}",
  "district": "주요 동네 이름",
  "reason": "이 코스를 추천하는 이유 한 문장 (이모지 1개 포함, 30자 이내)",
  "places": [
    { "id": "place_uuid", "visit_duration_min": 60, "note": "방문 포인트 한 줄" }
  ]
}`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";

    let parsed: {
      title: string;
      description: string;
      theme_tag: string;
      district: string;
      reason: string;
      places: { id: string; visit_duration_min: number; note: string }[];
    };

    try {
      // JSON 블록만 추출 (```json ... ``` 감싸져 있을 수 있음)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      console.error("[recommend] AI 원본 응답:", text);
      return NextResponse.json({ courseId: null, reason: null, error: "AI 응답 파싱 실패" });
    }

    // 반환된 place id들이 실제 장소 목록에 있는지 검증
    const placeMap = new Map(places.map((p) => [p.id, p]));
    const validPlaces = (parsed.places ?? []).filter((p) => placeMap.has(p.id));

    if (validPlaces.length < 2) {
      return NextResponse.json({ courseId: null, reason: null, error: "장소가 2개 미만입니다." });
    }

    // ── 최근접 이웃 알고리즘으로 동선 최적화 ─────────────────────────────────
    const withCoords = validPlaces.map((p) => ({ ...p, ...placeMap.get(p.id)! }));
    const hasCoords = withCoords.every((p) => p.lat && p.lng);

    const orderedPlaces = hasCoords ? nearestNeighbor(withCoords) : validPlaces;

    // ── 3. courses 테이블 INSERT ────────────────────────────────────────────
    const totalMin = orderedPlaces.reduce((sum, p) => sum + (p.visit_duration_min ?? 60), 0);

    const { data: courseRow, error: courseError } = await supabase
      .from("courses")
      .insert({
        title:        parsed.title,
        description:  parsed.description,
        theme_tag:    parsed.theme_tag ?? themeLabel,
        district:     parsed.district ?? district ?? null,
        duration_min: totalMin,
        place_count:  validPlaces.length,
        is_public:    false,
        is_editor_pick: false,
        has_popup:    false,
        ...(user ? { created_by: user.id } : {}),
      })
      .select("id")
      .single();

    if (courseError) throw courseError;
    const courseId = courseRow.id as string;

    // ── 4. course_places 테이블 INSERT ─────────────────────────────────────
    const coursePlacesRows = orderedPlaces.map((p, i) => ({
      course_id:          courseId,
      place_id:           p.id,
      order_index:        i,
      visit_duration_min: p.visit_duration_min ?? 60,
      note:               p.note ?? null,
    }));

    const { error: cpError } = await supabase
      .from("course_places")
      .insert(coursePlacesRows);

    if (cpError) throw cpError;

    return NextResponse.json({ courseId, reason: parsed.reason });
  } catch (err) {
    console.error("[/api/courses/recommend]", err);
    return NextResponse.json({ courseId: null, reason: null, error: "서버 오류" }, { status: 500 });
  }
}
