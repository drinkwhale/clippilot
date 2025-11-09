#!/bin/bash

# ClipPilot 개발 서버 종료 스크립트

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ClipPilot 개발 서버 종료${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Backend 종료
stop_backend() {
    echo -e "${YELLOW}Backend API 종료 중...${NC}"

    if [ -f "$LOG_DIR/backend.pid" ]; then
        BACKEND_PID=$(cat "$LOG_DIR/backend.pid")
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID
            echo -e "${GREEN}✓ Backend API 종료 완료 (PID: $BACKEND_PID)${NC}"
        else
            echo -e "${YELLOW}⚠️  Backend API가 이미 종료되어 있습니다.${NC}"
        fi
        rm -f "$LOG_DIR/backend.pid"
    else
        # PID 파일이 없으면 포트로 찾아서 종료
        BACKEND_PID=$(lsof -ti:8000)
        if [ ! -z "$BACKEND_PID" ]; then
            kill $BACKEND_PID
            echo -e "${GREEN}✓ Backend API 종료 완료 (포트 8000)${NC}"
        else
            echo -e "${YELLOW}⚠️  실행 중인 Backend API를 찾을 수 없습니다.${NC}"
        fi
    fi
}

# Celery Worker 종료
stop_celery() {
    echo -e "${YELLOW}Celery Worker 종료 중...${NC}"

    if [ -f "$LOG_DIR/celery.pid" ]; then
        CELERY_PID=$(cat "$LOG_DIR/celery.pid")
        if kill -0 $CELERY_PID 2>/dev/null; then
            kill $CELERY_PID
            echo -e "${GREEN}✓ Celery Worker 종료 완료 (PID: $CELERY_PID)${NC}"
        else
            echo -e "${YELLOW}⚠️  Celery Worker가 이미 종료되어 있습니다.${NC}"
        fi
        rm -f "$LOG_DIR/celery.pid"
    else
        # PID 파일이 없으면 프로세스명으로 찾아서 종료
        CELERY_PIDS=$(pgrep -f "celery.*worker")
        if [ ! -z "$CELERY_PIDS" ]; then
            echo "$CELERY_PIDS" | xargs kill 2>/dev/null
            echo -e "${GREEN}✓ Celery Worker 종료 완료${NC}"
        else
            echo -e "${YELLOW}⚠️  실행 중인 Celery Worker를 찾을 수 없습니다.${NC}"
        fi
    fi
}

# Go Rendering Worker 종료
stop_worker() {
    echo -e "${YELLOW}Go Rendering Worker 종료 중...${NC}"

    if [ -f "$LOG_DIR/worker.pid" ]; then
        WORKER_PID=$(cat "$LOG_DIR/worker.pid")
        if kill -0 $WORKER_PID 2>/dev/null; then
            kill $WORKER_PID
            echo -e "${GREEN}✓ Go Rendering Worker 종료 완료 (PID: $WORKER_PID)${NC}"
        else
            echo -e "${YELLOW}⚠️  Go Rendering Worker가 이미 종료되어 있습니다.${NC}"
        fi
        rm -f "$LOG_DIR/worker.pid"
    else
        # PID 파일이 없으면 프로세스명으로 찾아서 종료
        WORKER_PIDS=$(pgrep -f "go run cmd/worker/main.go")
        if [ ! -z "$WORKER_PIDS" ]; then
            echo "$WORKER_PIDS" | xargs kill 2>/dev/null
            echo -e "${GREEN}✓ Go Rendering Worker 종료 완료${NC}"
        else
            echo -e "${YELLOW}⚠️  실행 중인 Go Rendering Worker를 찾을 수 없습니다.${NC}"
        fi
    fi
}

# Frontend 종료
stop_frontend() {
    echo -e "${YELLOW}Frontend 종료 중...${NC}"

    if [ -f "$LOG_DIR/frontend.pid" ]; then
        FRONTEND_PID=$(cat "$LOG_DIR/frontend.pid")
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID
            echo -e "${GREEN}✓ Frontend 종료 완료 (PID: $FRONTEND_PID)${NC}"
        else
            echo -e "${YELLOW}⚠️  Frontend가 이미 종료되어 있습니다.${NC}"
        fi
        rm -f "$LOG_DIR/frontend.pid"
    else
        # PID 파일이 없으면 포트로 찾아서 종료
        FRONTEND_PID=$(lsof -ti:3000)
        if [ ! -z "$FRONTEND_PID" ]; then
            kill $FRONTEND_PID
            echo -e "${GREEN}✓ Frontend 종료 완료 (포트 3000)${NC}"
        else
            echo -e "${YELLOW}⚠️  실행 중인 Frontend를 찾을 수 없습니다.${NC}"
        fi
    fi

    # Next.js dev lock 파일 정리
    if [ -f "$PROJECT_ROOT/frontend/.next/dev/lock" ]; then
        rm -f "$PROJECT_ROOT/frontend/.next/dev/lock"
    fi
}

# Redis 종료 (옵션)
stop_redis() {
    echo -e "${YELLOW}Redis 종료 중...${NC}"

    if lsof -Pi :6379 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        if command -v redis-cli &> /dev/null; then
            redis-cli shutdown 2>/dev/null || true
            echo -e "${GREEN}✓ Redis 종료 완료${NC}"
        else
            REDIS_PID=$(lsof -ti:6379)
            if [ ! -z "$REDIS_PID" ]; then
                kill $REDIS_PID
                echo -e "${GREEN}✓ Redis 종료 완료 (PID: $REDIS_PID)${NC}"
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  실행 중인 Redis를 찾을 수 없습니다.${NC}"
    fi
}

# 메인 실행
main() {
    stop_backend
    stop_celery
    stop_worker
    stop_frontend

    # Redis 종료 여부 선택
    read -p "Redis도 함께 종료하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        stop_redis
    else
        echo -e "${BLUE}Redis는 계속 실행됩니다.${NC}"
    fi

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ✓ 서버 종료 완료${NC}"
    echo -e "${GREEN}========================================${NC}"
}

main
