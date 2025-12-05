"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Search,
  FileVideo,
  Youtube,
  Settings,
  LogOut,
  User,
} from "lucide-react";

export function Navbar() {
  const { user } = useAuthStore();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  // 이메일에서 이니셜 추출 (예: jack@example.com → J)
  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* 로고 */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <FileVideo className="h-6 w-6" />
            <span className="text-xl font-bold">ClipPilot</span>
          </Link>

          {/* 메인 메뉴 */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>대시보드</span>
            </Link>

            <Link
              href="/dashboard/youtube-search"
              className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
            >
              <Search className="h-4 w-4" />
              <span>YouTube 검색</span>
            </Link>

            <Link
              href="/dashboard/jobs"
              className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
            >
              <FileVideo className="h-4 w-4" />
              <span>작업 관리</span>
            </Link>

            <Link
              href="/dashboard/channels"
              className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
            >
              <Youtube className="h-4 w-4" />
              <span>채널 관리</span>
            </Link>
          </div>

          {/* 사용자 프로필 드롭다운 */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.email ? getInitials(user.email) : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      내 계정
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/settings"
                    className="flex cursor-pointer items-center"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>설정</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/profile"
                    className="flex cursor-pointer items-center"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>프로필</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>로그아웃</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
