"use client";

import { useEffect, useRef } from "react";

// window.naver 타입은 types/naver.d.ts 전역 선언 사용

interface NaverMapProps {
  lat: number;
  lng: number;
  name: string;
}

export function NaverMap({ lat, lng, name }: NaverMapProps) {
  const mapRef     = useRef<HTMLDivElement>(null);
  const mapInstRef = useRef<NaverMapInstance | null>(null);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
    if (!clientId || !mapRef.current) return;

    const initMap = () => {
      if (!mapRef.current || !window.naver?.maps) return;

      const center = new window.naver.maps.LatLng(lat, lng);

      mapInstRef.current = new window.naver.maps.Map(mapRef.current, {
        center,
        zoom: 16,
        mapTypeId: window.naver.maps.MapTypeId.NORMAL,
      });

      new window.naver.maps.Marker({
        position: center,
        map: mapInstRef.current,
        title: name,
        icon: {
          content: '<img src="/marker-pin.png" style="width:44px;height:53px;object-fit:contain;filter:drop-shadow(0 2px 6px rgba(54,69,84,0.45));" />',
          size: new window.naver.maps.Size(44, 53),
          anchor: new window.naver.maps.Point(22, 53),
        },
      });
    };

    if (window.naver?.maps) {
      initMap();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;
    script.onload = initMap;
    document.head.appendChild(script);

    return () => {
      if (mapRef.current) mapRef.current.innerHTML = "";
      mapInstRef.current = null;
    };
  }, [lat, lng, name]);

  return (
    <div
      ref={mapRef}
      className="w-full rounded-2xl overflow-hidden"
      style={{ height: "260px" }}
      aria-label={`${name} 지도`}
    />
  );
}
