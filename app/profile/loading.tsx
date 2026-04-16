export default function ProfileLoading() {
  return (
    <main className="min-h-screen pt-12 md:pt-16" style={{ background: "var(--mongle-cream)" }}>
      <div className="mx-auto max-w-lg">
        {/* 프로필 헤더 스켈레톤 */}
        <div
          className="px-6 pt-8 pb-6"
          style={{ background: "linear-gradient(160deg, #F0F3F6 0%, #F4F6F8 60%)" }}
        >
          <div className="flex items-center gap-4 mb-5">
            <div
              className="w-[72px] h-[72px] rounded-full flex-shrink-0 animate-pulse"
              style={{ background: "rgba(123,143,166,0.15)" }}
            />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-5 w-28 rounded-full animate-pulse" style={{ background: "rgba(123,143,166,0.15)" }} />
              <div className="h-3 w-40 rounded-full animate-pulse" style={{ background: "rgba(123,143,166,0.12)" }} />
            </div>
          </div>
          <div className="flex gap-8">
            {[0, 1].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="h-7 w-8 rounded animate-pulse" style={{ background: "rgba(123,143,166,0.15)" }} />
                <div className="h-3 w-14 rounded animate-pulse" style={{ background: "rgba(123,143,166,0.12)" }} />
              </div>
            ))}
          </div>
        </div>
        <div className="h-2" style={{ background: "var(--mongle-warm)" }} />
        <div className="px-6 py-5 flex flex-col gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: "rgba(123,143,166,0.10)" }} />
          ))}
        </div>
      </div>
    </main>
  );
}
