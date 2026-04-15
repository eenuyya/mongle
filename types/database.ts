export type PlaceCategory =
  | "cafe"
  | "restaurant"
  | "bookstore"
  | "gallery"
  | "park"
  | "popup"
  | "shop";

export type ScoreAxis = "vibe" | "noise" | "crowd" | "stay" | "alone" | "together";

export type ScoreConfidence = "low" | "medium" | "high";

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  subcategory: string | null;
  address: string;
  district: string | null;
  city: string;
  lat: number;
  lng: number;
  naver_place_id: string | null;
  naver_url: string | null;
  phone: string | null;
  images: string[] | null;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaceScore {
  id: string;
  place_id: string;
  vibe_score: number | null;
  noise_score: number | null;
  crowd_score: number | null;
  stay_score: number | null;
  alone_score: number | null;
  together_score: number | null;
  review_count: number;
  confidence: ScoreConfidence;
  analyzed_at: string;
}

export interface PlaceScoreKeyword {
  id: string;
  place_id: string;
  score_axis: ScoreAxis;
  direction: "positive" | "negative";
  keyword: string;
  frequency: number;
}

export interface PlaceHour {
  id: string;
  place_id: string;
  day_of_week: number; // 0=일 ~ 6=토
  open_time: string | null;
  close_time: string | null;
  best_visit_start: string | null;
  best_visit_end: string | null;
  is_closed: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  theme_tag: string | null;
  district: string | null;
  duration_min: number | null;
  place_count: number | null;
  cover_image: string | null;
  is_editor_pick: boolean;
  editor_month: string | null;
  expires_at: string | null;
  has_popup: boolean;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoursePlace {
  id: string;
  course_id: string;
  place_id: string;
  order_index: number;
  visit_duration_min: number | null;
  note: string | null;
}

export interface SavedPlace {
  id: string;
  user_id: string;
  place_id: string;
  note: string | null;
  created_at: string;
}

/** 사용자 소유 코스 — 에디터 코스의 복사본 또는 직접 생성 */
export interface UserCourse {
  id: string;
  user_id: string;
  origin_course_id: string | null; // null이면 직접 만든 코스
  title: string;
  description: string | null;
  theme_tag: string | null;
  district: string | null;
  duration_min: number | null;
  cover_image: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/** 사용자 코스의 장소 목록 (수정 가능) */
export interface UserCoursePlace {
  id: string;
  user_course_id: string;
  place_id: string;
  order_index: number;
  visit_duration_min: number | null;
  note: string | null;
}

// 조인 타입
export type PlaceWithScore = Place & {
  place_scores: PlaceScore | null;
};

export type CourseWithPlaces = Course & {
  course_places: (CoursePlace & { places: Place })[];
};
