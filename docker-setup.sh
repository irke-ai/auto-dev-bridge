#!/bin/bash

# Docker WSL2 Setup Script
echo "🐳 Docker WSL2 설정 스크립트"
echo "=========================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}[INFO]${NC} 현재 사용자: $USER"
echo -e "${YELLOW}[INFO]${NC} 현재 그룹: $(groups)"

# Docker 설치 확인
if command -v docker &> /dev/null; then
    echo -e "${GREEN}[OK]${NC} Docker가 설치되어 있습니다: $(docker --version)"
else
    echo -e "${RED}[ERROR]${NC} Docker가 설치되지 않았습니다."
    exit 1
fi

# Docker daemon 접근 테스트
echo -e "\n${YELLOW}[INFO]${NC} Docker daemon 접근 테스트 중..."
if docker version &> /dev/null; then
    echo -e "${GREEN}[OK]${NC} Docker daemon에 접근 가능합니다!"
    docker version
else
    echo -e "${RED}[ERROR]${NC} Docker daemon에 접근할 수 없습니다."
    echo -e "${YELLOW}[INFO]${NC} 다음 단계를 수행해주세요:"
    echo ""
    echo "1. Windows에서 Docker Desktop 실행"
    echo "2. Docker Desktop → Settings → General"
    echo "   - 'Use the WSL 2 based engine' 체크 확인"
    echo ""
    echo "3. Docker Desktop → Settings → Resources → WSL Integration"
    echo "   - 'Enable integration with my default WSL distro' 체크"
    echo "   - 현재 사용 중인 WSL distro 토글 ON"
    echo ""
    echo "4. Apply & Restart 클릭"
    echo ""
    echo "5. WSL 터미널 재시작 후 다음 명령어 실행:"
    echo "   sudo usermod -aG docker \$USER"
    echo "   newgrp docker"
    echo ""
    
    # Docker group 확인
    if getent group docker > /dev/null; then
        echo -e "${YELLOW}[INFO]${NC} docker 그룹이 존재합니다."
        if id -nG "$USER" | grep -qw "docker"; then
            echo -e "${GREEN}[OK]${NC} 사용자가 docker 그룹에 속해 있습니다."
            echo -e "${YELLOW}[TIP]${NC} WSL을 재시작하거나 'newgrp docker' 명령을 실행하세요."
        else
            echo -e "${YELLOW}[ACTION]${NC} 사용자를 docker 그룹에 추가해야 합니다:"
            echo "   sudo usermod -aG docker $USER"
            echo "   newgrp docker"
        fi
    else
        echo -e "${RED}[ERROR]${NC} docker 그룹이 존재하지 않습니다."
        echo -e "${YELLOW}[ACTION]${NC} Docker Desktop WSL Integration을 활성화하세요."
    fi
fi

# Docker Compose 확인
echo -e "\n${YELLOW}[INFO]${NC} Docker Compose 확인 중..."
if docker compose version &> /dev/null; then
    echo -e "${GREEN}[OK]${NC} Docker Compose 사용 가능: $(docker compose version)"
elif docker-compose --version &> /dev/null; then
    echo -e "${GREEN}[OK]${NC} Docker Compose 사용 가능: $(docker-compose --version)"
else
    echo -e "${RED}[ERROR]${NC} Docker Compose를 찾을 수 없습니다."
fi

# 프로젝트 파일 확인
echo -e "\n${YELLOW}[INFO]${NC} 프로젝트 Docker 파일 확인 중..."
required_files=(
    "Dockerfile"
    "docker-compose.yml"
    "docker-compose.dev.yml"
    ".dockerignore"
)

all_files_exist=true
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}[OK]${NC} $file 존재"
    else
        echo -e "${RED}[ERROR]${NC} $file 없음"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = true ]; then
    echo -e "\n${GREEN}[SUCCESS]${NC} 모든 Docker 파일이 준비되었습니다!"
    
    # Docker 실행 가능 여부 최종 확인
    if docker version &> /dev/null; then
        echo -e "\n${GREEN}🎉 Docker 환경이 준비되었습니다!${NC}"
        echo ""
        echo "다음 명령어로 프로젝트를 실행할 수 있습니다:"
        echo ""
        echo "  # 프로덕션 환경:"
        echo "  docker compose up -d"
        echo ""
        echo "  # 개발 환경:"
        echo "  docker compose -f docker-compose.dev.yml up -d"
        echo ""
        echo "  # 로그 확인:"
        echo "  docker compose logs -f"
        echo ""
        echo "  # 중지:"
        echo "  docker compose down"
    fi
else
    echo -e "\n${RED}[ERROR]${NC} 일부 Docker 파일이 누락되었습니다."
fi