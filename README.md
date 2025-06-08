# AUTO-DEV Bridge

웹 UI와 Claude Code 간의 비동기 통신을 위한 브리지 시스템

## 🚀 프로젝트 개요

AUTO-DEV Bridge는 웹 인터페이스와 VSCode의 Claude Code 간의 효율적인 비동기 통신을 가능하게 하는 시스템입니다. JSON 파일 기반의 데이터 교환과 Server-Sent Events를 통한 실시간 알림을 제공합니다.

### 주요 기능
- 웹 UI에서 VSCode Claude Code로 명령 전송
- AutoHotkey v2를 통한 자동 입력
- 실시간 응답 모니터링 (개발 중)
- 명령 히스토리 관리

## 🏗️ 아키텍처

### 기술 스택
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Express.js + Server-Sent Events
- **Data Storage**: JSON 파일 (Git 친화적)
- **Real-time**: SSE + File Watcher (chokidar)

### 시스템 구조
```
auto-dev-bridge/
├── client/               # React 프론트엔드
│   ├── src/
│   │   ├── components/   # UI 컴포넌트
│   │   ├── context/      # SSE Context
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # API 클라이언트
│   └── package.json
├── server/               # Express.js 백엔드
│   ├── src/
│   │   ├── routes/       # API 라우트
│   │   ├── services/     # 비즈니스 로직
│   │   ├── middleware/   # 미들웨어
│   │   └── schemas/      # 데이터 검증
│   └── package.json
├── data/                 # JSON 데이터 저장소
│   ├── requests/         # 요청 데이터
│   ├── responses/        # 응답 데이터
│   └── history/          # 히스토리 로그
└── package.json          # 모노레포 설정
```

## 🛠️ 설치 및 실행

### 🐳 Docker 실행 (권장)
```bash
# 프로덕션 환경
npm run docker:up

# 개발 환경 (핫 리로드)
npm run docker:dev

# 접속 주소
# - API: http://localhost:3001
# - Client: http://localhost:5173
```

### 💻 로컬 개발 실행
#### 1. 의존성 설치
```bash
npm run install:all
```

#### 2. 환경 변수 설정
`.env` 파일 생성:
```env
ANTHROPIC_API_KEY=your_api_key
GITHUB_TOKEN=your_github_token
PORT=3001
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

#### 3. 개발 서버 실행
```bash
# 서버와 클라이언트 동시 실행
npm run dev

# 또는 개별 실행
npm run dev:server    # 서버만 (포트 3001)
npm run dev:client    # 클라이언트만 (포트 5173)
```

#### 4. 프로덕션 빌드
```bash
npm run build
npm start
```

## 📡 API 엔드포인트

### Health Check
- `GET /api/health` - 서버 상태 확인

### Requests
- `GET /api/requests` - 요청 목록 조회
- `POST /api/requests` - 새 요청 생성
- `GET /api/requests/:id` - 특정 요청 조회
- `PUT /api/requests/:id` - 요청 수정
- `DELETE /api/requests/:id` - 요청 삭제

### Responses
- `GET /api/responses` - 응답 목록 조회
- `POST /api/responses` - 새 응답 생성
- `GET /api/responses/latest` - 최신 응답 조회
- `GET /api/responses/:id` - 특정 응답 조회
- `GET /api/responses/request/:requestId` - 특정 요청의 응답들

### History
- `GET /api/history` - 히스토리 조회
- `GET /api/history/search` - 히스토리 검색

### Server-Sent Events
- `GET /api/events` - SSE 연결
- `POST /api/events/broadcast` - 브로드캐스트 (테스트용)
- `GET /api/events/clients` - 연결된 클라이언트 정보

## 🔄 데이터 플로우

1. **요청 생성**: 웹 UI에서 요청 입력
2. **JSON 저장**: POST /api/requests → JSON 파일 생성
3. **파일 감지**: chokidar가 파일 변경 감지
4. **SSE 전송**: 실시간 이벤트 전송
5. **UI 업데이트**: 클라이언트가 실시간으로 업데이트

## 📊 실시간 기능

### Server-Sent Events
- **연결 관리**: 자동 재연결 및 에러 복구
- **이벤트 타입**: 
  - `request_updated` - 요청 파일 변경
  - `response_updated` - 응답 파일 변경
  - `connected` - 연결 성공
  - `heartbeat` - 연결 유지

### 파일 감시
- **감시 대상**: `data/requests/`, `data/responses/`
- **이벤트**: 파일 생성, 수정, 삭제
- **디바운싱**: 100ms (중복 이벤트 방지)

## 🧪 테스트 방법

### 1. 기본 기능 테스트
1. 서버 실행: `npm run dev:server`
2. 클라이언트 실행: `npm run dev:client`
3. http://localhost:5173 접속
4. 연결 상태 확인 (초록색 Connected)

### 2. 요청/응답 테스트
1. 요청 폼에 메시지 입력
2. Submit Request 클릭
3. JSON 파일 생성 확인 (`data/requests/active.json`)
4. 실시간 알림 확인

### 3. 실시간 업데이트 테스트
1. 터미널에서 JSON 파일 직접 수정
2. 웹 UI에서 실시간 업데이트 확인
3. SSE 이벤트 로그 확인

## 🔧 개발 도구

### 디버깅
- **서버 로그**: 콘솔에서 SSE 연결 및 파일 변경 로그 확인
- **브라우저**: 개발자 도구에서 Network > EventSource 탭 확인
- **API 테스트**: curl 또는 Postman으로 API 엔드포인트 테스트

### 예시 요청
```bash
# 요청 생성
curl -X POST http://localhost:3001/api/requests \
  -H "Content-Type: application/json" \
  -d '{"message": "Test request", "priority": "high"}'

# SSE 연결 테스트
curl -N -H "Accept: text/event-stream" \
  http://localhost:3001/api/events
```

## 🚦 시스템 상태

### 연결 상태
- ✅ **Connected (SSE)**: 서버와 실시간 연결됨
- 🟡 **Connecting**: 연결 시도 중
- 🔴 **Disconnected**: 연결 끊김
- 🔄 **Reconnecting**: 재연결 시도 중

### 파일 시스템
- JSON 파일 자동 생성 및 관리
- Git 친화적 구조
- 백업 및 복구 메커니즘

## 📈 성능 특성

- **서버 시작**: < 5초
- **클라이언트 빌드**: < 10초
- **SSE 연결**: < 1초
- **파일 변경 감지**: < 100ms
- **UI 응답성**: 즉시 반응

## 🔒 보안 고려사항

- CORS 설정으로 허용된 도메인만 접근
- 환경변수로 민감 정보 관리
- 로컬 개발환경 전용 설계
- 입력 데이터 검증 (Joi 스키마)

## 🐳 Docker 환경

완전한 Docker 환경이 구성되어 있습니다. 자세한 내용은 [DOCKER.md](DOCKER.md)를 참조하세요.

### Docker 명령어
```bash
# Docker 환경 테스트
npm run docker:test

# Docker 설정 검증
npm run docker:validate

# 샌드박스 테스트
npm run sandbox:test

# 로그 확인
npm run docker:logs

# 환경 정리
npm run docker:down
```

## 🧪 테스트

### 전체 시스템 테스트
```bash
# 샌드박스 환경에서 전체 테스트
npm run sandbox:test

# Docker 환경 검증
npm run docker:validate
```

### API 테스트
```bash
# 헬스체크
curl http://localhost:3001/api/health

# 요청 생성
curl -X POST http://localhost:3001/api/requests \
  -H "Content-Type: application/json" \
  -d '{"message": "Test request", "priority": "high"}'

# SSE 연결 테스트
curl -N -H "Accept: text/event-stream" http://localhost:3001/api/events
```

## 🛣️ 향후 계획

- [x] Docker 컨테이너화 ✅
- [x] 실시간 SSE 통신 ✅
- [x] 완전한 API 구현 ✅
- [ ] 멀티 사용자 지원
- [ ] 인증 시스템 추가
- [ ] 플러그인 아키텍처
- [ ] 모니터링 및 로깅 강화
- [ ] CI/CD 파이프라인

## 📝 라이센스

MIT License

---

**개발**: AUTO-DEV System  
**문의**: 시스템 관련 문의는 이슈 트래커를 이용해주세요.

## 📚 관련 문서

- [Docker 환경 가이드](DOCKER.md)
- [개발 계획](development_plan.md)
- [비즈니스 요구사항](business_requirements.md)
- [Sprint 문서](sprints/)