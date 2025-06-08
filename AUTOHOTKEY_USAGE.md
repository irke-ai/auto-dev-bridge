# AutoHotkey 사용 가이드

## 🎮 AUTO-DEV Bridge AutoHotkey 스크립트

### 설치 및 실행

1. **AutoHotkey v2 설치**
   - https://www.autohotkey.com/download/ahk-v2.exe
   - v2.0 이상 필요

2. **스크립트 실행**
   ```bash
   # 직접 실행
   auto_claude_input.ahk 더블클릭
   
   # 또는 명령줄에서
   AutoHotkey.exe auto_claude_input.ahk
   ```

### 주요 기능

#### 파일 모니터링
- `data/claude_commands/command_*.txt` 파일 감시
- 2초마다 새 명령 파일 확인
- 발견 즉시 처리 후 삭제

#### VSCode 자동화
1. VSCode 창 찾기 및 활성화
2. 명령 텍스트 입력
3. Enter 키로 실행
4. 응답 파일 생성

### 단축키

- **F9**: 상태 확인
  - 실행 중 여부
  - 처리한 파일 수
  - 로그 파일 위치

- **F10**: VSCode 테스트
  - VSCode 창 존재 확인
  - 창 활성화 테스트

- **F11**: 테스트 명령 생성
  - 샘플 명령 파일 생성
  - 파일 처리 테스트

- **Esc**: 스크립트 종료

### 로그 파일

위치: `auto_claude.log`

내용:
- 시작/종료 시간
- 처리한 명령 파일
- 오류 메시지
- VSCode 상호작용 기록

### 문제 해결

#### VSCode를 찾을 수 없음
1. VSCode가 실행 중인지 확인
2. Claude Code 확장이 활성화되어 있는지 확인
3. F10 키로 VSCode 감지 테스트

#### 명령이 입력되지 않음
1. VSCode 창이 최소화되어 있지 않은지 확인
2. 다른 프로그램이 활성 창을 가로채지 않는지 확인
3. 로그 파일에서 오류 확인

#### 파일이 처리되지 않음
1. 파일 이름이 `command_*.txt` 패턴인지 확인
2. 파일이 올바른 디렉토리에 있는지 확인
3. 파일 권한 문제가 없는지 확인