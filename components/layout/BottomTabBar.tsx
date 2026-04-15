"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Map, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/",        label: "홈",   icon: Home     },
  { href: "/places",  label: "장소",  icon: MapPin   },
  { href: "/courses", label: "코스",  icon: Map      },
  { href: "/saved",   label: "저장",  icon: Bookmark },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-stretch pb-safe"
      style={{
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255,140,105,0.13)",
      }}
      aria-label="하단 탭 네비게이션"
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-opacity duration-150"
            style={{ opacity: isActive ? 1 : 0.45 }}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.2 : 1.8}
              style={{ color: isActive ? "var(--mongle-peach)" : "var(--mongle-brown)" }}
            />
            <span
              className="text-[10px] font-medium tracking-wide"
              style={{ color: isActive ? "var(--mongle-peach)" : "var(--mongle-brown)" }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
