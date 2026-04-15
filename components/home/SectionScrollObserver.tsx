"use client";

/**
 * SectionScrollObserver 컴포넌트
 * - Server Component에서 hooks를 사용할 수 없으므로 Intersection Observer 초기화를 담당하는 경량 Client Component
 * - 지정한 sectionId를 가진 section 요소를 찾아 내부 .animate-on-scroll 요소들에 is-visible 클래스를 부여
 * - PlacesGridSection, MonthlyCoursesSection 등 async Server Component에서 공통으로 사용
 */

import { useEffect } from "react";

interface SectionScrollObserverProps {
  /** 관찰할 section 요소의 id */
  sectionId: string;
  /** Intersection Observer threshold (기본값 0.08) */
  threshold?: number;
}

export function SectionScrollObserver({
  sectionId,
  threshold = 0.08,
}: SectionScrollObserverProps) {
  useEffect(() => {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 섹션 내부의 모든 animate-on-scroll 요소에 is-visible 클래스 추가
            section.querySelectorAll(".animate-on-scroll").forEach((el) => {
              el.classList.add("is-visible");
            });
            // 한 번 트리거 후 관찰 중단
            observer.unobserve(section);
          }
        });
      },
      { threshold }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [sectionId, threshold]);

  // 렌더링 결과물 없음 — 순수 사이드 이펙트 컴포넌트
  return null;
}
