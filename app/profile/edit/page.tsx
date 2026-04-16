/**
 * /profile/edit 프로필 편집 페이지
 * - 닉네임 + 한줄 소개 편집
 * - Server Action으로 저장 후 /profile로 redirect
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "@/app/actions/profile";
import { redirect } from "next/navigation";

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio")
    .eq("id", user.id)
    .single();

  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "";

  return (
    <main className="min-h-screen pt-12 md:pt-16" style={{ background: "var(--mongle-cream)" }}>
      <div className="mx-auto max-w-lg px-6">

        {/* 헤더 */}
        <div className="flex items-center justify-between py-4 border-b" style={{ borderColor: "rgba(123,143,166,0.15)" }}>
          <Link
            href="/profile"
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--mongle-brown)", opacity: 0.6 }}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            뒤로
          </Link>
          <span className="text-sm font-semibold" style={{ color: "var(--mongle-brown)" }}>
            프로필 편집
          </span>
          {/* form submit은 버튼으로 — 헤더 우측 저장 버튼 */}
          <button
            form="profile-edit-form"
            type="submit"
            className="text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ color: "var(--mongle-peach)" }}
          >
            저장
          </button>
        </div>

        {/* 이니셜 아바타 (편집 불가 — 표시용) */}
        <div className="flex flex-col items-center py-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold"
            style={{
              background: "var(--mongle-warm)",
              color: "var(--mongle-peach)",
              boxShadow: "0 0 0 2px var(--mongle-peach)",
            }}
            aria-hidden="true"
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* 편집 폼 */}
        <form id="profile-edit-form" action={updateProfile} className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="display_name"
              className="block text-xs font-semibold mb-2"
              style={{ color: "var(--mongle-brown)", opacity: 0.55 }}
            >
              닉네임
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              defaultValue={displayName}
              maxLength={20}
              placeholder="닉네임을 입력하세요"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[#7B8FA6]/40"
              style={{
                background: "var(--mongle-warm)",
                border: "1.5px solid rgba(123,143,166,0.35)",
                color: "var(--mongle-brown)",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="bio"
              className="block text-xs font-semibold mb-2"
              style={{ color: "var(--mongle-brown)", opacity: 0.55 }}
            >
              한줄 소개 <span style={{ opacity: 0.5 }}>(최대 40자)</span>
            </label>
            <input
              id="bio"
              name="bio"
              type="text"
              defaultValue={profile?.bio ?? ""}
              maxLength={40}
              placeholder="나를 한 문장으로 표현해보세요 ✨"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[#7B8FA6]/40"
              style={{
                background: "var(--mongle-warm)",
                border: "1.5px solid rgba(123,143,166,0.35)",
                color: "var(--mongle-brown)",
              }}
            />
          </div>

          {/* 모바일 하단 저장 버튼 (헤더 버튼과 동일 form 연결) */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-full text-sm font-semibold text-white mt-2 transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ background: "var(--mongle-peach)" }}
          >
            저장하기
          </button>
        </form>

      </div>
    </main>
  );
}
