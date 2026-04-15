/** 네이버 지도 SDK window.naver 전역 타입 선언 — 단일 소스 */

interface NaverLatLng {
  lat: () => number;
  lng: () => number;
}
interface NaverBounds {
  getSW: () => NaverLatLng;
  getNE: () => NaverLatLng;
}
interface NaverMapInstance {
  getBounds: () => NaverBounds;
  getZoom: () => number;
  setCenter: (l: NaverLatLng | object) => void;
  setZoom: (z: number, effect?: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOptions: (opts: Record<string, any>) => void;
}
interface NaverMarker {
  setMap: (m: NaverMapInstance | null) => void;
}
interface NaverPolygon {
  setMap: (m: NaverMapInstance | null) => void;
  setOptions: (opts: object) => void;
}

interface Window {
  naver: {
    maps: {
      Map: new (el: HTMLElement, opts: object) => NaverMapInstance;
      LatLng: new (lat: number, lng: number) => NaverLatLng;
      Marker: new (opts: object) => NaverMarker;
      Polyline: new (opts: object) => object;
      Polygon: new (opts: object) => NaverPolygon;
      Size: new (w: number, h: number) => object;
      Point: new (x: number, y: number) => object;
      MapTypeId: { NORMAL: string };
      Event: { addListener: (t: object, type: string, fn: () => void) => object };
    };
  };
}
