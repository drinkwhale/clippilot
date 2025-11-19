"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  FileVideo,
  Youtube,
  Layout,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * 사이드바 메뉴 항목
 */
interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const menuItems: MenuItem[] = [
  {
    label: "대시보드",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: "YouTube 검색",
    href: "/dashboard/youtube-search",
    icon: <Search className="h-5 w-5" />,
  },
  {
    label: "작업 관리",
    href: "/dashboard/jobs",
    icon: <FileVideo className="h-5 w-5" />,
  },
  {
    label: "채널 관리",
    href: "/dashboard/channels",
    icon: <Youtube className="h-5 w-5" />,
  },
  {
    label: "템플릿",
    href: "/dashboard/templates",
    icon: <Layout className="h-5 w-5" />,
  },
  {
    label: "설정",
    href: "/dashboard/settings",
    icon: <Settings className="h-5 w-5" />,
  },
];

/**
 * 사이드바 네비게이션 컴포넌트
 */
export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 모바일 햄버거 메뉴 버튼 */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* 모바일 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* 로고 */}
          <div className="flex items-center h-16 px-6 border-b">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <FileVideo className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">ClipPilot</span>
            </Link>
          </div>

          {/* 메뉴 항목 */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {item.icon}
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* 하단 정보 */}
          <div className="border-t p-4">
            <p className="text-xs text-muted-foreground text-center">
              © 2024 ClipPilot
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
