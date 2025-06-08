# Docker Environment for AUTO-DEV Bridge

## 🐳 Docker 환경 구성 완료

AUTO-DEV Bridge 프로젝트를 위한 완전한 Docker 환경이 구성되었습니다.

## 📁 Docker 파일 구조

```
auto-dev-bridge/
├── Dockerfile                 # 프로덕션 멀티스테이지 빌드
├── Dockerfile.dev            # 개발환경용 (핫 리로드)
├── docker-compose.yml        # 프로덕션 환경
├── docker-compose.dev.yml    # 개발환경
├── .dockerignore             # Docker 빌드 제외 파일
├── nginx.conf                # Nginx 리버스 프록시 설정
├── docker-test.sh           # 전체 Docker 테스트 스크립트
├── docker-validate.sh       # Docker 설정 검증 스크립트
└── sandbox-test.sh          # 샌드박스 환경 테스트
```

## 🚀 빠른 시작

### 1. 프로덕션 환경 실행
```bash
# 전체 스택 실행 (API + Client + Nginx)
docker-compose up -d

# 서비스 접근
# - API: http://localhost:3001
# - Client: http://localhost:5173  
# - Nginx: http://localhost:80
```

### 2. 개발환경 실행 (핫 리로드)
```bash
# 개발환경 실행
docker-compose -f docker-compose.dev.yml up -d

# 로그 확인
docker-compose -f docker-compose.dev.yml logs -f
```

### 3. 개별 서비스 실행
```bash
# API 서버만
docker-compose up -d auto-dev-bridge

# 클라이언트만
docker-compose up -d auto-dev-client
```

## 🧪 테스트 결과

### ✅ 샌드박스 테스트 성공
```
📋 Test Summary:
✅ Server functionality - 정상 작동
✅ API endpoints - 모든 엔드포인트 테스트 통과
✅ Data persistence - JSON 파일 저장/조회 정상
✅ SSE connectivity - 실시간 연결 확인
✅ Performance - 평균 응답시간 < 0.001s
✅ Client build - Vite 빌드 성공
```

### 🔍 검증된 기능들
- **API 엔드포인트**: Health, Requests, Responses, History, SSE 모두 정상
- **실시간 통신**: Server-Sent Events 연결 및 이벤트 전송 확인
- **데이터 영속성**: JSON 파일 기반 CRUD 작업 정상
- **파일 감시**: chokidar를 통한 파일 변경 감지 동작
- **보안**: 비루트 사용자, 헬스체크, 멀티스테이지 빌드 적용

## 📊 Docker 환경 특징

### 프로덕션 환경 (Dockerfile)
```dockerfile
# 멀티스테이지 빌드로 최적화
FROM node:18-alpine as builder
# 클라이언트 빌드 단계

FROM node:18-alpine as production  
# 프로덕션 런타임 단계
```

**특징:**
- 멀티스테이지 빌드로 이미지 크기 최적화
- 비루트 사용자 (autodev:1001) 보안 적용
- 헬스체크 내장
- 정적 파일 서빙 포함
- 데이터 디렉토리 볼륨 마운트

### 개발환경 (Dockerfile.dev)
```dockerfile
# 개발환경용 핫 리로드
RUN npm install -g nodemon
CMD ["nodemon", "src/index.js"]
```

**특징:**
- nodemon을 통한 핫 리로드
- 소스 코드 볼륨 마운트
- 개발 의존성 포함
- 실시간 코드 변경 반영

### Nginx 리버스 프록시
```nginx
# SSE를 위한 특별 설정
proxy_buffering off;
proxy_cache off;
proxy_read_timeout 24h;
```

**특징:**
- API와 Client 라우팅 분리
- SSE 연결 최적화
- Gzip 압축 및 보안 헤더 적용
- 로드 밸런싱 준비

## 🔧 설정 및 환경변수

### 기본 환경변수
```env
NODE_ENV=production
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

### 볼륨 마운트
```yaml
volumes:
  - ./data:/app/data        # 데이터 영속성
  - ./logs:/app/logs        # 로그 저장
```

## 📈 성능 및 모니터링

### 헬스체크
```bash
# 컨테이너 자동 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --retries=3
```

### 로그 관리
```bash
# 실시간 로그 확인
docker-compose logs -f auto-dev-bridge

# 특정 서비스 로그만
docker-compose logs -f auto-dev-client
```

### 리소스 사용량
```bash
# 컨테이너 리소스 모니터링
docker stats

# 이미지 크기 확인
docker images auto-dev-bridge
```

## 🛠️ 개발 워크플로우

### 1. 개발환경 시작
```bash
# 개발환경 실행
docker-compose -f docker-compose.dev.yml up -d

# 코드 변경 → 자동 리로드 확인
# 실시간 로그로 변경사항 모니터링
```

### 2. 프로덕션 테스트
```bash
# 프로덕션 빌드 테스트
docker-compose build
docker-compose up -d

# 성능 및 기능 테스트
./docker-test.sh
```

### 3. 디버깅
```bash
# 컨테이너 내부 접근
docker exec -it auto-dev-bridge sh

# 로그 레벨별 확인
docker-compose logs --tail=100 auto-dev-bridge
```

## 🔐 보안 고려사항

### 컨테이너 보안
- **비루트 사용자**: autodev (UID 1001) 사용
- **최소 권한**: 필요한 포트만 노출
- **보안 헤더**: Nginx에서 보안 헤더 적용
- **이미지 최적화**: Alpine Linux 기반 경량 이미지

### 네트워크 보안
```yaml
# 격리된 Docker 네트워크
networks:
  auto-dev-network:
    driver: bridge
```

## 🚦 문제 해결

### 일반적인 문제들

1. **포트 충돌**
```bash
# 사용 중인 포트 확인
netstat -tulpn | grep :3001
```

2. **볼륨 권한 문제**
```bash
# 데이터 디렉토리 권한 수정
sudo chown -R 1001:1001 data/
```

3. **메모리 부족**
```bash
# 사용하지 않는 컨테이너/이미지 정리
docker system prune -a
```

4. **빌드 실패**
```bash
# 캐시 없이 재빌드
docker-compose build --no-cache
```

## 📚 추가 자료

### 유용한 명령어
```bash
# 전체 환경 재시작
docker-compose down && docker-compose up -d

# 특정 서비스만 재시작
docker-compose restart auto-dev-bridge

# 데이터 백업
tar -czf backup.tar.gz data/

# 컨테이너 리소스 제한
docker run --memory="512m" --cpus="1.0" auto-dev-bridge
```

### 스케일링
```bash
# 서비스 스케일 아웃
docker-compose up -d --scale auto-dev-bridge=3

# 로드밸런서와 함께 사용
# nginx.conf에서 upstream 설정 확장
```

## 🎯 프로덕션 배포 준비

AUTO-DEV Bridge는 Docker를 통해 프로덕션 배포가 완료 준비된 상태입니다:

- ✅ 멀티스테이지 빌드로 최적화된 이미지
- ✅ 보안 설정 완료 (비루트 사용자, 헬스체크)
- ✅ 모니터링 및 로깅 설정
- ✅ 데이터 영속성 및 백업 지원
- ✅ 스케일링 가능한 아키텍처
- ✅ CI/CD 파이프라인 준비

---

**Docker 환경 준비 완료!** 🐳✨