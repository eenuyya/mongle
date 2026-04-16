/**
 * MongleLoader — 몽글 로고 바운스 로딩 인디케이터
 * squash & stretch 물리 바운스 + 착지 그림자
 */
export function MongleLoader({ fullPage = true, text = "모아오는 중…" }: { fullPage?: boolean; text?: string }) {
  const content = (
    <div className="flex flex-col items-center" style={{ gap: 0 }}>
      {/* 로고 바운스 */}
      <div
        className="animate-logo-bounce"
        style={{
          width: 68,
          height: 68,
          maskImage: "url('/logo.png')",
          WebkitMaskImage: "url('/logo.png')",
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
          background: "linear-gradient(160deg, #7B8FA6 0%, #506070 60%, #364554 100%)",
          marginBottom: 6,
        }}
      />
      {/* 착지 그림자 */}
      <div
        className="animate-shadow-squash"
        style={{
          width: 40,
          height: 6,
          borderRadius: "50%",
          background: "#7B8FA6",
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
