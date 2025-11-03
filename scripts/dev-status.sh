#!/bin/bash

# ClipPilot 개발 서버 상태 확인 스크립트

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ClipPilot 서비스 상태${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Redis 상태 확인
check_redis() {
    echo -e "${BLUE}[Redis]${NC}"
    if lsof -Pi :6379 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        REDIS_PID=$(lsof -ti:6379)
        echo -e "  상태: ${GREEN}● 실행 중${NC} (PID: $REDIS_PID)"
        echo -e "  포트: 6379"

        # Redis 연결 테스트
        if command -v redis-cli &> /dev/null; then
            REDIS_VERSION=$(redis-cli --version | awk '{print $2}')
            echo -e "  버전: $REDIS_VERSION"

            if redis-cli ping > /dev/null 2>&1; then
                echo -e "  연결: ${GREEN}✓ 정상${NC}"
            else
                echo -e "  연결: ${RED}✗ 실패${NC}"
            fi
        fi
    else
        echo -e "  상태: ${RED}● 중지됨${NC}"
    fi
    echo ""
}

# Backend API 상태 확인
check_backend() {
    echo -e "${BLUE}[Backend API]${NC}"

    if [ -f "$LOG_DIR/backend.pid" ]; then
        BACKEND_PID=$(cat "$LOG_DIR/backend.pid")
        if kill -0 $BACKEND_PID 2>/dev/null; then
            echo -e "  상태: ${GREEN}● 실행 중${NC} (PID: $BACKEND_PID)"
        else
            echo -e "  상태: ${RED}● 중지됨${NC} (PID 파일 존재하지만 프로세스 없음)"
        fi
    else
        BACKEND_PID=$(lsof -ti:8000)
        if [ ! -z "$BACKEND_PID" ]; then
            echo -e "  상태: ${GREEN}● 실행 중${NC} (PID: $BACKEND_PID)"
        else
            echo -e "  상태: ${RED}● 중지됨${NC}"
        fi
    fi

    if [ ! -z "$BACKEND_PID" ]; then
        echo -e "  포트: 8000"
        echo -e "  URL:  http://localhost:8000"
        echo -e "  Docs: http://localhost:8000/docs"

        # Health check
        if command -v curl &> /dev/null; then
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/health 2>/dev/null)
            if [ "$HTTP_CODE" = "200" ]; then
                echo -e "  Health: ${GREEN}✓ 정상${NC}"
            else
                echo -e "  Health: ${YELLOW}⚠ 응답 없음 (HTTP $HTTP_CODE)${NC}"
            fi
        fi
    fi
    echo ""
}

# Celery Worker 상태 확인
check_celery() {
    echo -e "${BLUE}[Celery Worker]${NC}"

    if [ -f "$LOG_DIR/celery.pid" ]; then
        CELERY_PID=$(cat "$LOG_DIR/celery.pid")
        if kill -0 $CELERY_PID 2>/dev/null; then
            echo -e "  상태: ${GREEN}● 실행 중${NC} (PID: $CELERY_PID)"
        else
            echo -e "  상태: ${RED}● 중지됨${NC} (PID 파일 존재하지만 프로세스 없음)"
        fi
    else
        CELERY_PIDS=$(pgrep -f "celery.*worker")
        if [ ! -z "$CELERY_PIDS" ]; then
            echo -e "  상태: ${GREEN}● 실행 중${NC} (PID: $CELERY_PIDS)"
        else
            echo -e "  상태: ${RED}● 중지됨${NC}"
        fi
    fi

    if [ ! -z "$CELERY_PID" ] || [ ! -z "$CELERY_PIDS" ]; then
        echo -e "  역할: 백그라운드 작업 큐"
        echo -e "  로그: $LOG_DIR/celery.log"
    fi
    echo ""
}

# Go Rendering Worker 상태 확인
check_worker() {
    echo -e "${BLUE}[Go Rendering Worker]${NC}"

    if [ -f "$LOG_DIR/worker.pid" ]; then
        WORKER_PID=$(cat "$LOG_DIR/worker.pid")
        if kill -0 $WORKER_PID 2>/dev/null; then
            echo -e "  상태: ${GREEN}● 실행 중${NC} (PID: $WORKER_PID)"
        else
            echo -e "  상태: ${RED}● 중지됨${NC} (PID 파일 존재하지만 프로세스 없음)"
        fi
    else
        WORKER_PIDS=$(pgrep -f "go run cmd/worker/main.go")
        if [ ! -z "$WORKER_PIDS" ]; then
            echo -e "  상태: ${GREEN}● 실행 중${NC} (PID: $WORKER_PIDS)"
        else
            echo -e "  상태: ${RED}● 중지됨${NC}"
        fi
    fi

    if [ ! -z "$WORKER_PID" ] || [ ! -z "$WORKER_PIDS" ]; then
        echo -e "  역할: 비디오 렌더링 워커"
        echo -e "  로그: $LOG_DIR/worker.log"
    fi
    echo ""
}

# Frontend 상태 확인
check_frontend() {
    echo -e "${BLUE}[Frontend]${NC}"

    if [ -f "$LOG_DIR/frontend.pid" ]; then
        FRONTEND_PID=$(cat "$LOG_DIR/frontend.pid")
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            echo -e "  상태: ${GREEN}● 실행 중${NC} (PID: $FRONTEND_PID)"
        else
            echo -e "  상태: ${RED}● 중지됨${NC} (PID 파일 존재하지만 프로세스 없음)"
        fi
    else
        FRONTEND_PID=$(lsof -ti:3000)
        if [ ! -z "$FRONTEND_PID" ]; then
            echo -e "  상태: ${GREEN}● 실행 중${NC} (PID: $FRONTEND_PID)"
        else
            echo -e "  상태: ${RED}● 중지됨${NC}"
        fi
    fi

    if [ ! -z "$FRONTEND_PID" ]; then
        echo -e "  포트: 3000"
        echo -e "  URL:  http://localhost:3000"

        # Health check
        if command -v curl &> /dev/null; then
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
            if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
                echo -e "  Health: ${GREEN}✓ 정상${NC}"
            else
                echo -e "  Health: ${YELLOW}⚠ 응답 없음 (HTTP $HTTP_CODE)${NC}"
            fi
        fi
    fi
    echo ""
}

# 환경 정보
show_env_info() {
    echo -e "${BLUE}[환경 정보]${NC}"

    if [ -f "$PROJECT_ROOT/.env" ]; then
        echo -e "  .env 파일: ${GREEN}✓ 존재${NC}"
    else
        echo -e "  .env 파일: ${RED}✗ 없음${NC}"
    fi

    if [ -d "$PROJECT_ROOT/backend/.venv" ]; then
        echo -e "  Python venv: ${GREEN}✓ 존재${NC}"
    else
        echo -e "  Python venv: ${YELLOW}⚠ 없음${NC}"
    fi

    if [ -d "$PROJECT_ROOT/frontend/node_modules" ]; then
        echo -e "  node_modules: ${GREEN}✓ 존재${NC}"
    else
        echo -e "  node_modules: ${YELLOW}⚠ 없음${NC}"
    fi
    echo ""
}

# 빠른 액션 가이드
show_quick_actions() {
    echo -e "${BLUE}[빠른 액션]${NC}"
    echo "  서버 시작: ./scripts/dev-start.sh"
    echo "  서버 종료: ./scripts/dev-stop.sh"
    echo "  로그 확인: ./scripts/dev-logs.sh [backend|frontend|celery|worker|redis|all]"
    echo "  상태 확인: ./scripts/dev-status.sh"
    echo ""
}

# 메인 실행
main() {
    check_redis
    check_backend
    check_celery
    check_worker
    check_frontend
    show_env_info
    show_quick_actions
}

main
