"use client";

/**
 * CourseRecommendSetup
 * - 인원 + 소요시간 선택 → 조건에 맞는 코스 목록(/courses?...)으로 이동
 * - 특정 코스에 종속되지 않는 독립 플로우
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Timer, ArrowRight, Sparkles, Loader2, User, Heart, Coffee, Sun, Moon, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DistrictPickerSheet } from "./DistrictPickerSheet";

type PartySize = "solo" | "duo" | "group";
type StayDuration = "short" | "half" | "full";

const PARTY_OPTIONS: { value: PartySize; label: string; icon: LucideIcon; theme: string }[] = [
  { value: "solo",  label: "혼자",    icon: User,   theme: "혼자" },
  { value: "duo",   label: "둘이",    icon: Heart,  theme: "데이트" },
  { value: "group", label: "셋 이상", icon: Users,  theme: "친구랑" },
];

// stay 값 → courses 페이지 duration 필터 매핑
const DURATION_MAP: Record<StayDuration, string> = {
  short: "short",
  half:  "half",
  full:  "day",
};

const DURATION_OPTIONS: { value: StayDuration; label: string; sub: string; icon: LucideIcon }[] = [
  { value: "short", label: "가볍게",    sub: "2시간 이내", icon: Coffee },
  { value: "half",  label: "반나절",    sub: "3~5시간",    icon: Sun },
  { value: "full",  label: "하루 종일", sub: "6시간+",     icon: Moon },
];

export function CourseRecommendSetup({ districts }: { districts: string[] }) {
  const router = useRouter();
  const [party, setParty]         = useState<PartySize | null>(null);
  const [duration, setDuration]   = useState<StayDuration | null>(null);
  const [district, setDistrict]   = useState<string | null>(null);

  const canProceed = party !== null && duration !== null && district !== null;
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    if (!party || !duration) return;

    // 로그인 확인
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/courses/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ party, duration: DURATION_MAP[duration], district }),
      });
      const { courseId, reason } = await res.json() as { courseId: string | null; reason: string | null };

      if (courseId) {
        const params = new URLSearchParams();
        params.set("party", party);
        params.set("stay", duration);
        if (reason) params.set("ai_reason", reason);
        router.push(`/courses/${courseId}?${params.toString()}`);
      } else {
        // 조건에 맞는 코스 없음 → 필터 목록 fallback
        const theme = PARTY_OPTIONS.find((p) => p.value === party)?.theme;
        const params = new URLSearchParams();
        if (theme) params.set("theme", theme);
        params.set("duration", DURATION_MAP[duration]);
        router.push(`/courses?${params.toString()}`);
      }
    } catch {
      router.push("/courses");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "var(--mongle-cream)" }}>
      {/* 헤더 */}
      <div
        className="pt-20 px-5 pb-8"
        style={{ background: "linear-gradient(160deg, rgba(255,200,170,0.35) 0%, transparent 100%)" }}
      >
        <div className="mx-auto max-w-md">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{ background: "var(--mongle-peach-light)", color: "var(--mongle-brown)" }}
          >
            <Sparkles size={11} />
            맞춤 코스 추천
          </div>
          <h1 className="text-2xl font-bold leading-snug mb-2" style={{ color: "var(--mongle-brown)" }}>
            오늘 어떤 하루예요?
          </h1>
          <p className="text-sm" style={{ color: "var(--mongle-brown)", opacity: 0.6 }}>
            딱 맞는 코스를 골라드릴게요
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 pb-8 mx-auto w-full max-w-md space-y-8 pt-4">
        {/* 동네 선택 */}
        <div className="space-y-3">
          <p className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--mongle-brown)" }}>
            <MapPin size={15} style={{ color: "var(--mongle-peach)" }} />
            어느 동네로 갈까요?
          </p>
          <DistrictPickerSheet
            districts={districts}
            selected={district}
            onSelect={setDistrict}
          />
        </div>

        {/* 인원 선택 */}
        <div className="space-y-3">
          <p className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--mongle-brown)" }}>
            <Users size={15} style={{ color: "var(--mongle-peach)" }} />
            누구랑 가요?
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {PARTY_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setParty(value)}
                className={cn(
                  "flex flex-col items-center gap-2 py-4 rounded-2xl text-sm font-semibold transition-all duration-150 border",
                  party === value ? "scale-[1.03] shadow-md" : "hover:opacity-80"
                )}
                style={
                  party === value
                    ? { background: "var(--mongle-peach)", color: "white", borderColor: "var(--mongle-peach)" }
                    : { background: "white", color: "var(--mongle-brown)", borderColor: "rgba(92,61,46,0.08)" }
                }
              >
                <Icon size={26} style={{ color: party === value ? "white" : "var(--mongle-peach)" }} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 소요시간 선택 */}
        <div className="space-y-3">
          <p className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--mongle-brown)" }}>
            <Timer size={15} style={{ color: "var(--mongle-peach)" }} />
            얼마나 있을 예정이에요?
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {DURATION_OPTIONS.map(({ value, label, sub, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setDuration(value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-4 rounded-2xl transition-all duration-150 border",
                  duration === value ? "scale-[1.03] shadow-md" : "hover:opacity-80"
                )}
                style={
                  duration === value
                    ? { background: "var(--mongle-peach)", color: "white", borderColor: "var(--mongle-peach)" }
                    : { background: "white", color: "var(--mongle-brown)", borderColor: "rgba(92,61,46,0.08)" }
                }
              >
                <Icon size={26} style={{ color: duration === value ? "white" : "var(--mongle-peach)" }} />
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-[11px]" style={{ opacity: duration === value ? 0.85 : 0.5 }}>
                  {sub}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 CTA */}
      <div
        className="sticky bottom-0 px-5"
        style={{
          background: "rgba(255,248,243,0.95)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(92,61,46,0.08)",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto max-w-md py-3">
          {!canProceed && (
            <p className="text-center text-xs mb-2" style={{ color: "var(--mongle-brown)", opacity: 0.4 }}>
              {!district
                ? "동네를 선택해주세요"
                : !party
                ? "누구랑 가는지 선택해주세요"
                : "얼마나 있을지 선택해주세요"}
            </p>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed || isLoading}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold transition-all duration-200",
              canProceed && !isLoading ? "active:scale-[0.98]" : "cursor-not-allowed"
            )}
            style={{
              background: canProceed ? "var(--mongle-peach)" : "rgba(92,61,46,0.07)",
              color: canProceed ? "white" : "rgba(92,61,46,0.3)",
              border: canProceed ? "none" : "1.5px dashed rgba(92,61,46,0.18)",
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                코스 만드는 중...
              </>
            ) : (
              <>
                코스 추천받기
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
