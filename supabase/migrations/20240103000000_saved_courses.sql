-- saved_courses 테이블 생성
-- init.sql에 정의되어 있지만 별도 마이그레이션으로 관리
CREATE TABLE IF NOT EXISTS saved_courses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id   uuid REFERENCES courses(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE saved_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own saved courses"
  ON saved_courses FOR ALL USING (auth.uid() = user_id);
