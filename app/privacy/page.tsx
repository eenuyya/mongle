import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = { title: "개인정보처리방침 | 몽글" };

export default function PrivacyPage() {
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
            개인정보처리방침
          </h1>
        </div>

        {/* 본문 */}
        <div className="px-6 py-6 space-y-7">
          <p className="text-xs" style={{ color: "rgba(54,69,84,0.45)" }}>
            최종 수정일: 2026년 5월 1일
          </p>

          <p className="text-sm leading-relaxed" style={{ color: "rgba(54,69,84,0.7)" }}>
            몽글(이하 "서비스")은 이용자의 개인정보를 중요하게 생각하며,
            「개인정보 보호법」 등 관련 법령을 준수합니다.
            본 방침을 통해 수집하는 개인정보의 항목·목적·보유 기간을 안내합니다.
          </p>

          <Section title="1. 수집하는 개인정보 항목">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr style={{ background: "rgba(54,69,84,0.05)" }}>
                  <Th>구분</Th>
                  <Th>항목</Th>
                  <Th>수집 방법</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>필수</Td>
                  <Td>이메일 주소, 암호화된 비밀번호</Td>
                  <Td>회원가입</Td>
                </tr>
                <tr style={{ background: "rgba(54,69,84,0.02)" }}>
                  <Td>선택</Td>
                  <Td>닉네임, 자기소개</Td>
                  <Td>프로필 설정</Td>
                </tr>
                <tr>
                  <Td>자동</Td>
                  <Td>접속 IP, 브라우저 종류, 방문 일시</Td>
                  <Td>서비스 이용</Td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section title="2. 개인정보의 수집·이용 목적">
            <ol className="list-decimal list-inside space-y-1">
              <li>회원 식별 및 서비스 제공</li>
              <li>저장한 장소·코스 등 이용자 데이터 관리</li>
              <li>서비스 개선 및 오류 분석</li>
              <li>법령 의무 이행 및 분쟁 처리</li>
            </ol>
          </Section>

          <Section title="3. 개인정보의 보유 및 이용 기간">
            <ol className="list-decimal list-inside space-y-1">
              <li>회원 탈퇴 시 즉시 삭제 (단, 관련 법령에 따라 보존 의무가 있는 경우 예외)</li>
              <li>전자상거래 관련 기록: 5년 (전자상거래 등에서의 소비자 보호에 관한 법률)</li>
              <li>서비스 이용 로그: 3개월</li>
            </ol>
          </Section>

          <Section title="4. 개인정보의 제3자 제공">
            서비스는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
            단, 법령에 의한 요청이 있는 경우는 예외로 합니다.
          </Section>

          <Section title="5. 개인정보 처리 위탁">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr style={{ background: "rgba(54,69,84,0.05)" }}>
                  <Th>수탁 업체</Th>
                  <Th>위탁 업무</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>Supabase Inc.</Td>
                  <Td>회원 인증 및 데이터 저장</Td>
                </tr>
                <tr style={{ background: "rgba(54,69,84,0.02)" }}>
                  <Td>Vercel Inc.</Td>
                  <Td>서비스 호스팅 및 배포</Td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section title="6. 이용자의 권리">
            이용자는 언제든지 자신의 개인정보를 조회·수정·삭제할 수 있으며,
            개인정보 처리에 대한 동의를 철회할 수 있습니다.
            요청은 아래 개인정보 보호책임자에게 연락하시기 바랍니다.
          </Section>

          <Section title="7. 쿠키 및 유사 기술">
            서비스는 로그인 상태 유지를 위해 쿠키 및 로컬 스토리지를 사용합니다.
            브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 일부 서비스 이용에 제한이 생길 수 있습니다.
          </Section>

          <Section title="8. 개인정보 보호책임자">
            <div className="space-y-0.5">
              <p>이름: 몽글 운영팀</p>
              <p>이메일: mongle.service@gmail.com</p>
            </div>
          </Section>

          <div className="pt-4 pb-12 text-xs" style={{ color: "rgba(54,69,84,0.4)" }}>
            본 방침은 관련 법령 또는 서비스 정책 변경에 따라 수정될 수 있으며,
            변경 시 서비스 내 공지를 통해 안내합니다.
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

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="text-left px-2 py-1.5 font-semibold"
      style={{ color: "var(--mongle-brown)", border: "1px solid rgba(54,69,84,0.1)" }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td
      className="px-2 py-1.5"
      style={{ color: "rgba(54,69,84,0.7)", border: "1px solid rgba(54,69,84,0.08)" }}
    >
      {children}
    </td>
  );
}
