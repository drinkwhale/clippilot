"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Search,
  FileVideo,
  Youtube,
  Layout,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAuth } from "@/lib/hooks/useAuth";
import { APIKeysDialog } from "@/components/features/settings/APIKeysDialog";

/**
 * 네비게이션 메뉴 항목
 */
interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: "대시보드",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: "YouTube 검색",
    href: "/dashboard/youtube-search",
    icon: <Search className="h-4 w-4" />,
  },
  {
    label: "작업 관리",
    href: "/dashboard/jobs",
    icon: <FileVideo className="h-4 w-4" />,
  },
  {
    label: "채널 관리",
    href: "/dashboard/channels",
    icon: <Youtube className="h-4 w-4" />,
  },
  {
    label: "템플릿",
    href: "/dashboard/templates",
    icon: <Layout className="h-4 w-4" />,
  },
  {
    label: "설정",
    href: "/dashboard/settings",
    icon: <Settings className="h-4 w-4" />,
  },
];

/**
 * 헤더 네비게이션 바 컴포넌트
 */
export function HeaderNav() {
  const pathname = usePathname();
  const { user, _hasHydrated } = useAuthStore();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  // Avoid hydration mismatch until store is ready
  if (!_hasHydrated) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* 로고 */}
        <Link href="/dashboard" className="flex items-center space-x-2 mr-8">
          <FileVideo className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">ClipPilot</span>
        </Link>

        {/* 네비게이션 메뉴 */}
        <nav className="flex items-center space-x-1 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                )}
              >
                {item.icon}
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* API 키 설정 버튼 */}
        <div className="mr-3">
          <APIKeysDialog />
        </div>

        {/* 사용자 프로필 드롭다운 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback>
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">계정</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || "user@example.com"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/settings"
                className="flex items-center cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <span>프로필 설정</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>로그아웃</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
