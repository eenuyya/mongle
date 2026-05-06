import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = { title: "이용약관 | 몽글" };

export default function TermsPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--mongle-cream)" }}>
      <div className="mx-auto max-w-lg">
        {/* 헤더 */}
        <div
          className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 border-b"
          style={{ background: "var(--mongle-cream)", borderColor: "rgba(54,69,84,0.08)" }}
        >
          <Link
            href="/profile"
            className="w-8 h-8 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
            style={{ background: "rgba(54,69,84,0.06)" }}
            aria-label="뒤로 가기"
          >
            <ChevronLeft size={18} style={{ color: "var(--mongle-brown)" }} />
          </Link>
          <h1 className="text-base font-bold" style={{ color: "var(--mongle-brown)" }}>
            이용약관
          </h1>
        </div>

        {/* 본문 */}
        <div className="px-6 py-6 space-y-7">
          <p className="text-xs" style={{ color: "rgba(54,69,84,0.45)" }}>
            최종 수정일: 2026년 5월 1일
          </p>

          <Section title="제1조 (목적)">
            본 약관은 몽글(이하 "서비스")이 제공하는 서비스의 이용 조건 및 절차, 이용자와 서비스 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
          </Section>

          <Section title="제2조 (정의)">
            <ol className="list-decimal list-inside space-y-1">
              <li>"서비스"란 몽글이 운영하는 웹 서비스 및 관련 제반 서비스를 의미합니다.</li>
              <li>"이용자"란 본 약관에 동의하고 서비스를 이용하는 자를 의미합니다.</li>
              <li>"콘텐츠"란 서비스 내에 게시된 장소 정보, 코스, 이미지 등 일체의 정보를 의미합니다.</li>
            </ol>
          </Section>

          <Section title="제3조 (약관의 효력 및 변경)">
            <ol className="list-decimal list-inside space-y-1">
              <li>본 약관은 서비스 화면에 게시하거나 기타 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
              <li>서비스는 관련 법령을 위반하지 않는 범위 내에서 약관을 변경할 수 있으며, 변경 시 7일 전 공지합니다.</li>
            </ol>
          </Section>

          <Section title="제4조 (서비스 이용)">
            <ol className="list-decimal list-inside space-y-1">
              <li>서비스 이용은 회원가입 후 가능하며, 일부 기능은 비회원에게도 제공됩니다.</li>
              <li>이용자는 타인의 개인정보를 무단으로 수집·이용하거나 허위 정보를 등록해서는 안 됩니다.</li>
              <li>서비스는 시스템 점검, 장애 등의 사유로 서비스 제공을 일시 중단할 수 있습니다.</li>
            </ol>
          </Section>

          <Section title="제5조 (콘텐츠 및 지식재산권)">
            <ol className="list-decimal list-inside space-y-1">
              <li>서비스가 제공하는 콘텐츠의 지식재산권은 서비스에 귀속됩니다.</li>
              <li>이용자가 직접 작성한 콘텐츠의 저작권은 해당 이용자에게 있습니다.</li>
              <li>이용자는 서비스 내 콘텐츠를 상업적 목적으로 무단 복제·배포할 수 없습니다.</li>
            </ol>
          </Section>

          <Section title="제6조 (책임의 제한)">
            <ol className="list-decimal list-inside space-y-1">
              <li>서비스는 천재지변, 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
              <li>서비스 내 장소 정보는 운영 현황이 변경될 수 있으며, 정확성을 보장하지 않습니다.</li>
              <li>이용자 간 또는 이용자와 제3자 사이에서 발생한 분쟁에 대해 서비스는 책임을 지지 않습니다.</li>
            </ol>
          </Section>

          <Section title="제7조 (계정 해지)">
            이용자는 언제든지 서비스 내 계정 삭제 기능을 통해 이용 계약을 해지할 수 있습니다. 해지 시 관련 법령에 따라 일부 데이터가 일정 기간 보관될 수 있습니다.
          </Section>

          <Section title="제8조 (준거법 및 관할)">
            본 약관은 대한민국 법령에 따라 해석되며, 서비스 이용과 관련된 분쟁은 대한민국 법원을 관할 법원으로 합니다.
          </Section>

          <div className="pt-4 pb-12 text-xs" style={{ color: "rgba(54,69,84,0.4)" }}>
            문의: mongle.service@gmail.com
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-bold" style={{ color: "var(--mongle-brown)" }}>
        {title}
      </h2>
      <div className="text-sm leading-relaxed" style={{ color: "rgba(54,69,84,0.7)" }}>
        {children}
      </div>
    </div>
  );
}
