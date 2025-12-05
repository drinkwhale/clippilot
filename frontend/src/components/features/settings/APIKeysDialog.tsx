/**
 * API Keys 관리 다이얼로그 (헤더용)
 * YouTube, OpenAI, Pexels 등 모든 API 키를 다이얼로그에서 관리
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useAPIKeys,
  useCreateAPIKey,
  useDeleteAPIKey,
} from "@/lib/hooks/useAPIKeys";
import type { ServiceName } from "@/lib/types/api-keys";
import {
  Loader2,
  Eye,
  EyeOff,
  Key,
  ExternalLink,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ServiceConfig {
  name: ServiceName;
  displayName: string;
  description: string;
  getKeyUrl: string;
  placeholder: string;
}

const SERVICES: ServiceConfig[] = [
  {
    name: "youtube",
    displayName: "YouTube Data API",
    description: "YouTube 영상 검색 및 업로드",
    getKeyUrl: "https://console.cloud.google.com/apis/credentials",
    placeholder: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  },
  {
    name: "openai",
    displayName: "OpenAI API",
    description: "AI 스크립트 생성 (GPT-4)",
    getKeyUrl: "https://platform.openai.com/api-keys",
    placeholder: "sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  },
  {
    name: "pexels",
    displayName: "Pexels API",
    description: "스톡 비디오/이미지 다운로드",
    getKeyUrl: "https://www.pexels.com/api/",
    placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  },
];

export function APIKeysDialog() {
  const [open, setOpen] = useState(false);
  const { data: apiKeys, isLoading } = useAPIKeys();
  const createMutation = useCreateAPIKey();
  const deleteMutation = useDeleteAPIKey();

  const [editingService, setEditingService] = useState<ServiceName | null>(
    null
  );
  const [keyValues, setKeyValues] = useState<Record<ServiceName, string>>({
    youtube: "",
    openai: "",
    pexels: "",
  });
  const [showKeys, setShowKeys] = useState<Record<ServiceName, boolean>>({
    youtube: false,
    openai: false,
    pexels: false,
  });

  const handleSave = async (serviceName: ServiceName) => {
    const apiKey = keyValues[serviceName]?.trim();
    if (!apiKey) {
      return;
    }

    await createMutation.mutateAsync({
      service_name: serviceName,
      api_key: apiKey,
    });

    // 저장 후 입력 필드 초기화
    setKeyValues((prev) => ({ ...prev, [serviceName]: "" }));
    setEditingService(null);
  };

  const handleDelete = async (serviceName: ServiceName) => {
    if (confirm(`${serviceName} API 키를 삭제하시겠습니까?`)) {
      await deleteMutation.mutateAsync(serviceName);
    }
  };

  const isConfigured = (serviceName: ServiceName) => {
    return apiKeys?.some((key) => key.service_name === serviceName);
  };

  // 설정된 API 키 개수
  const configuredCount = apiKeys?.length || 0;
  const totalCount = SERVICES.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Key className="h-4 w-4" />
          <span className="hidden md:inline">API 키 설정</span>
          <Badge
            variant={configuredCount === totalCount ? "default" : "secondary"}
            className="ml-1"
          >
            {configuredCount}/{totalCount}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API 키 관리
          </DialogTitle>
          <DialogDescription>
            YouTube, OpenAI, Pexels 등 외부 서비스 API 키를 관리합니다.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4 pb-6">
              {SERVICES.map((service) => {
                const configured = isConfigured(service.name);
                const isEditing = editingService === service.name;
                const apiKey = apiKeys?.find(
                  (k) => k.service_name === service.name
                );

                return (
                  <div
                    key={service.name}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    {/* 서비스 헤더 */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-medium">{service.displayName}</h3>
                          {configured ? (
                            <Badge variant="default" className="gap-1">
                              <Check className="h-3 w-3" />
                              설정됨
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <X className="h-3 w-3" />
                              미설정
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(service.getKeyUrl, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        키 발급
                      </Button>
                    </div>

                    {/* API 키 입력/표시 */}
                    {isEditing || !configured ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`key-${service.name}`}>API 키</Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                id={`key-${service.name}`}
                                type={
                                  showKeys[service.name] ? "text" : "password"
                                }
                                placeholder={service.placeholder}
                                value={keyValues[service.name]}
                                onChange={(e) =>
                                  setKeyValues((prev) => ({
                                    ...prev,
                                    [service.name]: e.target.value,
                                  }))
                                }
                                className="pr-10"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowKeys((prev) => ({
                                    ...prev,
                                    [service.name]: !prev[service.name],
                                  }))
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showKeys[service.name] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSave(service.name)}
                            disabled={
                              !keyValues[service.name]?.trim() ||
                              createMutation.isPending
                            }
                          >
                            {createMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                저장 중...
                              </>
                            ) : (
                              "저장"
                            )}
                          </Button>
                          {configured && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingService(null);
                                setKeyValues((prev) => ({
                                  ...prev,
                                  [service.name]: "",
                                }));
                              }}
                            >
                              취소
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          마지막 사용:{" "}
                          {apiKey?.last_used_at
                            ? new Date(apiKey.last_used_at).toLocaleString(
                                "ko-KR"
                              )
                            : "사용 기록 없음"}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingService(service.name)}
                          >
                            수정
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(service.name)}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 개발 환경 안내 */}
              {process.env.NODE_ENV === "development" && (
                <Alert>
                  <AlertDescription>
                    <strong>개발 환경:</strong> API 키는 localStorage에
                    저장됩니다. 프로덕션 환경에서는 Supabase에 암호화되어
                    저장됩니다.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
