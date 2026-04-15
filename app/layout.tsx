/**
 * 몽글 루트 레이아웃
 * - 한국어 서비스이므로 lang="ko" 설정
 * - Geist 폰트를 CSS 변수로 주입
 * - globals.css를 통해 몽글 디자인 토큰 및 커스텀 애니메이션 로드
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "몽글 — 감성 장소 큐레이션",
  description:
    "감성 장소와 코스를 큐레이션합니다. 느낌 좋은 하루를 계획하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/sunn-us/SUIT/fonts/variable/woff2/SUIT-Variable.css"
        />
      </head>
      <body className="min-h-full flex flex-col pb-16 md:pb-0">
        <Suspense>
          <Header />
        </Suspense>
        {children}
        <Suspense>
          <BottomTabBar />
        </Suspense>
      </body>
    </html>
  );
}
