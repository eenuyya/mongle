"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronRight, Users, Timer, Sparkles, Loader2,
  User, Heart, Coffee, Sun, Moon, MapPin, Check, Lock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DistrictPickerSheet } from "./DistrictPickerSheet";

type PartySize = "solo" | "duo" | "group";
type StayDuration = "short" | "half" | "full";

const PARTY_OPTIONS: { value: PartySize; label: string; sub: string; icon: LucideIcon }[] = [
  { value: "solo",  label: "혼자",    sub: "나만의 시간",   icon: User  },
  { value: "duo",   label: "둘이",    sub: "데이트 · 친구", icon: Heart },
  { value: "group", label: "셋 이상", sub: "모임 · 가족",   icon: Users },
];

const DURATION_MAP: Record<StayDuration, string> = {
  short: "short", half: "half", full: "day",
};

const DURATION_OPTIONS: { value: StayDuration; label: string; sub: string; icon: LucideIcon }[] = [
  { value: "short", label: "가볍게",    sub: "2시간 이내", icon: Coffee },
  { value: "half",  label: "반나절",    sub: "3~5시간",    icon: Sun   },
  { value: "full",  label: "하루 종일", sub: "6시간+",     icon: Moon  },
];

export function CourseRecommendSetup({ districts }: { districts: string[] }) {
  const router = useRouter();
  const [party, setParty]               = useState<PartySize | null>(null);
  const [duration, setDuration]         = useState<StayDuration | null>(null);
  const [district, setDistrict]         = useState<string | null>(null);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);

  const canProceed = party !== null && duration !== null && district !== null;

  const handleNext = async () => {
    if (!party || !duration) return;
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    setIsLoading(true);
    try {
      const res = await fetch("/api/courses/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ party, duration: DURATION_MAP[duration], district }),
      });
      const { courseId, reason } = await res.json() as { courseId: string | null; reason: string | null };
      if (courseId) {
        const params = new URLSearchParams({ party, stay: duration });
        if (reason) params.set("ai_reason", reason);
        router.push(`/courses/${courseId}?${params.toString()}`);
      } else {
        const theme = { solo: "혼자", duo: "데이트", group: "친구랑" }[party];
        const params = new URLSearchParams({ duration: DURATION_MAP[duration] });
        if (theme) params.set("theme", theme);
        router.push(`/courses?${params.toString()}`);
      }
    } catch {
      router.push("/courses");
    } finally {
      setIsLoading(false);
    }
  };

  const hintText = !district
    ? "동네를 먼저 선택해주세요"
    : !party
    ? "누구랑 가는지 선택해주세요"
    : "얼마나 있을지 선택해주세요";

  return (
    <main
      className="flex flex-col"
      style={{ minHeight: "calc(100dvh - 4rem)", background: "var(--mongle-cream)" }}
    >
      {/* ── 히어로 ── */}
      <div className="px-5 pt-6 pb-6 mx-auto w-full max-w-md">
        {/* 뱃지 */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold mb-3"
          style={{ background: "rgba(255,107,138,0.12)", color: "var(--mongle-peach)" }}
        >
          <Sparkles size={10} />
          맞춤 코스 추천
        </div>

        {/* 타이틀 + 일러스트 가로 배치 */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <h1
              className="font-bold leading-tight mb-2"
              style={{ fontSize: "clamp(22px, 6vw, 26px)", color: "var(--mongle-brown)" }}
            >
              오늘,{" "}
              <span style={{ color: "var(--mongle-peach)" }}>어떤 하루</span>를<br />
              보내고 싶어요?
            </h1>
            <p style={{ fontSize: 12, color: "var(--mongle-brown)", opacity: 0.4, lineHeight: 1.5 }}>
              당신에게 딱 맞는 코스를 찾아드릴게요
            </p>
          </div>

          {/* 일러스트 */}
          <div className="flex-shrink-0" aria-hidden>
            <Image src="/place_pin_image.png" alt="" width={130} height={130} priority />
          </div>
        </div>
      </div>

      {/* ── 폼 ── */}
      <div className="px-5 pb-2 mx-auto w-full max-w-md space-y-5">

        {/* 동네 선택 */}
        <div className="space-y-2">
          <SectionLabel icon={MapPin} label="어느 동네로 갈까요?">
            <span
              className="ml-auto text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
              style={{ background: "rgba(255,107,138,0.1)", color: "var(--mongle-peach)" }}
            >
              필수
            </span>
          </SectionLabel>

          <button
            onClick={() => setDistrictOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-full bg-white active:scale-[0.98]"
            style={{
              transition: "all 0.2s ease",
              border: `1.5px solid ${district ? "rgba(255,107,138,0.38)" : "rgba(54,69,84,0.07)"}`,
              boxShadow: district
                ? "0 4px 20px rgba(255,107,138,0.18), 0 1px 4px rgba(255,107,138,0.1)"
                : "0 3px 14px rgba(54,69,84,0.07), 0 1px 3px rgba(54,69,84,0.04)",
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: district ? "rgba(255,107,138,0.12)" : "rgba(54,69,84,0.05)",
              }}
            >
              <MapPin size={14} style={{ color: "var(--mongle-peach)" }} />
            </div>
            <span
              className="flex-1 text-left text-sm"
              style={{
                color: district ? "var(--mongle-brown)" : "rgba(54,69,84,0.35)",
                fontWeight: district ? 600 : 400,
              }}
            >
              {district ?? "동네를 선택해주세요"}
            </span>
            {district
              ? <Check size={16} style={{ color: "var(--mongle-peach)", flexShrink: 0 }} />
              : <ChevronRight size={16} style={{ color: "rgba(54,69,84,0.22)", flexShrink: 0 }} />
            }
          </button>

          <DistrictPickerSheet
            districts={districts}
            selected={district}
            onSelect={(d) => { setDistrict(d); setDistrictOpen(false); }}
            externalOpen={districtOpen}
            onExternalClose={() => setDistrictOpen(false)}
          />
        </div>

        {/* 인원 선택 */}
        <div className="space-y-2.5">
          <SectionLabel icon={Users} label="누구랑 가요?" />
          <div className="grid grid-cols-3 gap-2.5">
            {PARTY_OPTIONS.map(({ value, label, sub, icon: Icon }) => {
              const active = party === value;
              return (
                <OptionCard key={value} active={active} onClick={() => setParty(value)}>
                  <Icon size={20} style={{ color: active ? "var(--mongle-peach)" : "rgba(54,69,84,0.38)" }} />
                  <span
                    className="text-[12px] font-semibold text-center"
                    style={{ color: active ? "var(--mongle-peach)" : "var(--mongle-brown)" }}
                  >
                    {label}
                  </span>
                  <span className="text-[10px] text-center" style={{ color: "rgba(54,69,84,0.35)" }}>{sub}</span>
                  {active && <CheckBadge />}
                </OptionCard>
              );
            })}
          </div>
        </div>

        {/* 소요시간 선택 */}
        <div className="space-y-2.5">
          <SectionLabel icon={Timer} label="얼마나 있을 예정이에요?" />
          <div className="grid grid-cols-3 gap-2.5">
            {DURATION_OPTIONS.map(({ value, label, sub, icon: Icon }) => {
              const active = duration === value;
              return (
                <OptionCard key={value} active={active} onClick={() => setDuration(value)}>
                  <Icon size={20} style={{ color: active ? "var(--mongle-peach)" : "rgba(54,69,84,0.38)" }} />
                  <span
                    className="text-[12px] font-semibold text-center"
                    style={{ color: active ? "var(--mongle-peach)" : "var(--mongle-brown)" }}
                  >
                    {label}
                  </span>
                  <span className="text-[10px] text-center" style={{ color: "rgba(54,69,84,0.35)" }}>{sub}</span>
                  {active && <CheckBadge />}
                </OptionCard>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="mt-auto px-5 pt-4 pb-6 mx-auto w-full max-w-md">
        {!canProceed && (
          <p className="text-center mb-3" style={{ fontSize: 12, color: "rgba(54,69,84,0.35)" }}>
            {hintText}
          </p>
        )}
        <button
          onClick={handleNext}
          disabled={!canProceed || isLoading}
          className={cn(
            "w-full flex items-center px-6 rounded-full font-bold",
            canProceed && !isLoading ? "active:scale-[0.97]" : "cursor-not-allowed"
          )}
          style={{
            fontSize: 15,
            paddingTop: 17,
            paddingBottom: 17,
            transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
            background: canProceed
              ? "linear-gradient(135deg, #FF6B8A 0%, #FF8FA3 100%)"
              : "rgba(54,69,84,0.07)",
            color: canProceed ? "white" : "rgba(54,69,84,0.28)",
            boxShadow: canProceed
              ? "0 8px 28px rgba(255,107,138,0.38), 0 2px 8px rgba(255,107,138,0.18)"
              : "none",
            opacity: canProceed ? 1 : 0.85,
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              <span className="flex-1 text-center">코스 만드는 중...</span>
            </>
          ) : (
            <>
              <Sparkles size={17} className="mr-2 flex-shrink-0" />
              <span className="flex-1 text-center">코스 추천받기</span>
              <ChevronRight size={19} className="flex-shrink-0" />
            </>
          )}
        </button>

        {/* 저장 안내 */}
        <p className="flex items-center justify-center gap-1.5 mt-3" style={{ fontSize: 12, color: "rgba(54,69,84,0.35)" }}>
          <Lock size={11} />
          선택한 정보는 저장되지 않아요
        </p>
      </div>
    </main>
  );
}

function SectionLabel({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <p
      className="flex items-center gap-2 font-semibold"
      style={{ fontSize: 13, color: "var(--mongle-brown)" }}
    >
      <Icon size={13} style={{ color: "var(--mongle-peach)" }} />
      {label}
      {children}
    </p>
  );
}


function OptionCard({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl active:scale-[0.95]"
      style={{
        background: active ? "rgba(255,107,138,0.06)" : "white",
        border: `1.5px solid ${active ? "rgba(255,107,138,0.38)" : "rgba(54,69,84,0.06)"}`,
        transition: "background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
      }}
    >
      {children}
    </button>
  );
}

function CheckBadge() {
  return (
    <span
      className="absolute top-2 right-2 w-[18px] h-[18px] rounded-full flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #FF6B8A 0%, #FF8FA3 100%)",
      }}
    >
      <Check size={10} color="white" strokeWidth={3} />
    </span>
  );
}
