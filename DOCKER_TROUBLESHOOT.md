# 🔧 Docker Desktop 실행 문제 해결 가이드

## 🚨 Docker Desktop이 실행되지 않을 때

### 1. 시스템 요구사항 확인

#### Windows 버전
- Windows 10 64-bit: Pro, Enterprise, Education (Build 19041 이상)
- Windows 11 64-bit: Home, Pro, Enterprise, Education

#### 필수 기능 활성화 확인
Windows PowerShell을 **관리자 권한**으로 실행 후:

```powershell
# WSL2 기능 활성화
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# Virtual Machine Platform 활성화
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Hyper-V 활성화 (Pro/Enterprise/Education)
dism.exe /online /enable-feature /featurename:Microsoft-Hyper-V-All /all /norestart

# 재부팅
Restart-Computer
```

### 2. WSL2 설치/업데이트

```powershell
# WSL 업데이트
wsl --update

# WSL2를 기본으로 설정
wsl --set-default-version 2

# WSL 상태 확인
wsl --status
```

### 3. Docker Desktop 재설치

#### 완전 제거
1. 제어판 → 프로그램 제거 → Docker Desktop 제거
2. 다음 폴더 삭제:
   - `C:\Program Files\Docker`
   - `C:\ProgramData\Docker`
   - `%APPDATA%\Docker`
   - `%LOCALAPPDATA%\Docker`

#### 새로 설치
1. [Docker Desktop 다운로드](https://www.docker.com/products/docker-desktop/)
2. 설치 시 "Use WSL 2 instead of Hyper-V" 옵션 선택
3. 설치 완료 후 재부팅

### 4. 일반적인 오류 해결

#### "Docker Desktop - WSL distro terminated abruptly"
```powershell
# WSL 초기화
wsl --unregister docker-desktop
wsl --unregister docker-desktop-data
```

#### "Docker Desktop failed to start"
1. 작업 관리자에서 Docker 관련 프로세스 모두 종료
2. Windows 서비스에서 "Docker Desktop Service" 재시작
3. `%APPDATA%\Docker\settings.json` 파일 삭제

#### 가상화 오류
BIOS/UEFI에서 가상화 활성화:
1. PC 재부팅 중 BIOS 진입 (F2, F10, DEL 등)
2. Advanced/Security 메뉴
3. Intel VT-x 또는 AMD-V 활성화
4. 저장 후 재부팅

### 5. 대체 솔루션

#### 옵션 1: Docker Desktop 없이 WSL2에서 Docker 직접 설치

```bash
# WSL Ubuntu에서 실행
# Docker 설치 스크립트
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker 서비스 시작
sudo service docker start

# 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 옵션 2: 로컬 개발 환경 사용

Docker 없이 프로젝트 실행:
```bash
# 프로젝트 디렉토리에서
npm run install:all
npm run dev
```

### 6. 시스템 진단 명령어

```powershell
# Windows PowerShell에서
# Hyper-V 상태 확인
Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V

# WSL 버전 확인
wsl -l -v

# 가상화 지원 확인
systeminfo | findstr /C:"Virtualization"
```

## 🚀 Docker 없이 프로젝트 실행하기

Docker Desktop 문제가 해결될 때까지:

### 1. 로컬 개발 서버 실행
```bash
# 의존성 설치
npm run install:all

# 개발 서버 실행
npm run dev

# 개별 실행
npm run dev:server  # 터미널 1
npm run dev:client  # 터미널 2
```

### 2. 프로덕션 빌드
```bash
# 클라이언트 빌드
npm run build

# 서버 실행
npm start
```

### 3. 접속 주소
- Client: http://localhost:5173
- API: http://localhost:3001
- Health: http://localhost:3001/api/health

## 💡 추가 도움말

### Windows 버전별 Docker 설치
- **Windows 10 Home**: WSL2 backend 필수
- **Windows 10 Pro/Enterprise**: Hyper-V 또는 WSL2 선택 가능
- **Windows 11**: 모든 버전에서 WSL2 권장

### 성능 최적화
`.wslconfig` 파일 생성 (`%USERPROFILE%\.wslconfig`):
```ini
[wsl2]
memory=4GB
processors=2
swap=8GB
localhostForwarding=true
```

### 문제 지속 시
1. Windows 업데이트 확인
2. 바이러스 백신 일시 중지
3. VPN 연결 해제
4. Windows 재설치 고려

---

현재 Docker Desktop 없이도 프로젝트는 정상 작동합니다!
로컬 개발 환경으로 계속 진행하시겠습니까?