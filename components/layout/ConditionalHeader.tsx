"use client";

import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Header } from "./Header";

export function ConditionalHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  // 클라이언트에서만 뷰포트 너비 판단 (SSR은 항상 헤더 표시 → 깜빡임 없음)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // 홈이 아닌 페이지 + 모바일 → 헤더 완전 제거
  if (!isHome && isMobile) return null;

  // 홈이 아닌 페이지 + 데스크탑 → 헤더 표시
  if (!isHome) {
    return (
      <Suspense>
        <Header />
      </Suspense>
    );
  }

  // 홈 → 항상 헤더 표시
  return (
    <Suspense>
      <Header />
    </Suspense>
  );
}
