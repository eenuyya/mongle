"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    naver: {
      maps: {
        Map: new (el: HTMLElement, opts: object) => NaverMapInst;
        LatLng: new (lat: number, lng: number) => NaverLatLng;
        Marker: new (opts: object) => NaverMarker;
        Polygon: new (opts: object) => NaverPolygon;
        Size: new (w: number, h: number) => object;
        Point: new (x: number, y: number) => object;
        MapTypeId: { NORMAL: string };
        Event: { addListener: (t: object, type: string, fn: () => void) => object };
      };
    };
  }
}

interface NaverLatLng { lat: () => number; lng: () => number }
interface NaverBounds { getSW: () => NaverLatLng; getNE: () => NaverLatLng }
interface NaverMapInst {
  getBounds: () => NaverBounds;
  getZoom: () => number;
  setCenter: (l: NaverLatLng) => void;
  setZoom: (z: number, effect?: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOptions: (opts: Record<string, any>) => void;
}
interface NaverMarker { setMap: (m: NaverMapInst | null) => void }
interface NaverPolygon {
  setMap: (m: NaverMapInst | null) => void;
  setOptions: (opts: object) => void;
}

export interface MapPlace {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  category: string | null;
}

interface PlacesMapViewProps {
  places: MapPlace[];
  selectedPlaceId?: string | null;
  onPlaceClick?: (id: string) => void;
  /* 동네 폴리곤 오버레이 */
  showNeighborhoods?: boolean;
  availableDistricts?: string[];
  onNeighborhoodClick?: (id: string) => void;
  selectedDistrict?: string | null;   // 변경 시 자동 pan/zoom
  /* 지도 스타일 */
  mapStyleId?: string;
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
  /** 바텀시트 높이(px) — 장소 pan 시 가시 영역 상단에 위치하도록 오프셋 계산에 사용 */
  bottomPadding?: number;
}


/* ── 동네 경계 폴리곤 (실제 행정경계 GeoJSON 기반) ──────────────────── */
const NEIGHBORHOOD_DATA: {
  id: string;
  name: string;
  center: [number, number];
  paths: [number, number][][]; // 복수 폴리곤 지원 (문래/서촌/성수)
}[] = [
  {
    id: "망원", name: "망원",
    center: [37.5560, 126.9042],
    paths: [[
      [37.557388, 126.908842], [37.554188, 126.911701], [37.551725, 126.904155],
      [37.549048, 126.895750], [37.549398, 126.894703], [37.552296, 126.888139],
      [37.555824, 126.891796], [37.559429, 126.894080], [37.559431, 126.895441],
      [37.559816, 126.895741], [37.562065, 126.901250], [37.562833, 126.903916],
    ]],
  },
  {
    id: "연남", name: "연남",
    center: [37.5628, 126.9218],
    paths: [[
      [37.557530, 126.918799], [37.558973, 126.917495], [37.559456, 126.917907],
      [37.560915, 126.918171], [37.562549, 126.917493], [37.565031, 126.916900],
      [37.567809, 126.916804], [37.567113, 126.918459], [37.565676, 126.924753],
      [37.565107, 126.926035], [37.563334, 126.928302], [37.561793, 126.927207],
      [37.560905, 126.925870], [37.560381, 126.925547], [37.560970, 126.924203],
      [37.560591, 126.923291],
    ]],
  },
  {
    id: "문래", name: "문래",
    center: [37.5155, 126.8958],
    paths: [[
      [37.513951, 126.887345], [37.513021, 126.887861], [37.512353, 126.888374],
      [37.508544, 126.893028], [37.509105, 126.892350], [37.510323, 126.891713],
      [37.510383, 126.891067], [37.511725, 126.889830], [37.512243, 126.889723],
      [37.512353, 126.888374], [37.513021, 126.887861], [37.513951, 126.887345],
      [37.517226, 126.888826], [37.521050, 126.889748], [37.520753, 126.891653],
      [37.520197, 126.895312], [37.519448, 126.900018], [37.518811, 126.901140],
      [37.516135, 126.902117], [37.515204, 126.903090], [37.514623, 126.904081],
      [37.508544, 126.893028],
    ]],
  },
  {
    // 청운효자동 + 사직동 행정경계 합산 (Nominatim OSM 데이터 기준)
    id: "서촌", name: "서촌",
    center: [37.5820, 126.9665],
    paths: [[
      [37.5920, 126.9700],  // 북 — 창의문로
      [37.5882, 126.9760],  // 북동 — 자하문로·효자로 합류
      [37.5820, 126.9768],  // 동 — 효자로 중단
      [37.5762, 126.9762],  // 동 — 효자로 하단
      [37.5722, 126.9738],  // 남동 — 사직단 동측
      [37.5698, 126.9698],  // 남 — 사직로
      [37.5700, 126.9645],  // 남서
      [37.5732, 126.9618],  // 서 — 인왕산 기슭 도로
      [37.5808, 126.9592],  // 서
      [37.5868, 126.9618],  // 북서 — 인왕산 기슭 북단
    ]],
  },
  {
    id: "익선", name: "익선",
    center: [37.5742, 126.9898],
    paths: [[
      [37.573360, 126.991034], [37.572900, 126.989907], [37.574498, 126.988485],
      [37.575387, 126.988408], [37.575603, 126.990337], [37.574204, 126.990771],
    ]],
  },
  {
    id: "한남", name: "한남",
    center: [37.5380, 127.0058],
    paths: [[
      [37.544142, 127.009006], [37.542740, 127.009051], [37.542005, 127.008775],
      [37.541279, 127.009226], [37.540038, 127.009427], [37.539393, 127.009963],
      [37.539013, 127.011501], [37.539347, 127.012630], [37.538889, 127.013233],
      [37.538801, 127.014802], [37.538309, 127.015025], [37.537656, 127.017546],
      [37.533995, 127.017456], [37.532135, 127.015037], [37.529684, 127.012473],
      [37.525600, 127.008596], [37.524662, 127.007674], [37.526362, 127.004815],
      [37.527236, 127.004222], [37.528164, 127.002821], [37.529358, 127.003842],
      [37.530313, 127.003371], [37.531688, 127.000856], [37.532602, 126.997836],
      [37.533384, 126.997067], [37.535240, 126.997031], [37.536503, 126.996168],
      [37.537977, 126.994648], [37.539797, 126.996201], [37.540865, 126.997618],
      [37.542213, 126.997903], [37.543969, 126.996733], [37.545059, 126.996737],
      [37.546667, 126.995838], [37.547236, 126.995236], [37.547452, 126.996372],
      [37.548525, 126.996765], [37.549699, 126.998342], [37.550064, 127.001693],
      [37.549645, 127.002869], [37.550215, 127.004338], [37.548688, 127.004706],
      [37.548196, 127.006145], [37.547353, 127.005348], [37.546177, 127.005036],
      [37.543865, 127.007282],
    ]],
  },
  {
    id: "성수", name: "성수",
    center: [37.5408, 127.0555],
    paths: [[
      [37.545913, 127.031162], [37.542423, 127.031502], [37.535845, 127.035823],
      [37.528671, 127.055145], [37.528327, 127.056237], [37.531937, 127.058229],
      [37.542148, 127.063991], [37.548333, 127.067481], [37.548101, 127.062648],
      [37.548419, 127.059735], [37.549251, 127.056664], [37.551840, 127.050570],
      [37.551112, 127.051730], [37.553171, 127.046914], [37.553692, 127.045926],
      [37.552815, 127.041635], [37.550540, 127.037691], [37.548281, 127.035758],
      [37.546515, 127.033132], [37.546255, 127.031544],
    ]],
  },
  {
    id: "회기", name: "회기",
    center: [37.5948, 127.0528],
    paths: [[
      [37.591542, 127.057125], [37.591321, 127.056688], [37.589931, 127.055954],
      [37.587715, 127.053389], [37.588606, 127.052104], [37.589249, 127.051059],
      [37.589360, 127.049896], [37.588603, 127.047578], [37.590178, 127.047757],
      [37.590775, 127.048181], [37.591313, 127.047273], [37.593154, 127.047841],
      [37.594390, 127.047402], [37.595890, 127.047711], [37.596156, 127.047324],
      [37.597269, 127.047974], [37.598138, 127.049077], [37.598747, 127.049148],
      [37.600456, 127.050393], [37.601111, 127.051304], [37.600151, 127.052103],
      [37.599276, 127.053360], [37.597947, 127.053449], [37.596633, 127.053862],
      [37.595611, 127.054781], [37.594279, 127.054468], [37.593544, 127.055696],
      [37.591904, 127.056248],
    ]],
  },
];

/* 동네 선택 시 Naver Map pan 중심 좌표 */
const DISTRICT_CENTERS: Record<string, [number, number]> = {
  망원: [37.5560, 126.9042],
  연남: [37.5628, 126.9218],
  문래: [37.5155, 126.8958],
  서촌: [37.5820, 126.9665],
  익선: [37.5742, 126.9898],
  한남: [37.5380, 127.0058],
  성수: [37.5408, 127.0555],
  회기: [37.5948, 127.0528],
};

export function PlacesMapView({
  places,
  selectedPlaceId,
  onPlaceClick,
  showNeighborhoods = false,
  availableDistricts = [],
  onNeighborhoodClick,
  selectedDistrict,
  mapStyleId,
  initialLat = 37.5560,
  initialLng = 126.9820,
  initialZoom = 13,
  bottomPadding = 0,
}: PlacesMapViewProps) {
  const mapRef          = useRef<HTMLDivElement>(null);
  const mapInst         = useRef<NaverMapInst | null>(null);
  const mapDestroyed    = useRef(false);
  const markersRef      = useRef<NaverMarker[]>([]);
  const neighborhoodRef = useRef<Array<NaverPolygon | NaverMarker>>([]);
  const [mapReady, setMapReady] = useState(false);
  // 드래그 중에도 최신값을 참조할 수 있도록 ref로 유지
  const bottomPaddingRef = useRef(bottomPadding);
  useEffect(() => { bottomPaddingRef.current = bottomPadding; }, [bottomPadding]);

  /* ── 지도 초기화 ── */
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
    if (!clientId || !mapRef.current) return;

    const initMap = () => {
      if (!mapRef.current || !window.naver?.maps) return;
      const nm = window.naver.maps;

      // NAVER Maps Position enum (TOP_LEFT=1, TOP_CENTER=2, TOP_RIGHT=3,
      // LEFT_CENTER=4, RIGHT_CENTER=6, BOTTOM_LEFT=7, BOTTOM_CENTER=8, BOTTOM_RIGHT=9)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Pos = (nm as any).Position ?? {};
      const TOP_LEFT  = Pos.TOP_LEFT  ?? 1;
      const TOP_RIGHT = Pos.TOP_RIGHT ?? 3;

      const opts: Record<string, unknown> = {
        center: new nm.LatLng(initialLat, initialLng),
        zoom:   initialZoom,
        // 로고/저작권 표시를 상단으로 이동해 BottomTabBar와 겹치지 않도록
        logoControl:           true,
        logoControlOptions:    { position: TOP_LEFT },
        mapDataControl:        true,
        mapDataControlOptions: { position: TOP_RIGHT },
        scaleControl:          false,
        zoomControl:           false,
      };

      if (mapStyleId) {
        opts.gl            = true;
        opts.customStyleId = mapStyleId;
      } else {
        opts.mapTypeId = nm.MapTypeId.NORMAL;
      }

      mapInst.current = new nm.Map(mapRef.current, opts) as NaverMapInst;

      if (mapStyleId) {
        // GL 지도는 스타일 로드 완료 후 오버레이 추가 가능
        nm.Event.addListener(mapInst.current as unknown as object, "init_stylemap", () => {
          setMapReady(true);
        });
        // 폴백: 2초 후에도 이벤트 안 오면 강제로 준비 상태로
        setTimeout(() => setMapReady(true), 2000);
      } else {
        setMapReady(true);
      }
    };

    // maps-gl.js를 먼저 로드 후 초기화 (커스텀 스타일 필수)
    const loadGlThenInit = () => {
      if (document.querySelector(`script[src*="maps-gl.js"]`)) {
        initMap(); return;
      }
      const gl  = document.createElement("script");
      gl.src    = "https://oapi.map.naver.com/openapi/v3/maps-gl.js";
      gl.async  = true;
      gl.onload = initMap;
      document.head.appendChild(gl);
    };

    const afterMapsJs = () => mapStyleId ? loadGlThenInit() : initMap();

    if (window.naver?.maps) { afterMapsJs(); return; }

    if (!document.querySelector(`script[src*="oapi.map.naver.com/openapi/v3/maps.js"]`)) {
      const s  = document.createElement("script");
      s.src    = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
      s.async  = true;
      s.onload = afterMapsJs;
      document.head.appendChild(s);
    } else {
      const check = setInterval(() => {
        if (window.naver?.maps) { clearInterval(check); afterMapsJs(); }
      }, 100);
    }
    return () => {
      mapDestroyed.current = true;
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
      neighborhoodRef.current.forEach(o => o.setMap(null));
      neighborhoodRef.current = [];
      if (mapRef.current) mapRef.current.innerHTML = "";
      mapInst.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── 동네 선택 시 pan/zoom ── */
  useEffect(() => {
    const map = mapInst.current;
    if (!map || !window.naver?.maps) return;

    if (selectedDistrict) {
      const c = DISTRICT_CENTERS[selectedDistrict];
      if (c) {
        map.setCenter(new window.naver.maps.LatLng(c[0], c[1]));
        map.setZoom(15, true);
      }
    } else {
      map.setCenter(new window.naver.maps.LatLng(initialLat, initialLng));
      map.setZoom(initialZoom, true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrict, mapReady]);

  /* ── 선택 장소 → 가시 영역(바텀시트 위) 중앙으로 pan ── */
  useEffect(() => {
    const map = mapInst.current;
    if (!map || !window.naver?.maps || !selectedPlaceId) return;
    const place = places.find(p => p.id === selectedPlaceId);
    if (!place?.lat || !place?.lng) return;

    const bottomPad = bottomPaddingRef.current;

    // padding을 바텀시트 높이로 설정하면 NAVER가 가시 영역 중앙에 자동 배치
    map.setOptions({ padding: { top: 0, right: 0, bottom: bottomPad, left: 0 } });
    map.setCenter(new window.naver.maps.LatLng(place.lat, place.lng));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlaceId, mapReady]);

  /* ── 동네 폴리곤 오버레이 ── */
  useEffect(() => {
    const map = mapInst.current;
    if (!map || !window.naver?.maps) return;
    const nm = window.naver.maps;

    /* 기존 오버레이 제거 */
    neighborhoodRef.current.forEach(o => o.setMap(null));
    neighborhoodRef.current = [];

    if (!showNeighborhoods) return;

    NEIGHBORHOOD_DATA.forEach(({ id, name, center, paths }) => {
      // DB 값이 "성수동", "연남동" 형태일 수 있으므로 유연하게 매칭
      const isAvailable = availableDistricts.length === 0
        ? true  // DB 데이터 없으면 일단 모두 활성화
        : availableDistricts.some(d => d === id || d.startsWith(id) || id.startsWith(d.replace(/[동로길]$/, "")));
      const fillColor   = isAvailable ? "#FFCDB8" : "#DDD5C5";
      const strokeColor = isAvailable ? "#C8703C" : "#B0A08A";

      /* 폴리곤 (복수 ring 지원) */
      const polygon = new nm.Polygon({
        map:           map as unknown as object,
        paths:         paths.map(ring => ring.map(([lat, lng]) => new nm.LatLng(lat, lng))),
        fillColor,
        fillOpacity:   isAvailable ? 0.72 : 0.45,
        strokeColor,
        strokeWeight:  isAvailable ? 2 : 1,
        strokeOpacity: isAvailable ? 0.9 : 0.5,
        clickable:     isAvailable,
      });

      if (isAvailable) {
        nm.Event.addListener(polygon as unknown as object, "mouseover", () => {
          polygon.setOptions({ fillColor: "#FF8C69", fillOpacity: 0.88 });
        });
        nm.Event.addListener(polygon as unknown as object, "mouseout", () => {
          polygon.setOptions({ fillColor, fillOpacity: 0.72 });
        });
        nm.Event.addListener(polygon as unknown as object, "click", () => {
          onNeighborhoodClick?.(id);
        });
      }

      neighborhoodRef.current.push(polygon);

      /* 라벨 — 지도 영역 위 텍스트만
       * XSS 방지: id/name을 인라인 onclick 문자열에 직접 삽입하지 않고
       * textContent 할당 + nm.Event.addListener로 클릭 처리 */
      const labelEl = document.createElement("div");
      labelEl.textContent = name; // textContent로 삽입하여 HTML 인젝션 차단
      Object.assign(labelEl.style, isAvailable ? {
        fontSize:      "13px",
        fontWeight:    "800",
        color:         "#5C3D2E",
        fontFamily:    "SUIT, 'Noto Sans KR', sans-serif",
        letterSpacing: "-0.3px",
        textShadow:    [
          "0 0 4px rgba(255,255,255,0.98)", "0 0 8px rgba(255,255,255,0.9)",
          "0 0 12px rgba(255,255,255,0.7)",
          "1px 1px 0 rgba(255,255,255,0.85)", "-1px -1px 0 rgba(255,255,255,0.85)",
          "1px -1px 0 rgba(255,255,255,0.85)", "-1px 1px 0 rgba(255,255,255,0.85)",
        ].join(", "),
        cursor:        "pointer",
        whiteSpace:    "nowrap",
        userSelect:    "none",
      } : {
        fontSize:      "12px",
        fontWeight:    "600",
        color:         "#A89080",
        fontFamily:    "SUIT, 'Noto Sans KR', sans-serif",
        letterSpacing: "-0.2px",
        textShadow:    [
          "0 0 3px rgba(255,255,255,0.9)", "0 0 6px rgba(255,255,255,0.75)",
          "1px 1px 0 rgba(255,255,255,0.7)", "-1px -1px 0 rgba(255,255,255,0.7)",
        ].join(", "),
        pointerEvents: "none",
        whiteSpace:    "nowrap",
        userSelect:    "none",
      });

      const labelMarker = new nm.Marker({
        position: new nm.LatLng(center[0], center[1]),
        map:      map as unknown as object,
        icon: {
          content: labelEl,
          size:    new nm.Size(60, 20),
          anchor:  new nm.Point(30, 10),
        },
      });

      // 클릭 이벤트는 Naver Maps Event API로 처리 (인라인 onclick 미사용)
      if (isAvailable) {
        nm.Event.addListener(labelMarker as unknown as object, "click", () => {
          onNeighborhoodClick?.(id);
        });
      }

      neighborhoodRef.current.push(labelMarker);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNeighborhoods, availableDistricts, onNeighborhoodClick, mapReady]);

  /* ── 장소 마커 ── */
  useEffect(() => {
    const map = mapInst.current;
    if (!map || !window.naver?.maps) return;
    const nm = window.naver.maps;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // 마커 래퍼 흰 배경 제거 + keyframes 한 번만 주입
    if (!document.getElementById("mongle-marker-keyframes")) {
      const s = document.createElement("style");
      s.id = "mongle-marker-keyframes";
      s.textContent = `
        /* Naver Maps 마커 래퍼 배경/테두리 제거 */
        .se-marker-container,
        .se-custom-overlay { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
        @keyframes mongle-pin-bounce {
          0%   { transform: translateY(0)    scale(1);    }
          30%  { transform: translateY(-7px) scale(1.09); }
          55%  { transform: translateY(-2px) scale(1.03); }
          75%  { transform: translateY(-5px) scale(1.07); }
          100% { transform: translateY(0)    scale(1);    }
        }
        @keyframes mongle-pin-idle {
          0%, 100% { transform: translateY(0);    }
          50%       { transform: translateY(-3px); }
        }
      `;
      document.head.appendChild(s);
    }

    // 카테고리별 hue-rotate (이미지 원색 기준)
    const HUE: Record<string, string> = {
      cafe:       "hue-rotate(0deg)",
      restaurant: "hue-rotate(15deg) saturate(140%)",
      bookstore:  "hue-rotate(30deg) saturate(65%) brightness(88%)",
      gallery:    "hue-rotate(-20deg) saturate(130%)",
      park:       "hue-rotate(110deg) saturate(60%) brightness(105%)",
      popup:      "hue-rotate(50deg) saturate(135%)",
      shop:       "hue-rotate(-40deg) saturate(120%) brightness(112%)",
    };

    const labelTextShadow = [
      "1px 1px 0 #fff", "-1px 1px 0 #fff", "1px -1px 0 #fff", "-1px -1px 0 #fff",
      "0 0 6px rgba(255,255,255,0.9)", "0 0 12px rgba(255,255,255,0.7)",
    ].join(", ");

    places.forEach(place => {
      if (!place.lat || !place.lng) return;
      const isSelected = place.id === selectedPlaceId;

      // 일반: 원형 28px, 선택: 핀 44×53
      const imgSrc = isSelected ? "/marker-pin.png" : "/marker-circle.png";
      const imgW   = isSelected ? 44 : 28;
      const imgH   = isSelected ? 53 : 28;

      const hue = HUE[place.category ?? ""] ?? "hue-rotate(0deg)";

      // 일반: brown drop-shadow로 투명PNG 윤곽 명확화
      // 선택: 피치 글로우 3겹 drop-shadow
      const shadow = isSelected
        ? `${hue} drop-shadow(0 0 8px rgba(255,140,105,0.75)) drop-shadow(0 4px 10px rgba(255,140,105,0.5)) drop-shadow(0 2px 4px rgba(92,61,46,0.4))`
        : `${hue} drop-shadow(0 2px 5px rgba(92,61,46,0.5)) drop-shadow(0 1px 2px rgba(92,61,46,0.3))`;

      // XSS 방지: place.name을 HTML 문자열 템플릿에 직접 삽입하지 않고
      // DOM API로 요소를 생성하여 textContent에 할당합니다
      const markerEl  = document.createElement("div");
      Object.assign(markerEl.style, {
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        cursor:        "pointer",
        gap:           "2px",
      });

      const imgEl = document.createElement("img");
      imgEl.src    = imgSrc;
      imgEl.width  = imgW;
      imgEl.height = imgH;
      imgEl.style.cssText = [
        "display:block",
        "object-fit:contain",
        `filter:${shadow}`,
        ...(isSelected ? [
          "animation: mongle-pin-bounce 0.55s cubic-bezier(0.36,0.07,0.19,0.97) forwards, mongle-pin-idle 3s ease-in-out 0.55s infinite",
          "transform-origin: center bottom",
        ] : []),
      ].join(";");

      const labelSpan = document.createElement("span");
      labelSpan.textContent = place.name; // textContent로 할당하여 HTML 인젝션 차단
      Object.assign(labelSpan.style, {
        display:        "block",
        fontSize:       "11px",
        fontWeight:     "700",
        color:          "#3D2010",
        fontFamily:     "SUIT,'Noto Sans KR',sans-serif",
        letterSpacing:  "-0.2px",
        wordBreak:      "keep-all",
        overflowWrap:   "break-word",
        whiteSpace:     "normal",
        textAlign:      "center",
        maxWidth:       "72px",
        lineHeight:     "1.3",
        textShadow:     labelTextShadow,
      });

      markerEl.appendChild(imgEl);
      markerEl.appendChild(labelSpan);

      const marker = new nm.Marker({
        position: new nm.LatLng(place.lat, place.lng),
        map:      map as unknown as object,
        title:    place.name,
        zIndex:   isSelected ? 100 : 1,
        icon: {
          content: markerEl,
          // anchor Y: 원형=중심, 핀=팁(이미지 하단)
          size:   new nm.Size(imgW, imgH + 32),
          anchor: new nm.Point(Math.round(imgW / 2), imgH),
        },
      });

      nm.Event.addListener(marker as unknown as object, "click", () => {
        onPlaceClick?.(place.id);
      });

      // Naver Maps 마커 wrapper 흰 배경 제거
      requestAnimationFrame(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const el = (marker as any).getElement?.() as HTMLElement | undefined;
        if (el) {
          [el, el.parentElement, el.parentElement?.parentElement].forEach(node => {
            if (node) {
              node.style.background = "transparent";
              node.style.backgroundColor = "transparent";
              node.style.border = "none";
              node.style.boxShadow = "none";
              node.style.padding = "0";
            }
          });
        }
      });

      markersRef.current.push(marker);
    });
  }, [places, selectedPlaceId, onPlaceClick, mapReady]);

  return <div ref={mapRef} className="w-full h-full" aria-label="장소 지도" />;
}
