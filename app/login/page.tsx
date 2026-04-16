"use client";

import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "var(--mongle-cream)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-6"
        style={{ background: "white", boxShadow: "0 4px 32px rgba(54,69,84,0.10)" }}
      >
        {/* 로고 */}
        <div className="flex flex-col items-center gap-2">
          <Image
            src="/logo.png"
            alt="몽글 로고"
            width={48}
            height={60}
            className="object-contain"
          />
          <span
            className="text-2xl font-jua tracking-wide"
            style={{ color: "var(--mongle-brown)" }}
          >
            몽글
          </span>
          <p
            className="text-sm text-center"
            style={{ color: "var(--mongle-brown)", opacity: 0.55 }}
          >
            감성 장소를 저장하고 나만의 코스를 만들어보세요
          </p>
        </div>

        <div className="w-full h-px" style={{ background: "var(--mongle-peach-light)" }} />

        {/* Google 로그인 버튼 */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 hover:shadow-md active:scale-[0.98]"
          style={{
            background: "white",
            border: "1.5px solid var(--mongle-peach-light)",
            color: "var(--mongle-brown)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
          </svg>
          Google로 계속하기
        </button>

        <p
          className="text-xs text-center"
          style={{ color: "var(--mongle-brown)", opacity: 0.4 }}
        >
          로그인 시 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다
        </p>
      </div>
    </main>
  );
}
