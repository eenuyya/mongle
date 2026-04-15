"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();

  const handleBack = () => {
    const savedUrl = sessionStorage.getItem("mongle-places-back-url");
    if (savedUrl) {
      sessionStorage.removeItem("mongle-places-back-url");
      router.push(savedUrl, { scroll: false });
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-70"
      style={{ color: "var(--mongle-brown)", opacity: 0.7 }}
    >
      <ChevronLeft size={16} />
      돌아가기
    </button>
  );
}
