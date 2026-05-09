/**
 * 몽글 루트 레이아웃
 * - 한국어 서비스이므로 lang="ko" 설정
 * - Geist 폰트를 CSS 변수로 주입
 * - globals.css를 통해 몽글 디자인 토큰 및 커스텀 애니메이션 로드
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { ConditionalHeader } from "@/components/layout/ConditionalHeader";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "몽글 — 감성 장소 큐레이션",
  description: "감성 장소와 코스를 큐레이션합니다. 느낌 좋은 하루를 계획하세요.",
  openGraph: {
    title: "몽글 — 감성 장소 큐레이션",
    description: "감성 장소와 코스를 큐레이션합니다. 느낌 좋은 하루를 계획하세요.",
    url: "https://mongle-mauve.vercel.app",
    siteName: "몽글",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "몽글 — 감성 장소 큐레이션",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "몽글 — 감성 장소 큐레이션",
    description: "감성 장소와 코스를 큐레이션합니다. 느낌 좋은 하루를 계획하세요.",
    images: ["/opengraph-image"],
  },
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
        <link rel="icon" type="image/png" href="/favicon-96x96.png?v=20260509" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=20260509" />
        <link rel="shortcut icon" href="/favicon.ico?v=20260509" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=20260509" />
        <meta name="apple-mobile-web-app-title" content="mongle" />
        <link rel="manifest" href="/site.webmanifest?v=20260509" />
      </head>
      <body className="min-h-full flex flex-col md:pb-0" style={{ paddingBottom: "calc(var(--tab-clearance) + env(safe-area-inset-bottom, 0px))" }}>
        <ConditionalHeader />
        {children}
        <Suspense>
          <BottomTabBar />
        </Suspense>
      </body>
    </html>
  );
}
