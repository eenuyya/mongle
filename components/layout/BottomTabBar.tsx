"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Map, Bookmark, UserRound } from "lucide-react";

const TABS = [
  { href: "/",        label: "홈",    icon: Home      },
  { href: "/places",  label: "탐색",  icon: MapPin    },
  { href: "/courses", label: "코스",  icon: Map       },
  { href: "/saved",   label: "저장",  icon: Bookmark  },
  { href: "/profile", label: "프로필", icon: UserRound },
];

// 탭바를 숨길 경로 패턴 — 몰입형 상세 페이지
const HIDDEN_PATHS = [
  /^\/courses\/[^/]+$/,  // /courses/[id]
];

export function BottomTabBar() {
  const pathname = usePathname();

  if (HIDDEN_PATHS.some((pattern) => pattern.test(pathname))) return null;

  return (
    <nav
      className="md:hidden fixed inset-x-4 z-50 flex items-center"
      style={{
        bottom: "max(16px, calc(env(safe-area-inset-bottom) + 8px))",
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(20px)",
        borderRadius: "28px",
        boxShadow: "0 4px 24px rgba(54,69,84,0.13), 0 1px 4px rgba(54,69,84,0.06)",
        padding: "6px 0",
      }}
      aria-label="하단 탭 네비게이션"
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2"
            style={{ opacity: isActive ? 1 : 0.4 }}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              size={21}
              strokeWidth={isActive ? 2.2 : 1.7}
              style={{ color: isActive ? "var(--mongle-peach)" : "var(--mongle-brown)" }}
            />
            <span
              className="text-[10px] font-medium"
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
