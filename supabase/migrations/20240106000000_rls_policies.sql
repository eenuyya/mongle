-- courses, places, course_places 공개 읽기 정책
-- 마이그레이션이 실제 DB에 적용되지 않아 누락된 RLS 정책 추가

CREATE POLICY "courses are publicly readable"
  ON courses FOR SELECT USING (true);

CREATE POLICY "places are publicly readable"
  ON places FOR SELECT USING (true);

-- course_places: courses/places가 readable이면 함께 읽을 수 있어야 함
ALTER TABLE course_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_places are publicly readable"
  ON course_places FOR SELECT USING (true);
