# AUTO-DEV Bridge - 비즈니스 요구사항

## 📋 프로젝트 개요
웹 UI와 Claude Code 간의 비동기 통신을 위한 브리지 시스템

## 👥 사용자 정보
- **주요 사용자**: 개발자 (나 혼자만 사용)
- **사용 규모**: 1명
- **기술 수준**: 고급

## 🎯 핵심 기능

### 1. 웹 인터페이스
- **UI 타입**: 미니멀한 폼 기반 인터페이스
- **주요 구성요소**:
  - 요청 입력 폼
  - 응답 표시 영역
  - 실시간 상태 알림

### 2. 비동기 통신
- **통신 방식**: JSON 파일 기반
- **실시간 알림**: Server-Sent Events (SSE)
- **응답 시간**: 작업에 따라 다름 (생성되는 즉시 알림)

### 3. 데이터 저장
- **저장 방식**: 로컬 JSON 파일만 사용
- **Git 친화적**: 버전 관리 가능한 구조
- **위치**: 프로젝트 내 data/ 디렉토리

## 🔧 기술 요구사항

### 프론트엔드
- React + Vite
- Tailwind CSS
- EventSource (SSE 클라이언트)

### 백엔드
- Express.js
- Server-Sent Events
- 파일 감시 시스템 (chokidar)

### 아키텍처
- 모노레포 구조
- 클라이언트/서버 분리
- JSON 기반 데이터 교환

## 📊 성능 요구사항
- **초기 로딩**: < 2초
- **SSE 연결**: < 1초
- **파일 변경 감지**: < 100ms
- **UI 응답성**: 즉시 반응

## 🔒 보안 요구사항
- CORS 설정
- 환경변수 보안
- 로컬 개발환경 전용

## 📈 확장성 고려사항
- 향후 멀티 사용자 지원 가능
- API 확장 가능한 구조
- 플러그인 시스템 고려

## ✅ 성공 기준
1. 웹에서 요청 입력 시 JSON 파일 생성
2. 파일 변경 시 실시간 SSE 알림
3. 응답 데이터를 웹에서 실시간 표시
4. Git 커밋 가능한 깔끔한 파일 구조