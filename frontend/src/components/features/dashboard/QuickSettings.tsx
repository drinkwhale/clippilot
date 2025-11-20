/**
 * Dashboard Quick Settings 드롭다운
 * API 키 설정 상태를 빠르게 확인하고 설정 페이지로 이동
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAPIKeys } from "@/lib/hooks/useAPIKeys";
import { Settings, Check, X, Loader2, AlertCircle } from "lucide-react";
import type { ServiceName } from "@/lib/types/api-keys";

interface ServiceInfo {
  name: ServiceName;
  displayName: string;
  description: string;
}

const SERVICES: ServiceInfo[] = [
  {
    name: "youtube",
    displayName: "YouTube API",
    description: "영상 검색 및 업로드",
  },
  {
    name: "openai",
    displayName: "OpenAI API",
    description: "AI 스크립트 생성",
  },
  {
    name: "pexels",
    displayName: "Pexels API",
    description: "스톡 미디어 다운로드",
  },
];

export function QuickSettings() {
  const router = useRouter();
  const { data: apiKeys, isLoading, error } = useAPIKeys();
  const [isOpen, setIsOpen] = useState(false);

  const isConfigured = (serviceName: ServiceName) => {
    return apiKeys?.some((key) => key.service_name === serviceName) ?? false;
  };

  const configuredCount = SERVICES.filter((service) =>
    isConfigured(service.name)
  ).length;

  const allConfigured = configuredCount === SERVICES.length;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={allConfigured ? "outline" : "default"}
          size="sm"
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">API 키 설정</span>
          {!allConfigured && (
            <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
              {SERVICES.length - configuredCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>API 키 설정 상태</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="px-2 py-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>설정 로드 실패</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {SERVICES.map((service) => {
              const configured = isConfigured(service.name);

              return (
                <DropdownMenuItem
                  key={service.name}
                  className="flex items-start gap-3 py-3 cursor-pointer"
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/dashboard/settings");
                  }}
                >
                  <div className="mt-0.5">
                    {configured ? (
                      <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                        <X className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="font-medium text-sm">{service.displayName}</div>
                    <div className="text-xs text-muted-foreground">
                      {service.description}
                    </div>
                  </div>

                  {configured ? (
                    <Badge variant="secondary" className="text-xs">
                      설정됨
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      미설정
                    </Badge>
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => {
            setIsOpen(false);
            router.push("/dashboard/settings");
          }}
        >
          <Settings className="h-4 w-4 mr-2" />
          전체 설정 관리
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
