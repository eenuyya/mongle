/**
 * /profile 프로필 페이지 (Server Component)
 * - 로그인: 프로필 헤더 + 활동 요약 + 계정 섹션
 * - 비로그인: 소프트 게스트 화면 (redirect 대신 로그인 유도)
 */

import Link from "next/link";
import { Pencil, Route, MapPin, ChevronRight, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/profile";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 비로그인 게스트 화면
  if (!user) {
    return (
      <main
        className="min-h-screen pt-12 md:pt-16 flex flex-col items-center justify-center px-4 gap-6"
        style={{ background: "var(--mongle-cream)" }}
      >
        {/* 아바타 플레이스홀더 */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
          style={{ background: "var(--mongle-warm)" }}
          aria-hidden="true"
        >
          🌸
        </div>

        <div className="text-center">
          <p className="text-base font-semibold mb-1" style={{ color: "var(--mongle-brown)" }}>
            나만의 감성 지도를 만들어보세요
          </p>
          <p className="text-sm" style={{ color: "var(--mongle-brown)", opacity: 0.55 }}>
            장소를 저장하고 코스를 기록해요
          </p>
        </div>

        <Link
          href="/login"
          className="px-8 py-3 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--mongle-peach)" }}
        >
          로그인하기
        </Link>
      </main>
    );
  }

  // 프로필 + 저장 카운트 병렬 조회
  const [{ data: profile }, { count: courseCount }, { count: placeCount }] =
    await Promise.all([
      supabase.from("profiles").select("display_name, bio").eq("id", user.id).single(),
      supabase.from("saved_courses").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("saved_places").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    ]);

  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "몽글러";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <main className="min-h-screen pt-12 md:pt-16" style={{ background: "var(--mongle-cream)" }}>
      <div className="mx-auto max-w-lg">

        {/* ── 프로필 헤더 ── */}
        <section
          className="px-6 pt-8 pb-6 relative"
          style={{ background: "linear-gradient(160deg, #FFF0E6 0%, #FFF8F3 60%)" }}
          aria-label="프로필 정보"
        >
          {/* 편집 버튼 */}
          <Link
            href="/profile/edit"
            className="absolute top-6 right-6 flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--mongle-brown)", opacity: 0.45 }}
            aria-label="프로필 편집"
          >
            <Pencil size={13} />
            편집
          </Link>

          <div className="flex items-center gap-4 mb-5">
            {/* 이니셜 아바타 */}
            <div
              className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
              style={{
                background: "var(--mongle-warm)",
                color: "var(--mongle-peach)",
                boxShadow: "0 0 0 2px var(--mongle-peach)",
              }}
              aria-hidden="true"
            >
              {initial}
            </div>

            <div className="min-w-0">
              <p className="text-xl font-bold truncate" style={{ color: "var(--mongle-brown)" }}>
                {displayName}
              </p>
              <p className="text-xs truncate mt-0.5" style={{ color: "var(--mongle-brown)", opacity: 0.45 }}>
                {user.email}
              </p>
              {profile?.bio ? (
                <p className="text-sm mt-1.5 leading-snug" style={{ color: "var(--mongle-brown)", opacity: 0.65 }}>
                  {profile.bio}
                </p>
              ) : (
                <Link
                  href="/profile/edit"
                  className="text-xs mt-1.5 inline-block transition-opacity hover:opacity-70"
                  style={{ color: "var(--mongle-peach)" }}
                >
                  소개를 추가해보세요 ✨
                </Link>
              )}
            </div>
          </div>

          {/* 활동 통계 */}
          <div className="flex gap-8">
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-jua text-2xl" style={{ color: "var(--mongle-peach)" }}>
                {courseCount ?? 0}
              </span>
              <span className="text-xs" style={{ color: "var(--mongle-brown)", opacity: 0.55 }}>
                저장한 코스
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-jua text-2xl" style={{ color: "var(--mongle-peach)" }}>
                {placeCount ?? 0}
              </span>
              <span className="text-xs" style={{ color: "var(--mongle-brown)", opacity: 0.55 }}>
                저장한 장소
              </span>
            </div>
          </div>
        </section>

        {/* ── 구분 블록 ── */}
        <div className="h-2" style={{ background: "var(--mongle-warm)" }} aria-hidden="true" />

        {/* ── 내 저장 목록 ── */}
        <section className="px-6 py-5" aria-label="내 저장 목록">
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--mongle-brown)", opacity: 0.4 }}
          >
            내 저장 목록
          </p>

          <Link
            href="/saved"
            className="flex items-center justify-between py-4 transition-colors hover:bg-[rgba(255,248,243,0.6)] -mx-2 px-2 rounded-xl"
            style={{ borderBottom: "1px solid rgba(255,185,155,0.2)" }}
          >
            <div className="flex items-center gap-3">
              <Route size={16} style={{ color: "var(--mongle-peach)" }} aria-hidden="true" />
              <span className="text-sm font-medium" style={{ color: "var(--mongle-brown)" }}>
                저장한 코스
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: "var(--mongle-brown)", opacity: 0.45 }}>
                {courseCount ?? 0}개
              </span>
              <ChevronRight size={14} style={{ color: "var(--mongle-brown)", opacity: 0.3 }} aria-hidden="true" />
            </div>
          </Link>

          <Link
            href="/saved"
            className="flex items-center justify-between py-4 transition-colors hover:bg-[rgba(255,248,243,0.6)] -mx-2 px-2 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <MapPin size={16} style={{ color: "var(--mongle-peach)" }} aria-hidden="true" />
              <span className="text-sm font-medium" style={{ color: "var(--mongle-brown)" }}>
                저장한 장소
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: "var(--mongle-brown)", opacity: 0.45 }}>
                {placeCount ?? 0}곳
              </span>
              <ChevronRight size={14} style={{ color: "var(--mongle-brown)", opacity: 0.3 }} aria-hidden="true" />
            </div>
          </Link>
        </section>

        {/* ── 구분 블록 ── */}
        <div className="h-2" style={{ background: "var(--mongle-warm)" }} aria-hidden="true" />

        {/* ── 계정 ── */}
        <section className="px-6 py-5" aria-label="계정 설정">
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--mongle-brown)", opacity: 0.4 }}
          >
            계정
          </p>

          <a
            href="#"
            className="flex items-center justify-between py-3.5 -mx-2 px-2 rounded-xl transition-colors hover:bg-[rgba(255,248,243,0.6)]"
            style={{ borderBottom: "1px solid rgba(255,185,155,0.2)" }}
          >
            <span className="text-sm" style={{ color: "var(--mongle-brown)" }}>이용약관</span>
            <ChevronRight size={14} style={{ color: "var(--mongle-brown)", opacity: 0.3 }} />
          </a>
          <a
            href="#"
            className="flex items-center justify-between py-3.5 -mx-2 px-2 rounded-xl transition-colors hover:bg-[rgba(255,248,243,0.6)]"
            style={{ borderBottom: "1px solid rgba(255,185,155,0.2)" }}
          >
            <span className="text-sm" style={{ color: "var(--mongle-brown)" }}>개인정보처리방침</span>
            <ChevronRight size={14} style={{ color: "var(--mongle-brown)", opacity: 0.3 }} />
          </a>

          <form action={signOut} className="mt-2">
            <button
              type="submit"
              className="flex items-center gap-2 py-3.5 text-sm font-medium w-full -mx-2 px-2 rounded-xl transition-colors hover:bg-[rgba(255,248,243,0.6)]"
              style={{ color: "var(--mongle-peach)" }}
            >
              <LogOut size={14} aria-hidden="true" />
              로그아웃
            </button>
          </form>
        </section>

      </div>
    </main>
  );
}
