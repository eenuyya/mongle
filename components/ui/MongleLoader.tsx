/**
 * MongleLoader — 몽글 로고 바운스 로딩 인디케이터
 * squash & stretch 물리 바운스 + 착지 그림자
 */
export function MongleLoader({ fullPage = true, text = "잠깐만요…" }: { fullPage?: boolean; text?: string }) {
  const content = (
    <div className="flex flex-col items-center" style={{ gap: 0 }}>
      {/* 로고 바운스 */}
      <div
        className="animate-logo-bounce"
        style={{
          width: 52,
          height: 52,
          maskImage: "url('/logo.png')",
          WebkitMaskImage: "url('/logo.png')",
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
          background: "linear-gradient(160deg, #FF8FA3 0%, #FF6B8A 60%, #E0526B 100%)",
          marginBottom: 6,
        }}
      />
      {/* 착지 그림자 */}
      <div
        className="animate-shadow-squash"
        style={{
          width: 30,
          height: 5,
          borderRadius: "50%",
          background: "rgba(255,107,138,0.25)",
          marginBottom: 18,
        }}
      />
      {/* 텍스트 */}
      <p
        className="animate-text-bounce"
        style={{
          color: "var(--mongle-brown)",
          fontSize: 13,
          letterSpacing: "0.05em",
        }}
      >
        {text}
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
