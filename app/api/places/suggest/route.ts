/**
 * POST /api/places/suggest
 * - coursePlaceIds: string[]  (현재 코스의 장소 id 목록)
 * - district: string          (동네 이름)
 * - insertAfterIndex: number  (삽입 위치)
 * Claude Haiku가 코스 흐름에 어울리는 장소 3개를 추천 + 이유 반환
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  const { coursePlaceIds, district, insertAfterIndex } = await req.json() as {
    coursePlaceIds: string[];
    district: string;
    insertAfterIndex: number;
  };

  const supabase = await createClient();

  // 코스 장소 상세 정보
  const { data: coursePlacesData } = await supabase
    .from("places")
    .select("id, name, category, tags")
    .in("id", coursePlaceIds.length > 0 ? coursePlaceIds : ["__none__"]);

  // 후보 장소 목록 (같은 동네, 코스에 없는 것)
  const { data: candidatesData } = await supabase
    .from("places")
    .select("id, name, category, tags, images")
    .eq("is_active", true)
    .eq("district", district)
    .not("id", "in", `(${coursePlaceIds.length > 0 ? coursePlaceIds.join(",") : "__none__"})`);

  const candidates = candidatesData ?? [];
  if (candidates.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  const coursePlaces = coursePlacesData ?? [];
  const insertPos = insertAfterIndex + 1; // 1-indexed position

  const prompt = `현재 코스에 있는 장소들:
${coursePlaces.map((p, i) => `${i + 1}. ${p.name} (${p.category}${p.tags?.length ? ", " + p.tags.join("/") : ""})`).join("\n") || "(아직 없음)"}

${coursePlaces.length > 0 ? `새 장소는 ${insertPos}번째 위치에 삽입됩니다.` : "코스의 첫 번째 장소를 추가합니다."}
동네: ${district}

후보 장소 목록 (id, 이름, 카테고리):
${candidates.map(p => `- id:${p.id} | ${p.name} | ${p.category}${p.tags?.length ? " | " + p.tags.join("/") : ""}`).join("\n")}

위 후보 중 코스 흐름에 자연스럽게 어울리는 장소 3개를 추천해주세요.
응답은 반드시 아래 JSON 형식으로만 출력하세요 (다른 텍스트 없이):
{"picks":[{"id":"...","reason":"..."},{"id":"...","reason":"..."},{"id":"...","reason":"..."}]}

reason은 한국어로 15자 이내로 짧게 작성하세요.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ suggestions: [] });

    const { picks } = JSON.parse(jsonMatch[0]) as { picks: { id: string; reason: string }[] };

    const pickedIds = picks.map(p => p.id);
    const pickedPlaces = candidates.filter(c => pickedIds.includes(c.id));

    const suggestions = pickedIds
      .map(id => {
        const place = pickedPlaces.find(p => p.id === id);
        const pick = picks.find(p => p.id === id);
        if (!place || !pick) return null;
        return { place, reason: pick.reason };
      })
      .filter(Boolean);

    return NextResponse.json({ suggestions });
  } catch {
    // 실패 시 랜덤 3개 반환
    const fallback = candidates.slice(0, 3).map(place => ({ place, reason: "추천 장소" }));
    return NextResponse.json({ suggestions: fallback });
  }
}
