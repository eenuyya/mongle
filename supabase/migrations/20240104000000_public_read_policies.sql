-- places, courses 테이블 공개 읽기 정책 추가
-- Supabase 대시보드에서 테이블 생성 시 RLS가 자동 활성화되므로
-- SELECT 정책 없이는 데이터를 읽을 수 없음

-- places: 누구나 읽기 가능 (is_active 필터는 앱에서 처리)
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "places are publicly readable"
  ON places FOR SELECT USING (true);

-- courses: 누구나 읽기 가능 (is_public 필터는 앱에서 처리)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courses are publicly readable"
  ON courses FOR SELECT USING (true);
