-- 몽글 초기 DB 마이그레이션
-- PostGIS 확장 활성화
CREATE EXTENSION IF NOT EXISTS postgis;

-- ── places (장소) ────────────────────────────────────────────────────────────
CREATE TABLE places (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  category        text NOT NULL,
  -- 'cafe' | 'restaurant' | 'bookstore' | 'gallery' | 'park' | 'popup' | 'shop'
  subcategory     text,
  address         text NOT NULL,
  district        text,              -- 동네 (예: '성수동', '연남동')
  city            text DEFAULT '서울',
  lat             double precision NOT NULL,
  lng             double precision NOT NULL,
  location        geography(POINT, 4326),  -- PostGIS 위치 컬럼
  naver_place_id  text UNIQUE,       -- 네이버 플레이스 ID
  naver_url       text,
  phone           text,
  images          text[],            -- Supabase Storage URL 배열
  tags            text[],            -- ['#카공', '#혼자', '#콘센트']
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX places_location_idx ON places USING GIST(location);
CREATE INDEX places_district_idx ON places(district);
CREATE INDEX places_category_idx ON places(category);

-- ── place_scores (몽글 스코어) ───────────────────────────────────────────────
CREATE TABLE place_scores (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id        uuid REFERENCES places(id) ON DELETE CASCADE,
  vibe_score      numeric(3,1),    -- 1.0~5.0 (높을수록 감성적/힙함)
  noise_score     numeric(3,1),    -- 1.0~5.0 (낮을수록 조용)
  crowd_score     numeric(3,1),    -- 1.0~5.0 (낮을수록 한산)
  stay_score      numeric(3,1),    -- 1.0~5.0 (높을수록 체류 편함)
  alone_score     numeric(3,1),    -- 1.0~5.0 (높을수록 혼자 편함)
  together_score  numeric(3,1),    -- 1.0~5.0 (높을수록 함께 편함)
  review_count    int DEFAULT 0,
  confidence      text DEFAULT 'low',
  -- 'low' (<10건) | 'medium' (10~50건) | 'high' (50건+)
  analyzed_at     timestamptz DEFAULT now(),
  UNIQUE(place_id)
);

-- ── place_score_keywords (스코어 근거 키워드) ─────────────────────────────────
CREATE TABLE place_score_keywords (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id    uuid REFERENCES places(id) ON DELETE CASCADE,
  score_axis  text NOT NULL,
  -- 'vibe' | 'noise' | 'crowd' | 'stay' | 'alone' | 'together'
  direction   text NOT NULL,       -- 'positive' | 'negative'
  keyword     text NOT NULL,
  frequency   int DEFAULT 1
);

-- ── place_hours (영업시간 + 추천 방문 시간대) ──────────────────────────────────
CREATE TABLE place_hours (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id          uuid REFERENCES places(id) ON DELETE CASCADE,
  day_of_week       int2 NOT NULL,   -- 0=일 ~ 6=토
  open_time         time,
  close_time        time,
  best_visit_start  time,
  best_visit_end    time,
  is_closed         boolean DEFAULT false
);

-- ── courses (코스) ───────────────────────────────────────────────────────────
CREATE TABLE courses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  description     text,
  theme_tag       text,
  -- '#혼놀코스' | '#데이트코스' | '#팝업탐방' | '#전시탐방' | '#소품샵투어'
  district        text,
  duration_min    int,
  place_count     int,
  cover_image     text,
  is_editor_pick  boolean DEFAULT false,
  editor_month    text,             -- 'YYYY-MM'
  expires_at      timestamptz,
  has_popup       boolean DEFAULT false,
  is_public       boolean DEFAULT true,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX courses_theme_tag_idx ON courses(theme_tag);
CREATE INDEX courses_editor_pick_idx ON courses(is_editor_pick, editor_month);

-- ── course_places (코스 ↔ 장소 연결) ─────────────────────────────────────────
CREATE TABLE course_places (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id           uuid REFERENCES courses(id) ON DELETE CASCADE,
  place_id            uuid REFERENCES places(id) ON DELETE CASCADE,
  order_index         int2 NOT NULL,
  visit_duration_min  int2,
  note                text,
  UNIQUE(course_id, order_index)
);

-- ── saved_places (사용자 저장 장소) ──────────────────────────────────────────
CREATE TABLE saved_places (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id    uuid REFERENCES places(id) ON DELETE CASCADE,
  note        text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, place_id)
);

ALTER TABLE saved_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can manage own saved places"
  ON saved_places FOR ALL USING (auth.uid() = user_id);

-- ── saved_courses (사용자 저장 코스) ─────────────────────────────────────────
CREATE TABLE saved_courses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id   uuid REFERENCES courses(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE saved_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can manage own saved courses"
  ON saved_courses FOR ALL USING (auth.uid() = user_id);

-- ── updated_at 자동 갱신 트리거 ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER places_updated_at
  BEFORE UPDATE ON places
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Supabase Storage 버킷 ─────────────────────────────────────────────────────
-- Supabase 콘솔에서 직접 생성 필요:
-- 버킷명: place-images (public)
