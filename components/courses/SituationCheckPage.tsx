"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Timer, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type PartySize = "solo" | "duo" | "group";
type StayDuration = "short" | "half" | "full";

const PARTY_OPTIONS: { value: PartySize; label: string; emoji: string }[] = [
  { value: "solo", label: "혼자", emoji: "🧍" },
  { value: "duo", label: "둘이", emoji: "👫" },
  { value: "group", label: "셋 이상", emoji: "👥" },
];

const DURATION_OPTIONS: { value: StayDuration; label: string; sub: string; emoji: string }[] = [
  { value: "short", label: "가볍게", sub: "2시간 이내", emoji: "☕" },
  { value: "half", label: "반나절", sub: "3~5시간", emoji: "🌤" },
  { value: "full", label: "하루 종일", sub: "6시간+", emoji: "🌙" },
];

interface SituationCheckPageProps {
  courseId: string;
  courseTitle: string;
  themeTag: string | null;
}

export function SituationCheckPage({
  courseId,
  courseTitle,
  themeTag,
}: SituationCheckPageProps) {
  const router = useRouter();
  const [party, setParty] = useState<PartySize | null>(null);
  const [duration, setDuration] = useState<StayDuration | null>(null);

  const canProceed = party !== null && duration !== null;

  const handleNext = () => {
    const params = new URLSearchParams();
    if (party) params.set("party", party);
    if (duration) params.set("stay", duration);
    router.push(`/courses/${courseId}?${params.toString()}`);
  };

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: "var(--mongle-cream)" }}
    >
      {/* 상단 헤더 */}
      <div
        className="pt-16 px-5 pb-8"
        style={{
          background:
            "linear-gradient(160deg, rgba(255,200,170,0.35) 0%, transparent 100%)",
        }}
      >
        <div className="mx-auto max-w-md">
          {themeTag && (
            <span
              className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3"
              style={{ background: "var(--mongle-peach-light)", color: "var(--mongle-brown)" }}
            >
              {themeTag}
            </span>
          )}
          <h1
            className="text-xl font-bold leading-snug mb-1"
            style={{ color: "var(--mongle-brown)" }}
          >
            {courseTitle}
          </h1>
          <p className="text-sm mt-3 font-medium" style={{ color: "var(--mongle-brown)", opacity: 0.6 }}>
            오늘 어떤 하루예요? 딱 맞게 코스를 보여줄게요 🌿
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 pb-8 mx-auto w-full max-w-md space-y-8">
        {/* 인원 선택 */}
        <div className="space-y-3">
          <p
            className="text-sm font-semibold flex items-center gap-2"
            style={{ color: "var(--mongle-brown)" }}
          >
            <Users size={15} style={{ color: "var(--mongle-peach)" }} />
            누구랑 가요?
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {PARTY_OPTIONS.map(({ value, label, emoji }) => (
              <button
                key={value}
                onClick={() => setParty(value)}
                className={cn(
                  "flex flex-col items-center gap-2 py-4 rounded-2xl text-sm font-semibold transition-all duration-150 border",
                  party === value
                    ? "scale-[1.03] shadow-md"
                    : "hover:opacity-80"
                )}
                style={
                  party === value
                    ? {
                        background: "var(--mongle-peach)",
                        color: "white",
                        borderColor: "var(--mongle-peach)",
                      }
                    : {
                        background: "white",
                        color: "var(--mongle-brown)",
                        borderColor: "rgba(92,61,46,0.08)",
                      }
                }
              >
                <span className="text-2xl">{emoji}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 시간 선택 */}
        <div className="space-y-3">
          <p
            className="text-sm font-semibold flex items-center gap-2"
            style={{ color: "var(--mongle-brown)" }}
          >
            <Timer size={15} style={{ color: "var(--mongle-peach)" }} />
            얼마나 있을 예정이에요?
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {DURATION_OPTIONS.map(({ value, label, sub, emoji }) => (
              <button
                key={value}
                onClick={() => setDuration(value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-4 rounded-2xl transition-all duration-150 border",
                  duration === value
                    ? "scale-[1.03] shadow-md"
                    : "hover:opacity-80"
                )}
                style={
                  duration === value
                    ? {
                        background: "var(--mongle-peach)",
                        color: "white",
                        borderColor: "var(--mongle-peach)",
                      }
                    : {
                        background: "white",
                        color: "var(--mongle-brown)",
                        borderColor: "rgba(92,61,46,0.08)",
                      }
                }
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-sm font-semibold">{label}</span>
                <span
                  className="text-[11px]"
                  style={{ opacity: duration === value ? 0.85 : 0.5 }}
                >
                  {sub}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 CTA */}
      <div
        className="sticky bottom-0 px-5 pb-safe"
        style={{
          background: "rgba(255,248,243,0.95)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(92,61,46,0.08)",
        }}
      >
        <div className="mx-auto max-w-md py-3">
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold transition-all duration-200",
              canProceed ? "active:scale-[0.98]" : "opacity-40 cursor-not-allowed"
            )}
            style={{
              background: canProceed ? "var(--mongle-peach)" : "var(--mongle-warm)",
              color: canProceed ? "white" : "var(--mongle-brown)",
            }}
          >
            이 코스로 갈게요
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </main>
  );
}
