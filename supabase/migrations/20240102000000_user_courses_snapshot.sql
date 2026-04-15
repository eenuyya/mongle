-- 사용자 코스 스냅샷 마이그레이션
-- saved_courses의 단순 참조 방식 → 복사본(snapshot) 방식으로 변경
--
-- 변경 이유:
-- 원본 course_id만 참조하면 에디터가 코스를 수정/삭제할 때 사용자 데이터가 깨짐.
-- 저장 시점에 코스 데이터를 복사해두면 독립적으로 수정 가능 (Phase 4~5 대비).

-- ── 기존 saved_courses 제거 ────────────────────────────────────────────────
DROP TABLE IF EXISTS saved_courses;

-- ── user_courses (사용자 소유 코스 — 복사본) ──────────────────────────────
-- 에디터 코스를 저장할 때 이 테이블에 스냅샷을 생성.
-- 직접 만든 코스(Phase 5+)도 동일 테이블 사용.
CREATE TABLE user_courses (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  origin_course_id  uuid REFERENCES courses(id) ON DELETE SET NULL,
  -- 원본 코스 참조 (에디터가 삭제해도 사용자 데이터는 보존됨)
  -- null이면 사용자가 직접 만든 코스
  title             text NOT NULL,
  description       text,
  theme_tag         text,
  district          text,
  duration_min      int,
  cover_image       text,
  is_public         boolean DEFAULT false,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX user_courses_user_id_idx ON user_courses(user_id);
CREATE INDEX user_courses_origin_idx ON user_courses(origin_course_id);

ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can manage own courses"
  ON user_courses FOR ALL USING (auth.uid() = user_id);

-- ── user_course_places (사용자 코스의 장소 목록 — 수정 가능) ───────────────
-- 저장 시점에 원본 course_places를 복사.
-- Phase 4: 장소 삭제 + 순서 변경 / Phase 5: 장소 추가
CREATE TABLE user_course_places (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_course_id      uuid REFERENCES user_courses(id) ON DELETE CASCADE,
  place_id            uuid REFERENCES places(id) ON DELETE CASCADE,
  order_index         int2 NOT NULL,
  visit_duration_min  int2,
  note                text,
  UNIQUE(user_course_id, order_index)
);

ALTER TABLE user_course_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can manage own course places"
  ON user_course_places FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_courses
      WHERE user_courses.id = user_course_places.user_course_id
        AND user_courses.user_id = auth.uid()
    )
  );

-- ── updated_at 자동 갱신 트리거 ───────────────────────────────────────────
CREATE TRIGGER user_courses_updated_at
  BEFORE UPDATE ON user_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 코스 저장 시 스냅샷 생성 함수 ──────────────────────────────────────────
-- 사용법: SELECT save_course_snapshot(auth.uid(), '원본-course-id');
-- 반환값: 생성된 user_course_id
CREATE OR REPLACE FUNCTION save_course_snapshot(
  p_user_id   uuid,
  p_course_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_course_id uuid;
BEGIN
  -- 이미 저장한 코스면 기존 id 반환
  SELECT id INTO v_user_course_id
  FROM user_courses
  WHERE user_id = p_user_id AND origin_course_id = p_course_id;

  IF v_user_course_id IS NOT NULL THEN
    RETURN v_user_course_id;
  END IF;

  -- 코스 메타데이터 복사
  INSERT INTO user_courses (
    user_id, origin_course_id, title, description,
    theme_tag, district, duration_min, cover_image
  )
  SELECT
    p_user_id, id, title, description,
    theme_tag, district, duration_min, cover_image
  FROM courses
  WHERE id = p_course_id
  RETURNING id INTO v_user_course_id;

  -- 장소 목록 복사
  INSERT INTO user_course_places (
    user_course_id, place_id, order_index, visit_duration_min, note
  )
  SELECT
    v_user_course_id, place_id, order_index, visit_duration_min, note
  FROM course_places
  WHERE course_id = p_course_id;

  RETURN v_user_course_id;
END;
$$;
