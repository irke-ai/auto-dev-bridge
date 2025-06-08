# AutoHotkey v2 자동화 시스템 가이드

## 개요
AutoHotkey v2를 사용한 Claude Code 자동화 시스템이 완성되었습니다. 세 가지 버전이 준비되어 있습니다:

1. **claude_bridge_v2.ahk** - 기본 버전 (v2 문법)
2. **claude_bridge_advanced.ahk** - 고급 버전 (Chrome 통합, HTTP 통신)
3. **claude_bridge_minimal.ahk** - 기존 v1 버전 (참고용)

## 주요 기능

### 1. 기본 기능 (claude_bridge_v2.ahk)
- 파일 기반 명령 감시
- Claude 브라우저 창 자동 입력
- 로그 시스템
- 기본 에러 처리

### 2. 고급 기능 (claude_bridge_advanced.ahk)
- Chrome 브라우저 자동 감지
- HTTP API 통신
- 트레이 메뉴 시스템
- 응답 모니터링
- 서버 알림 기능

## 사용 방법

### 1. 기본 설정
```powershell
# AutoHotkey v2 설치 확인
# https://www.autohotkey.com/download/ahk-v2.exe

# 스크립트 실행
# 기본 버전
C:\DEV\projects\auto-dev-bridge\claude_bridge_v2.ahk

# 고급 버전
C:\DEV\projects\auto-dev-bridge\claude_bridge_advanced.ahk
```

### 2. 핫키
- **F9**: 상태 확인
- **F10**: Claude 창 확인/활성화
- **F11**: 테스트 명령 생성
- **Ctrl+Esc**: 종료 (고급 버전)
- **Esc**: 즉시 종료 (기본 버전)

### 3. 웹 인터페이스 사용
1. Docker 환경 실행: `docker-compose up`
2. 브라우저에서 http://localhost 접속
3. Claude Bridge에 명령 입력
4. AutoHotkey가 자동으로 Claude에 입력

## 시스템 구조

```
웹 인터페이스 (React)
    ↓ HTTP POST
서버 API (/api/claude-bridge/execute)
    ↓ 파일 생성
pending.txt (명령 파일)
    ↓ AutoHotkey 감시
Claude 브라우저 창
    ↓ 자동 입력
응답 대기
    ↓ 저장
response.json
    ↓ HTTP GET
웹 인터페이스 표시
```

## 고급 버전 특징

### 1. Chrome 자동 감지
```autohotkey
; Chrome 창 중에서 Claude 탭 자동 찾기
chromeWindows := WinGetList("ahk_exe chrome.exe")
for hwnd in chromeWindows {
    if InStr(WinGetTitle(hwnd), "Claude")
        ; 찾음!
}
```

### 2. HTTP 통신
```autohotkey
; 서버와 HTTP 통신
whr := ComObject("WinHttp.WinHttpRequest.5.1")
whr.Open("GET", "http://localhost:3001/api/claude-bridge/response/" . commandId)
```

### 3. 트레이 메뉴
- 상태 확인
- 일시정지/재개
- 로그 파일 열기
- 명령 디렉토리 열기

## 문제 해결

### 1. Claude 창을 찾을 수 없음
- Chrome에서 Claude 탭이 열려있는지 확인
- 탭 제목에 "Claude"가 포함되어 있는지 확인
- F10 키로 수동 확인

### 2. 명령이 입력되지 않음
- pending.txt 파일이 생성되는지 확인
- 로그 파일 확인: `claude_bridge.log`
- AutoHotkey 권한 확인 (관리자 권한 필요할 수 있음)

### 3. 응답을 받지 못함
- 현재 응답 캡처는 구현 예정
- HTTP API를 통한 수동 응답 저장 가능

## 향후 개선 사항
1. OCR 기반 응답 캡처
2. Chrome DevTools Protocol 통합
3. WebSocket 실시간 통신
4. 다중 브라우저 지원

## 참고 사항
- AutoHotkey v2.0 이상 필요
- Windows 환경에서만 동작
- Chrome 브라우저 권장