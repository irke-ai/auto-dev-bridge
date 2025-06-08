# 🐳 Docker Desktop WSL2 설정 가이드

## 현재 상태
- ✅ Docker 설치됨 (v28.0.4)
- ✅ Docker Compose 설치됨 (v2.34.0)
- ✅ 사용자가 docker 그룹에 속함
- ❌ Docker daemon 접근 권한 없음

## 🔧 설정 단계

### 1. Windows에서 Docker Desktop 설정

#### Docker Desktop 실행
1. Windows에서 Docker Desktop 실행
2. 시스템 트레이에서 Docker 아이콘이 "Docker Desktop is running" 상태 확인

#### General 설정
1. Docker Desktop → Settings → General
2. ✅ **"Use the WSL 2 based engine"** 체크 확인
3. ✅ **"Start Docker Desktop when you sign in"** (선택사항)

#### WSL Integration 설정 (중요!)
1. Docker Desktop → Settings → Resources → **WSL Integration**
2. ✅ **"Enable integration with my default WSL distro"** 체크
3. 아래 목록에서 사용 중인 WSL distro 찾기
4. 해당 distro의 토글 스위치를 **ON**으로 변경
5. **"Apply & Restart"** 클릭

### 2. WSL 터미널에서 확인

#### 터미널 재시작
```bash
# WSL 터미널을 완전히 닫고 다시 열기
# 또는
exit
# Windows Terminal에서 새 탭 열기
```

#### Docker 접근 테스트
```bash
# Docker 버전 확인
docker version

# 간단한 테스트
docker run hello-world
```

### 3. 문제 해결

#### 여전히 권한 오류가 발생하는 경우:

**옵션 1: WSL 재시작**
```powershell
# Windows PowerShell (관리자 권한)에서 실행
wsl --shutdown
# 몇 초 기다린 후 WSL 터미널 다시 열기
```

**옵션 2: Docker Desktop 재시작**
1. 시스템 트레이에서 Docker 아이콘 우클릭
2. "Quit Docker Desktop" 선택
3. Docker Desktop 다시 실행
4. "Docker Desktop is running" 확인

**옵션 3: 수동 권한 설정**
```bash
# WSL 터미널에서
sudo chmod 666 /var/run/docker.sock
# 또는
sudo service docker start
```

## 🚀 Docker 실행 명령어

설정이 완료되면 다음 명령어로 프로젝트 실행:

### 프로덕션 환경
```bash
# 이미지 빌드 및 실행
docker compose up -d

# 로그 확인
docker compose logs -f

# 상태 확인
docker compose ps
```

### 개발 환경 (핫 리로드)
```bash
# 개발 환경 실행
docker compose -f docker-compose.dev.yml up -d

# 로그 확인
docker compose -f docker-compose.dev.yml logs -f
```

### 테스트 명령어
```bash
# Docker 환경 검증
npm run docker:validate

# 전체 Docker 테스트
npm run docker:test
```

## 📍 접속 주소
- **API Server**: http://localhost:3001
- **Web Client**: http://localhost:5173
- **Health Check**: http://localhost:3001/api/health

## 🎯 확인 사항
Docker가 정상적으로 설정되면:
```bash
docker version
# Client와 Server 정보가 모두 표시되어야 함

docker compose version
# Docker Compose version v2.x.x 표시

docker ps
# 실행 중인 컨테이너 목록 표시 (오류 없이)
```

## 💡 팁
- Docker Desktop은 Windows 시작 시 자동 실행 설정 권장
- WSL Integration은 각 WSL distro별로 개별 설정 필요
- 설정 변경 후 반드시 "Apply & Restart" 클릭
- WSL 터미널은 설정 변경 후 재시작 필요

---

위 단계를 모두 완료한 후에도 문제가 있다면 Windows를 재부팅하고 다시 시도해주세요.