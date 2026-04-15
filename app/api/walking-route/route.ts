import { NextRequest, NextResponse } from "next/server";

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

interface Waypoint {
  lat: number;
  lng: number;
}

// 네이버 도보 경로 API는 미공개 → Haversine 거리 기반 시간 추정 (4km/h)
export async function POST(req: NextRequest) {
  const { waypoints }: { waypoints: Waypoint[] } = await req.json();

  if (!waypoints || waypoints.length < 2) {
    return NextResponse.json({ paths: [] });
  }

  const paths = waypoints.map((w) => [w.lng, w.lat] as [number, number]);
  const durations = waypoints.slice(0, -1).map((w, i) =>
    Math.max(1, Math.round(haversineMeters(w, waypoints[i + 1]) / (4000 / 60)))
  );

  return NextResponse.json({ paths, durations, isFallback: true });
}
