#!/bin/bash

# ClipPilot 개발 서버 재시작 스크립트
# 실행 중인 모든 서비스를 중지하고 다시 시작합니다

set -e  # 에러 발생 시 스크립트 중단

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT_DIR="$PROJECT_ROOT/scripts"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ClipPilot 개발 서버 재시작${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# dev-stop.sh가 존재하는지 확인
if [ ! -f "$SCRIPT_DIR/dev-stop.sh" ]; then
    echo -e "${RED}❌ dev-stop.sh 파일이 없습니다.${NC}"
    exit 1
fi

# dev-start.sh가 존재하는지 확인
if [ ! -f "$SCRIPT_DIR/dev-start.sh" ]; then
    echo -e "${RED}❌ dev-start.sh 파일이 없습니다.${NC}"
    exit 1
fi

# 1단계: 기존 서비스 중지
echo -e "${YELLOW}[1/2] 기존 서비스를 중지합니다...${NC}"
echo ""

if bash "$SCRIPT_DIR/dev-stop.sh"; then
    echo ""
    echo -e "${GREEN}✓ 모든 서비스가 중지되었습니다${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  일부 서비스 중지에 실패했지만 계속 진행합니다${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo ""

# 잠시 대기 (프로세스 정리 시간)
sleep 2

# 2단계: 서비스 재시작
echo -e "${YELLOW}[2/2] 모든 서비스를 다시 시작합니다...${NC}"
echo ""

if bash "$SCRIPT_DIR/dev-start.sh"; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ✓ 재시작이 완료되었습니다!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}실행 중인 서비스:${NC}"
    echo "  • Frontend:  http://localhost:3000"
    echo "  • Backend:   http://localhost:8000"
    echo "  • API Docs:  http://localhost:8000/docs"
    echo "  • Redis:     localhost:6379"
    echo "  • Celery:    백그라운드 작업 큐"
    echo "  • Worker:    렌더링 워커"
    echo ""
else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}  ❌ 재시작 중 오류가 발생했습니다${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${YELLOW}문제 해결:${NC}"
    echo "  1. 로그 확인: tail -f logs/backend.log"
    echo "  2. 포트 확인: lsof -i :3000,8000,6379"
    echo "  3. 수동 중지: ./scripts/dev-stop.sh"
    echo "  4. 수동 시작: ./scripts/dev-start.sh"
    echo ""
    exit 1
fi
