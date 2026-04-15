/**
 * 테마 목록 단일 소스
 * ThemeSection, CourseFilterBar 등 모든 컴포넌트가 이 파일을 참조
 */

export interface ThemeMeta {
  /** DB / URL 파라미터에 사용되는 식별자 */
  id: string;
  /** 필터 바 칩에 표시되는 짧은 레이블 */
  filterLabel: string;
  /** 카드 등에 표시되는 해시태그 레이블 */
  hashLabel: string;
}

export const THEMES: ThemeMeta[] = [
  { id: "혼놀코스",  filterLabel: "혼놀",   hashLabel: "#혼놀코스" },
  { id: "데이트코스", filterLabel: "데이트",  hashLabel: "#데이트코스" },
  { id: "브런치코스", filterLabel: "브런치",  hashLabel: "#브런치코스" },
  { id: "카공투어",  filterLabel: "카공",   hashLabel: "#카공투어" },
  { id: "전시탐방",  filterLabel: "전시",   hashLabel: "#전시탐방" },
  { id: "소품샵투어", filterLabel: "소품샵",  hashLabel: "#소품샵투어" },
  { id: "팝업탐방",  filterLabel: "팝업",   hashLabel: "#팝업탐방" },
];

export const THEME_IDS = THEMES.map((t) => t.id);
