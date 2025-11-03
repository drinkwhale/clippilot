#!/bin/bash

# ClipPilot 개발 서버 로그 확인 스크립트

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ClipPilot 로그 확인${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 로그 디렉토리 확인
if [ ! -d "$LOG_DIR" ]; then
    echo -e "${RED}❌ 로그 디렉토리가 없습니다.${NC}"
    echo -e "${YELLOW}서버를 먼저 실행해주세요: ./scripts/dev-start.sh${NC}"
    exit 1
fi

# 사용법 출력
usage() {
    echo -e "${GREEN}사용법:${NC}"
    echo "  ./scripts/dev-logs.sh [service]"
    echo ""
    echo -e "${GREEN}서비스 옵션:${NC}"
    echo "  backend   - Backend API 로그"
    echo "  frontend  - Frontend 로그"
    echo "  celery    - Celery Worker 로그"
    echo "  worker    - Go Rendering Worker 로그"
    echo "  redis     - Redis 로그"
    echo "  all       - 모든 로그 (기본값)"
    echo ""
    echo -e "${GREEN}예시:${NC}"
    echo "  ./scripts/dev-logs.sh backend"
    echo "  ./scripts/dev-logs.sh celery"
    echo "  ./scripts/dev-logs.sh all"
}

# 로그 파일 확인
check_log_exists() {
    local log_file=$1
    local service_name=$2

    if [ ! -f "$log_file" ]; then
        echo -e "${YELLOW}⚠️  ${service_name} 로그 파일이 없습니다.${NC}"
        return 1
    fi
    return 0
}

# Backend 로그
show_backend_logs() {
    echo -e "${BLUE}=== Backend API 로그 ===${NC}"
    if check_log_exists "$LOG_DIR/backend.log" "Backend"; then
        tail -f "$LOG_DIR/backend.log"
    fi
}

# Frontend 로그
show_frontend_logs() {
    echo -e "${BLUE}=== Frontend 로그 ===${NC}"
    if check_log_exists "$LOG_DIR/frontend.log" "Frontend"; then
        tail -f "$LOG_DIR/frontend.log"
    fi
}

# Celery 로그
show_celery_logs() {
    echo -e "${BLUE}=== Celery Worker 로그 ===${NC}"
    if check_log_exists "$LOG_DIR/celery.log" "Celery"; then
        tail -f "$LOG_DIR/celery.log"
    fi
}

# Go Rendering Worker 로그
show_worker_logs() {
    echo -e "${BLUE}=== Go Rendering Worker 로그 ===${NC}"
    if check_log_exists "$LOG_DIR/worker.log" "Worker"; then
        tail -f "$LOG_DIR/worker.log"
    fi
}

# Redis 로그
show_redis_logs() {
    echo -e "${BLUE}=== Redis 로그 ===${NC}"
    if check_log_exists "$LOG_DIR/redis.log" "Redis"; then
        tail -f "$LOG_DIR/redis.log"
    fi
}

# 모든 로그 (멀티플렉싱)
show_all_logs() {
    echo -e "${BLUE}=== 모든 로그 (실시간) ===${NC}"
    echo -e "${YELLOW}Tip: Ctrl+C로 종료${NC}"
    echo ""

    # 존재하는 로그 파일만 선택
    LOG_FILES=()
    [ -f "$LOG_DIR/backend.log" ] && LOG_FILES+=("$LOG_DIR/backend.log")
    [ -f "$LOG_DIR/frontend.log" ] && LOG_FILES+=("$LOG_DIR/frontend.log")
    [ -f "$LOG_DIR/celery.log" ] && LOG_FILES+=("$LOG_DIR/celery.log")
    [ -f "$LOG_DIR/worker.log" ] && LOG_FILES+=("$LOG_DIR/worker.log")
    [ -f "$LOG_DIR/redis.log" ] && LOG_FILES+=("$LOG_DIR/redis.log")

    if [ ${#LOG_FILES[@]} -eq 0 ]; then
        echo -e "${YELLOW}⚠️  표시할 로그 파일이 없습니다.${NC}"
        echo -e "${YELLOW}서버를 먼저 실행해주세요: ./scripts/dev-start.sh${NC}"
        exit 1
    fi

    # tmux나 multitail이 없으면 기본 tail 사용
    if command -v multitail &> /dev/null; then
        # multitail 사용 (각 로그에 레이블 추가)
        MULTITAIL_ARGS=()
        for log_file in "${LOG_FILES[@]}"; do
            MULTITAIL_ARGS+=(-l "tail -f $log_file")
        done
        multitail "${MULTITAIL_ARGS[@]}"
    else
        echo -e "${YELLOW}⚠️  multitail이 설치되어 있지 않아 순차적으로 표시합니다.${NC}"
        echo -e "${YELLOW}설치: brew install multitail (macOS) | apt install multitail (Ubuntu)${NC}"
        echo ""

        # 기본 tail로 모든 로그 표시
        tail -f "${LOG_FILES[@]}"
    fi
}

# 메인 실행
main() {
    local service=${1:-all}

    case $service in
        backend)
            show_backend_logs
            ;;
        frontend)
            show_frontend_logs
            ;;
        celery)
            show_celery_logs
            ;;
        worker)
            show_worker_logs
            ;;
        redis)
            show_redis_logs
            ;;
        all)
            show_all_logs
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo -e "${RED}❌ 알 수 없는 서비스: $service${NC}"
            echo ""
            usage
            exit 1
            ;;
    esac
}

main "$@"
