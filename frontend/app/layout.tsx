import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClipPilot - AI 숏폼 크리에이터 자동화",
  description: "AI로 자동 생성하고 YouTube에 1클릭 업로드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
