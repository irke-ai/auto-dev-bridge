# Data Directory Structure

AUTO-DEV Bridge의 데이터 디렉토리 구조 설명

## 📁 디렉토리 구조

```
data/
├── claude_commands/     # AutoHotkey가 감시하는 명령 파일 디렉토리
│   └── .gitkeep        # Git에서 빈 디렉토리 유지
├── claude_responses/    # AutoHotkey가 응답을 저장하는 디렉토리
│   └── *.json          # 응답 JSON 파일들
├── requests/           # 웹 API 요청 저장 디렉토리
│   ├── active.json     # 현재 활성 요청
│   └── .gitkeep
├── responses/          # 웹 API 응답 저장 디렉토리
│   └── .gitkeep
└── history/           # 요청/응답 히스토리 로그
    ├── log.json       # 전체 히스토리 로그
    └── .gitkeep
```

## 🔄 데이터 플로우

### 1. 웹 → AutoHotkey
1. 웹 UI에서 명령 입력
2. API가 `data/claude_commands/command_*.txt` 파일 생성
3. AutoHotkey가 파일 감지 및 처리
4. 처리 후 파일 삭제

### 2. AutoHotkey → 웹
1. AutoHotkey가 Claude Code 응답 캡처
2. `data/claude_responses/{commandId}_response.json` 파일 생성
3. 웹 서버가 파일 감지
4. SSE로 클라이언트에 전송

### 3. 웹 API 자체 데이터
- `requests/`: API 요청 관리
- `responses/`: API 응답 관리
- `history/`: 전체 히스토리 추적

## 🔒 Git 관리
- `.gitignore`에서 실제 데이터 파일은 제외
- `.gitkeep` 파일로 디렉토리 구조만 유지
- JSON 파일들은 Git에 커밋되지 않음