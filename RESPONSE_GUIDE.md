# 응답 시스템 가이드

## 현재 구현된 기능
1. ✅ 웹 → 명령 파일 생성
2. ✅ AutoHotkey → VSCode Claude Code 입력
3. ⏳ Claude Code 응답 → 파일 저장 (수동)
4. ✅ 파일 → 웹 표시 (폴링)

## 응답 처리 방법

### 방법 1: 수동 응답 저장
Claude Code가 응답한 후, 다음 명령을 입력하여 응답을 저장:

```
/save-response cmd_1749379574854 "여기에 응답 내용을 입력합니다."
```

### 방법 2: 테스트 응답 생성
response_handler.ahk를 실행하고 F12를 눌러 테스트 응답 생성

### 방법 3: 직접 파일 생성
```json
{
  "commandId": "cmd_1749379574854",
  "timestamp": "2025-06-08T19:50:00",
  "response": "응답 내용",
  "status": "success"
}
```
위 내용을 `data/claude_responses/cmd_1749379574854_response.json`으로 저장

## 웹에서 응답 확인
웹 인터페이스는 자동으로 응답을 폴링하여 표시합니다.

## 향후 개선 방안
1. VSCode Extension 개발하여 자동 응답 캡처
2. Claude Code API 활용 (가능한 경우)
3. 클립보드 모니터링으로 응답 자동 감지