"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { toggleSavedPlace } from "@/app/actions/saved";
import { cn } from "@/lib/utils";

interface PlaceSaveButtonProps {
  placeId: string;
  initialSaved: boolean;
}

export function PlaceSaveButton({ placeId, initialSaved }: PlaceSaveButtonProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    const next = !saved;
    setSaved(next);

    const result = await toggleSavedPlace(placeId);

    if (result.error === "로그인이 필요해요") {
      setSaved(!next);
      router.push("/login");
    } else {
      setSaved(result.saved);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
        saved ? "active:scale-95" : "hover:opacity-80 active:scale-95"
      )}
      style={
        saved
          ? { background: "var(--mongle-peach)", color: "white" }
          : { background: "var(--mongle-warm)", color: "var(--mongle-brown)" }
      }
    >
      <Bookmark
        size={15}
        fill={saved ? "white" : "none"}
        strokeWidth={2}
      />
      {saved ? "저장됨" : "저장"}
    </button>
  );
}
