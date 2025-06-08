# VSCode Claude Code 자동화 가이드

## 개요
VSCode의 Claude Code 확장에 자동으로 명령을 입력하는 시스템입니다.

## 수정 완료
AutoHotkey 스크립트가 VSCode의 Claude Code를 대상으로 수정되었습니다:

1. **claude_bridge_v2.ahk** - 기본 버전
2. **claude_bridge_advanced.ahk** - 고급 버전

## 작동 방식

### 1. 명령 전송 프로세스
```
웹 인터페이스 → API → pending.txt 생성 → AutoHotkey 감지 → VSCode 활성화 → Ctrl+L (Claude Code 열기) → 텍스트 입력 → Enter
```

### 2. 핫키 동작
- **Ctrl+L**: Claude Code 채팅 창 열기
- **Ctrl+A**: 기존 텍스트 선택
- **Enter**: 명령 전송

### 3. 사용 방법
```powershell
# AutoHotkey v2 스크립트 실행
C:\DEV\projects\auto-dev-bridge\claude_bridge_v2.ahk

# 또는 고급 버전
C:\DEV\projects\auto-dev-bridge\claude_bridge_advanced.ahk
```

### 4. 테스트
1. VSCode 열기
2. F10 키 눌러 VSCode 감지 확인
3. F11 키 눌러 테스트 명령 생성
4. Claude Code 채팅창이 열리고 텍스트가 자동 입력되는지 확인

## 주의사항
- VSCode가 실행 중이어야 함
- Claude Code 확장이 설치되어 있어야 함
- Ctrl+L이 Claude Code 단축키로 설정되어 있어야 함

## 문제 해결
- VSCode가 감지되지 않으면 F10으로 확인
- 로그 파일 확인: `claude_bridge.log`
- AutoHotkey v2.0 이상 필요