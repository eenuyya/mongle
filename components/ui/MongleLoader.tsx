/**
 * MongleLoader — 몽글 로고 그라데이션 로딩 인디케이터
 * CSS mask로 로고 실루엣 안에 그라데이션 애니메이션 적용
 */
export function MongleLoader({ fullPage = true }: { fullPage?: boolean }) {
  const content = (
    <div className="flex flex-col items-center gap-5">
      {/* 로고 실루엣 안에서 그라데이션이 흐름 */}
      <div
        style={{
          width: 72,
          height: 72,
          maskImage: "url('/logo.png')",
          WebkitMaskImage: "url('/logo.png')",
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
          background: "linear-gradient(90deg, #E0613A 0%, #FF8C69 30%, #FFE0A0 50%, #FF8C69 70%, #E0613A 100%)",
          backgroundSize: "250% 100%",
          animation: "shimmerSweep 1.6s linear infinite, logoPulse 2s ease-in-out infinite",
        }}
      />

      {/* 로딩 텍스트 */}
      <p
        className="text-sm"
        style={{
          color: "var(--mongle-brown)",
          opacity: 0.4,
          animation: "pulse 2s ease-in-out infinite",
        }}
      >
        모아오는 중…
      </p>
    </div>
  );

  if (!fullPage) return content;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "var(--mongle-cream)" }}
    >
      {content}
    </div>
  );
}
