#!/bin/bash

# ClipPilot 개발 서버 통합 실행 스크립트
# Phase 3 완료 상태 기준 (Backend + Frontend)

set -e  # 에러 발생 시 스크립트 중단

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"

# 로그 디렉토리 생성
mkdir -p "$LOG_DIR"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ClipPilot 개발 서버 시작${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# .env 파일 확인
check_env_file() {
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        echo -e "${YELLOW}⚠️  .env 파일이 없습니다. .env.example을 복사합니다.${NC}"
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
        echo -e "${RED}❌ .env 파일을 수정한 후 다시 실행해주세요.${NC}"
        exit 1
    fi
}

# Redis 확인 및 실행
start_redis() {
    echo -e "${BLUE}[1/3] Redis 상태 확인...${NC}"

    # Redis 실행 여부 확인
    if lsof -Pi :6379 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${GREEN}✓ Redis가 이미 실행 중입니다 (포트 6379)${NC}"
    else
        # Redis가 설치되어 있는지 확인
        if ! command -v redis-server &> /dev/null; then
            echo -e "${RED}❌ Redis가 설치되어 있지 않습니다.${NC}"
            echo -e "${YELLOW}설치 방법:${NC}"
            echo "  macOS: brew install redis"
            echo "  Ubuntu: sudo apt install redis-server"
            exit 1
        fi

        echo -e "${YELLOW}Redis를 백그라운드로 실행합니다...${NC}"
        redis-server --daemonize yes --logfile "$LOG_DIR/redis.log"
        sleep 2

        if lsof -Pi :6379 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
            echo -e "${GREEN}✓ Redis 실행 완료${NC}"
        else
            echo -e "${RED}❌ Redis 실행 실패${NC}"
            exit 1
        fi
    fi
    echo ""
}

# Backend API 실행
start_backend() {
    echo -e "${BLUE}[2/3] Backend API 실행...${NC}"

    cd "$PROJECT_ROOT/backend"

    # Python 가상환경 확인
    if [ ! -d ".venv" ]; then
        echo -e "${YELLOW}⚠️  Python 가상환경이 없습니다. uv로 생성합니다...${NC}"
        uv sync
    fi

    # 백그라운드로 실행
    echo -e "${YELLOW}FastAPI 서버를 백그라운드로 실행합니다...${NC}"
    source .venv/bin/activate
    nohup uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload \
        > "$LOG_DIR/backend.log" 2>&1 &
    BACKEND_PID=$!

    # PID 저장
    echo $BACKEND_PID > "$LOG_DIR/backend.pid"

    # 서버 시작 대기
    sleep 3

    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${GREEN}✓ Backend API 실행 완료 (PID: $BACKEND_PID)${NC}"
        echo -e "${GREEN}  URL: http://localhost:8000${NC}"
        echo -e "${GREEN}  Docs: http://localhost:8000/docs${NC}"
    else
        echo -e "${RED}❌ Backend API 실행 실패. 로그를 확인하세요:${NC}"
        echo "  tail -f $LOG_DIR/backend.log"
        exit 1
    fi
    echo ""
}

# Frontend 실행
start_frontend() {
    echo -e "${BLUE}[3/3] Frontend 실행...${NC}"

    cd "$PROJECT_ROOT/frontend"

    # node_modules 확인
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}⚠️  node_modules가 없습니다. pnpm install을 실행합니다...${NC}"
        pnpm install
    fi

    # 백그라운드로 실행
    echo -e "${YELLOW}Next.js 서버를 백그라운드로 실행합니다...${NC}"
    nohup pnpm dev > "$LOG_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!

    # PID 저장
    echo $FRONTEND_PID > "$LOG_DIR/frontend.pid"

    # 서버 시작 대기
    sleep 5

    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${GREEN}✓ Frontend 실행 완료 (PID: $FRONTEND_PID)${NC}"
        echo -e "${GREEN}  URL: http://localhost:3000${NC}"
    else
        echo -e "${RED}❌ Frontend 실행 실패. 로그를 확인하세요:${NC}"
        echo "  tail -f $LOG_DIR/frontend.log"
        exit 1
    fi
    echo ""
}

# PID 파일 정리
cleanup_old_pids() {
    rm -f "$LOG_DIR/backend.pid" "$LOG_DIR/frontend.pid"
}

# 메인 실행
main() {
    cleanup_old_pids
    check_env_file
    start_redis
    start_backend
    start_frontend

    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ✓ 모든 서비스가 실행되었습니다!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}테스트 가능한 기능:${NC}"
    echo "  • Frontend:  http://localhost:3000"
    echo "  • Backend:   http://localhost:8000"
    echo "  • API Docs:  http://localhost:8000/docs"
    echo "  • 회원가입:   http://localhost:3000/signup"
    echo "  • 로그인:     http://localhost:3000/login"
    echo "  • 대시보드:   http://localhost:3000/dashboard"
    echo ""
    echo -e "${BLUE}로그 확인:${NC}"
    echo "  • Backend:  tail -f $LOG_DIR/backend.log"
    echo "  • Frontend: tail -f $LOG_DIR/frontend.log"
    echo "  • Redis:    tail -f $LOG_DIR/redis.log"
    echo ""
    echo -e "${YELLOW}서버를 종료하려면 다음 명령어를 실행하세요:${NC}"
    echo "  ./scripts/dev-stop.sh"
    echo ""
}

main
