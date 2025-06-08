# Sprint 1: 프로젝트 초기화 및 백엔드 기본 구조

## 메타데이터
```yaml
meta:
  auto_execute: true
  estimated_duration: "20분"
  dependencies: []
  parallel_capable: false
  checkpoint_required: true
```

## 목표
```yaml
objectives:
  primary: "프로젝트 기본 구조 설정 및 Express 서버 구축"
  success_criteria:
    - metric: "server_health_check"
      endpoint: "http://localhost:3001/api/health"
      expected: 200
    - metric: "git_initialized"
      check: "git_status"
    - metric: "dependencies_installed"
      check: "package_lock_exists"
```

## Knowledge Base 패턴
```yaml
knowledge_base_patterns:
  - id: "monorepo-structure"
    source: "knowledge_base:project/structure_patterns.yaml#monorepo-workspace"
    success_rate: 0.95
    
  - id: "express-server"
    source: "knowledge_base:backend/node_quick_patterns.yaml#express-basic"
    success_rate: 0.98
    
  - id: "env-config"
    source: "knowledge_base:backend/config_patterns.yaml#dotenv-setup"
    success_rate: 0.99
    
  - id: "git-setup"
    source: "knowledge_base:project/git_patterns.yaml#gitignore-node"
    success_rate: 1.0
```

## 자동 구현
```yaml
auto_implementation:
  # 1. 프로젝트 구조
  structure:
    - action: "create_directory"
      paths: 
        - "server/src/routes"
        - "server/src/services"
        - "server/src/utils"
        - "client/src/components"
        - "client/src/pages"
        - "client/src/utils"
        - "shared"
  
  # 2. 파일 생성
  files:
    - path: "package.json"
      pattern: "monorepo-structure"
      extract: "root_package_json"
      
    - path: ".gitignore"
      pattern: "git-setup"
      extract: "gitignore_content"
      
    - path: ".env.example"
      pattern: "env-config"
      extract: "env_template"
      modifications:
        - add: "CORS_ORIGIN=http://localhost:5173"
        
    - path: "server/package.json"
      pattern: "express-server"
      extract: "package_json"
      modifications:
        - name: "auto-dev-bridge-server"
        - add_dependencies:
            - "cors"
            - "dotenv"
            - "chokidar"
            
    - path: "server/src/index.js"
      pattern: "express-server"
      extract: "server_entry"
      modifications:
        - import: ["cors", "dotenv", "path"]
        - port: 3001
        - add_middleware: "cors"
        
    - path: "server/src/routes/health.js"
      pattern: "express-server"
      extract: "health_route"
      
    - path: "client/package.json"
      pattern: "knowledge_base:frontend/react_vite_patterns.yaml#vite-react"
      extract: "package_json"
      modifications:
        - name: "auto-dev-bridge-client"
```

## 자동 실행 명령
```yaml
auto_execute:
  - stage: "initialization"
    parallel: false
    commands:
      - "git init"
      - "npm install"
      
  - stage: "server_setup"
    working_dir: "server"
    commands:
      - "npm install"
      
  - stage: "environment"
    commands:
      - action: "copy_from_parent"
        source: "/mnt/c/DEV/auto-dev/.env"
        target: ".env"
        select_keys: ["ANTHROPIC_API_KEY", "GITHUB_TOKEN"]
```

## 품질 게이트
```yaml
quality_gates:
  - name: "Dependencies Check"
    type: "file_exists"
    paths: 
      - "package-lock.json"
      - "server/package-lock.json"
    
  - name: "Server Start Test"
    type: "process_test"
    command: "cd server && npm start"
    timeout: 5000
    expected: "Server running on port 3001"
    
  - name: "Git Status"
    type: "command"
    execute: "git status"
    success_criteria: "working tree clean"
```

## 자동 복구
```yaml
auto_recovery:
  port_conflict:
    detection: "EADDRINUSE"
    actions:
      - "find_next_available_port"
      - "update_env_file"
      
  module_not_found:
    detection: "MODULE_NOT_FOUND"
    actions:
      - "npm_cache_clean"
      - "reinstall_dependencies"
      
  permission_denied:
    detection: "EACCES"
    actions:
      - "fix_file_permissions"
      - "retry_with_sudo"
```

## 체크포인트
```yaml
checkpoint:
  auto_proceed: false
  validation_required: true
  user_message: |
    ✅ Sprint 1 완료:
    - 프로젝트 구조 생성
    - Express 서버 설정 (포트 3001)
    - Git 저장소 초기화
    - 환경 변수 구성
    
    서버가 정상 작동 중입니다. 다음 스프린트로 진행할까요?
  
  auto_validation:
    - "http://localhost:3001/api/health returns 200"
    - "git repository initialized"
    - "all dependencies installed"
```