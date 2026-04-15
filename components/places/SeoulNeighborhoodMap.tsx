"use client";

import { useState } from "react";

interface SeoulNeighborhoodMapProps {
  availableDistricts: string[];
  onSelect: (district: string) => void;
}

/* ── 위경도 → SVG 좌표 변환 ──────────────────────────────────────────
   x = (lng - 126.73) * 1050
   y = (37.71 - lat) * 1550
   ViewBox: 50 10 450 420
   ──────────────────────────────────────────────────────────────────── */

/* 실제 서울 행정경계 근사 (반시계) */
const SEOUL_PATH =
  "M 94,140 " +
  "C 94,105 142,65 158,62 " +          // 은평구 NW
  "C 178,58 250,12 294,16 " +          // 도봉구 N
  "C 328,19 352,40 368,62 " +          // 노원구 NE
  "C 390,82 405,106 410,124 " +        // 강북구 E
  "C 448,180 475,222 473,264 " +       // 강동구 E
  "C 471,308 455,348 431,372 " +       // 송파구 SE
  "C 408,394 372,418 336,419 " +       // 강남구 S
  "C 296,421 258,436 221,434 " +       // 관악구 S
  "C 180,432 153,412 137,388 " +       // 금천구 SW
  "C 115,360 92,336 94,310 " +         // 강서구 W
  "C 96,258 94,195 94,140 Z";          // 은평구 NW close

/* 한강 — 시각적 랜드마크 */
const HAN_RIVER =
  "M 94,294 " +
  "C 130,290 175,289 225,289 C 275,289 330,290 385,292 C 412,293 425,294 431,296 " +
  "L 431,308 " +
  "C 425,307 412,305 385,304 C 330,303 275,302 225,302 C 175,302 130,303 94,307 Z";

/* 동네 정의 — cx/cy는 실제 위경도 변환값 */
const NEIGHBORHOODS: {
  id: string; name: string;
  cx: number; cy: number;
  rx: number; ry: number;
  active: boolean;
}[] = [
  /* ── 활성 동네 ── */
  // 망원 37.556N 126.904E  → x=(126.904-126.73)*1050=183  y=(37.71-37.556)*1550=239
  { id: "망원",  name: "망원",  cx: 183, cy: 241, rx: 22, ry: 20, active: true },
  // 연남 37.567N 126.922E  → x=202  y=222
  { id: "연남",  name: "연남",  cx: 202, cy: 222, rx: 20, ry: 18, active: true },
  // 문래 37.517N 126.896E  → x=174  y=299 (한강 남쪽, 영등포)
  { id: "문래",  name: "문래",  cx: 174, cy: 308, rx: 22, ry: 20, active: true },
  // 서촌 37.577N 126.968E  → x=250  y=206
  { id: "서촌",  name: "서촌",  cx: 250, cy: 206, rx: 22, ry: 19, active: true },
  // 익선 37.574N 126.999E  → x=283  y=211
  { id: "익선",  name: "익선",  cx: 283, cy: 211, rx: 18, ry: 16, active: true },
  // 한남 37.537N 127.003E  → x=287  y=268
  { id: "한남",  name: "한남",  cx: 287, cy: 268, rx: 23, ry: 21, active: true },
  // 성수 37.544N 127.059E  → x=346  y=257
  { id: "성수",  name: "성수",  cx: 346, cy: 256, rx: 27, ry: 24, active: true },
  // 회기 37.590N 127.055E  → x=341  y=186
  { id: "회기",  name: "회기",  cx: 341, cy: 185, rx: 21, ry: 19, active: true },

  /* ── 준비 중 동네 ── */
  // 홍대 37.557N 126.924E  → x=204  y=237 (연남/망원 사이)
  { id: "홍대",     name: "홍대",     cx: 198, cy: 243, rx: 15, ry: 13, active: false },
  // 혜화 37.582N 127.002E  → x=286  y=197
  { id: "혜화",     name: "혜화",     cx: 286, cy: 196, rx: 14, ry: 13, active: false },
  // 이태원 37.534N 126.994E → x=278  y=273
  { id: "이태원",   name: "이태원",   cx: 266, cy: 274, rx: 17, ry: 15, active: false },
  // 건대입구 37.540N 127.071E → x=358  y=264
  { id: "건대입구", name: "건대입구", cx: 362, cy: 261, rx: 18, ry: 15, active: false },
];

/* 약간 유기적인 타원 블롭 경로 — 상단을 살짝 좁혀 자연스러운 느낌 */
function blobPath(cx: number, cy: number, rx: number, ry: number): string {
  const k  = 0.552;          // 원 근사 bezier 비율
  const tw = rx * 0.90;      // 상단 너비를 약간 좁힘
  return (
    `M ${cx},${cy - ry} ` +
    `C ${cx + tw * k},${cy - ry} ${cx + rx},${cy - ry * k} ${cx + rx},${cy} ` +
    `C ${cx + rx},${cy + ry * k} ${cx + rx * k},${cy + ry} ${cx},${cy + ry} ` +
    `C ${cx - rx * k},${cy + ry} ${cx - rx},${cy + ry * k} ${cx - rx},${cy} ` +
    `C ${cx - rx},${cy - ry * k} ${cx - tw * k},${cy - ry} ${cx},${cy - ry} Z`
  );
}

export const DISTRICT_CENTERS: Record<string, { lat: number; lng: number }> = {
  망원: { lat: 37.556, lng: 126.904 },
  연남: { lat: 37.567, lng: 126.922 },
  문래: { lat: 37.517, lng: 126.896 },
  서촌: { lat: 37.577, lng: 126.968 },
  익선: { lat: 37.574, lng: 126.999 },
  한남: { lat: 37.537, lng: 127.003 },
  성수: { lat: 37.544, lng: 127.059 },
  회기: { lat: 37.590, lng: 127.055 },
};

export function SeoulNeighborhoodMap({ availableDistricts, onSelect }: SeoulNeighborhoodMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const isActive = (id: string) => availableDistricts.includes(id);

  return (
    <div className="flex flex-col items-center px-4 pt-6 pb-10 w-full">
      {/* 헤더 */}
      <div className="text-center mb-5">
        <h1
          className="text-2xl md:text-3xl font-black mb-1.5"
          style={{ color: "var(--mongle-brown)", letterSpacing: "-0.03em" }}
        >
          어디로 갈까요?
        </h1>
        <p className="text-sm" style={{ color: "var(--mongle-brown)", opacity: 0.5 }}>
          색칠된 동네를 눌러 장소를 탐색해보세요
        </p>
      </div>

      {/* SVG 지도 */}
      <div className="w-full max-w-[540px] relative">
        <svg
          viewBox="50 10 450 420"
          className="w-full h-auto"
          style={{ filter: "drop-shadow(0 4px 20px rgba(92,61,46,0.09))" }}
        >
          {/* 서울 윤곽 배경 */}
          <path
            d={SEOUL_PATH}
            fill="#F5EEE6"
            stroke="#C8A882"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* 한강 */}
          <path
            d={HAN_RIVER}
            fill="#C8E0EC"
            stroke="#A0C4D8"
            strokeWidth="0.6"
            opacity="0.75"
          />
          {/* 한강 레이블 */}
          <text
            x="160" y="299"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="7"
            fill="#7AAABB"
            fontStyle="italic"
            style={{ userSelect: "none", pointerEvents: "none", fontFamily: "SUIT, sans-serif" }}
          >
            한강
          </text>

          {/* 준비 중 동네 — 하위 레이어 */}
          {NEIGHBORHOODS.filter(n => !n.active).map(n => (
            <g key={n.id}>
              <path
                d={blobPath(n.cx, n.cy, n.rx, n.ry)}
                fill="#E2D9CC"
                stroke="#C2B49A"
                strokeWidth="0.8"
              />
              <text
                x={n.cx} y={n.cy + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="7"
                fill="#9A8870"
                style={{ userSelect: "none", pointerEvents: "none", fontFamily: "SUIT, sans-serif" }}
              >
                {n.name}
              </text>
            </g>
          ))}

          {/* 활성 동네 — 상위 레이어 */}
          {NEIGHBORHOODS.filter(n => n.active).map(n => {
            const active   = isActive(n.id);
            const isHover  = hovered === n.id;
            return (
              <g
                key={n.id}
                onClick={() => active && onSelect(n.id)}
                onMouseEnter={() => active && setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: active ? "pointer" : "default" }}
              >
                <path
                  d={blobPath(n.cx, n.cy, n.rx, n.ry)}
                  fill={
                    !active ? "#DDD3C2" :
                    isHover  ? "#FF8C69" :
                               "#FFCDB8"
                  }
                  stroke={active ? "#C8703C" : "#B8A488"}
                  strokeWidth={isHover ? "2" : "1.4"}
                  style={{
                    transition: "fill 0.15s, stroke-width 0.12s",
                    filter: isHover
                      ? "drop-shadow(0 2px 8px rgba(255,140,105,0.50))"
                      : "none",
                  }}
                />
                <text
                  x={n.cx} y={n.cy + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={active ? "9.5" : "8"}
                  fontWeight={active ? "700" : "400"}
                  fill={active ? (isHover ? "white" : "#5C3D2E") : "#9A8070"}
                  style={{ userSelect: "none", pointerEvents: "none", fontFamily: "SUIT, sans-serif" }}
                >
                  {n.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* 호버 툴팁 */}
        {hovered && (
          <div
            className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-semibold pointer-events-none whitespace-nowrap"
            style={{
              background: "var(--mongle-peach)",
              color: "white",
              boxShadow: "0 4px 12px rgba(255,140,105,0.4)",
            }}
          >
            {hovered} 장소 보기 →
          </div>
        )}
      </div>

      {/* 범례 */}
      <div
        className="flex items-center gap-4 mt-3 text-xs"
        style={{ color: "var(--mongle-brown)", opacity: 0.5 }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: "#FFCDB8", border: "1px solid #C8703C" }}
          />
          <span>장소 있음</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: "#E2D9CC", border: "1px solid #C2B49A" }}
          />
          <span>준비 중</span>
        </div>
      </div>
    </div>
  );
}
