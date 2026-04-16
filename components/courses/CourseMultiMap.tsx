"use client";

import { useEffect, useRef } from "react";

export interface CourseMapPlace {
  name: string;
  lat: number;
  lng: number;
  order: number;
}

interface CourseMultiMapProps {
  places: CourseMapPlace[];
  height?: number;
}

// window.naver 타입은 NaverMap.tsx 의 global 선언을 사용하므로
// 여기서는 Polyline 접근을 위한 로컬 타입만 정의
interface NaverMapInstance {
  setCenter: (latlng: object) => void;
}

export function CourseMultiMap({ places, height = 280 }: CourseMultiMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (places.length === 0) return;
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
    if (!clientId) return;

    const initMap = async () => {
      if (!mapRef.current || !window.naver?.maps) return;

      const centerLat = places.reduce((s, p) => s + p.lat, 0) / places.length;
      const centerLng = places.reduce((s, p) => s + p.lng, 0) / places.length;

      const map = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(centerLat, centerLng),
        zoom: places.length === 1 ? 16 : 15,
        mapTypeId: window.naver.maps.MapTypeId.NORMAL,
        logoControl: false,
        mapDataControl: false,
        scaleControl: false,
      });

      // 번호 마커
      places.forEach((place) => {
        new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(place.lat, place.lng),
          map,
          title: place.name,
          icon: {
            content: `
              <div style="
                width:30px;height:30px;border-radius:50%;
                background:#7B8FA6;border:2.5px solid white;
                box-shadow:0 2px 8px rgba(123,143,166,0.45);
                display:flex;align-items:center;justify-content:center;
                font-size:13px;font-weight:700;color:white;
                font-family:'Gowun Dodum',sans-serif;
              ">${place.order}</div>`,
            size: new window.naver.maps.Size(30, 30),
            anchor: new window.naver.maps.Point(15, 15),
          },
        });
      });

      if (places.length < 2) return;

      // 도보 경로 API 호출
      try {
        const res = await fetch("/api/walking-route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            waypoints: places.map((p) => ({ lat: p.lat, lng: p.lng })),
          }),
        });
        const { paths } = await res.json();

        if (paths && paths.length > 1) {
          // Naver path는 [lng, lat] 순서
          const polylinePath = paths.map(
            ([lng, lat]: [number, number]) =>
              new window.naver.maps.LatLng(lat, lng)
          );

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          new (window.naver.maps as any).Polyline({
            map,
            path: polylinePath,
            strokeColor: "#7B8FA6",
            strokeOpacity: 0.85,
            strokeWeight: 4,
            strokeStyle: "shortdash",
          });
        }
      } catch {
        // 네트워크 오류 시 무시
      }
    };

    if (window.naver?.maps) {
      initMap();
      return;
    }

    const existing = document.querySelector(
      `script[src*="oapi.map.naver.com"]`
    );
    if (existing) {
      existing.addEventListener("load", initMap);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;
    script.onload = initMap;
    document.head.appendChild(script);
  }, [places]);

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="w-full"
        style={{ height }}
        aria-label="코스 경로 지도"
      />
    </div>
  );
}
