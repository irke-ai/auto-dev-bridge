# Sprint 2: React 클라이언트 설정 및 UI 프레임워크

## 메타데이터
```yaml
meta:
  auto_execute: true
  estimated_duration: "25분"
  dependencies: ["sprint-1"]
  parallel_capable: false
  checkpoint_required: true
```

## 목표
```yaml
objectives:
  primary: "React + Vite 클라이언트 설정 및 미니멀 UI 구축"
  success_criteria:
    - metric: "client_dev_server"
      endpoint: "http://localhost:5173"
      expected: 200
    - metric: "build_success"
      check: "vite_build_complete"
    - metric: "tailwind_integration"
      check: "css_classes_working"
```

## Knowledge Base 패턴
```yaml
knowledge_base_patterns:
  - id: "vite-react-setup"
    source: "knowledge_base:frontend/react_vite_patterns.yaml#vite-react"
    success_rate: 0.97
    
  - id: "tailwind-config"
    source: "knowledge_base:frontend/react_vite_patterns.yaml#tailwind-setup"
    success_rate: 0.98
    
  - id: "component-structure"
    source: "knowledge_base:frontend/react_vite_patterns.yaml#component-patterns"
    success_rate: 0.95
    
  - id: "api-client"
    source: "knowledge_base:frontend/api_patterns.yaml#fetch-wrapper"
    success_rate: 0.96
```

## 자동 구현
```yaml
auto_implementation:
  # 1. Vite 설정
  vite_setup:
    - path: "client/vite.config.js"
      pattern: "vite-react-setup"
      extract: "vite_config"
      modifications:
        - server_port: 5173
        - proxy_target: "http://localhost:3001"
        
    - path: "client/index.html"
      pattern: "vite-react-setup"
      extract: "index_html"
      modifications:
        - title: "AUTO-DEV Bridge"
        - meta_description: "Web interface for Claude Code bridge"
  
  # 2. Tailwind CSS
  tailwind_setup:
    - path: "client/tailwind.config.js"
      pattern: "tailwind-config"
      extract: "tailwind_config"
      
    - path: "client/src/index.css"
      pattern: "tailwind-config"
      extract: "tailwind_base_styles"
      
    - path: "client/postcss.config.js"
      pattern: "tailwind-config"
      extract: "postcss_config"
  
  # 3. 핵심 컴포넌트
  components:
    - path: "client/src/main.jsx"
      pattern: "vite-react-setup"
      extract: "react_entry"
      modifications:
        - import_css: "./index.css"
        
    - path: "client/src/App.jsx"
      pattern: "component-structure"
      extract: "app_component"
      modifications:
        - layout: "minimal_form_layout"
        - theme: "dark_mode_support"
        
    - path: "client/src/components/RequestForm.jsx"
      pattern: "component-structure"
      extract: "form_component"
      modifications:
        - fields: ["message", "priority"]
        - validation: "client_side"
        
    - path: "client/src/components/ResponseDisplay.jsx"
      pattern: "component-structure"
      extract: "display_component"
      modifications:
        - real_time: true
        - format: "json_pretty"
        
    - path: "client/src/components/StatusIndicator.jsx"
      pattern: "component-structure"
      extract: "status_component"
      modifications:
        - indicators: ["connected", "processing", "error"]
        - animation: "pulse_effect"
  
  # 4. API 클라이언트
  api_client:
    - path: "client/src/utils/api.js"
      pattern: "api-client"
      extract: "fetch_wrapper"
      modifications:
        - base_url: "http://localhost:3001/api"
        - error_handling: "comprehensive"
        - timeout: 10000
        
    - path: "client/src/utils/sse.js"
      pattern: "knowledge_base:frontend/sse_patterns.yaml#sse-client"
      extract: "sse_client"
      modifications:
        - endpoint: "/api/events"
        - reconnect: "auto_retry"
        - error_recovery: "exponential_backoff"
```

## 자동 실행 명령
```yaml
auto_execute:
  - stage: "client_initialization"
    working_dir: "client"
    commands:
      - "npm install"
      - "npm install tailwindcss postcss autoprefixer"
      - "npx tailwindcss init -p"
      
  - stage: "development_dependencies"
    working_dir: "client"
    commands:
      - "npm install -D @types/react @types/react-dom"
      - "npm install -D eslint-plugin-react eslint-plugin-react-hooks"
      
  - stage: "build_test"
    working_dir: "client"
    commands:
      - "npm run build"
      - action: "verify_build"
        check: "dist_folder_exists"
```

## 품질 게이트
```yaml
quality_gates:
  - name: "Dependencies Install"
    type: "file_exists"
    paths:
      - "client/package-lock.json"
      - "client/node_modules"
    
  - name: "Tailwind Config"
    type: "file_content"
    file: "client/tailwind.config.js"
    contains: "content: ["
    
  - name: "Dev Server Start"
    type: "process_test"
    command: "cd client && npm run dev"
    timeout: 10000
    expected: "Local:   http://localhost:5173"
    
  - name: "Build Success"
    type: "command"
    execute: "cd client && npm run build"
    success_criteria: "build completed"
    
  - name: "Component Structure"
    type: "file_exists"
    paths:
      - "client/src/components/RequestForm.jsx"
      - "client/src/components/ResponseDisplay.jsx"
      - "client/src/components/StatusIndicator.jsx"
```

## 자동 복구
```yaml
auto_recovery:
  npm_install_fail:
    detection: "npm ERR!"
    actions:
      - "npm_cache_clean"
      - "delete_node_modules"
      - "reinstall_dependencies"
      
  vite_port_conflict:
    detection: "Port 5173 is already in use"
    actions:
      - "find_next_available_port"
      - "update_vite_config"
      
  tailwind_build_fail:
    detection: "PostCSS plugin"
    actions:
      - "reinstall_tailwind"
      - "regenerate_config"
      
  component_import_error:
    detection: "Failed to resolve import"
    actions:
      - "fix_import_paths"
      - "verify_component_exports"
```

## 체크포인트
```yaml
checkpoint:
  auto_proceed: false
  validation_required: true
  user_message: |
    ✅ Sprint 2 완료:
    - React + Vite 클라이언트 설정
    - Tailwind CSS 통합 완료
    - 핵심 컴포넌트 생성 (RequestForm, ResponseDisplay, StatusIndicator)
    - API 클라이언트 및 SSE 유틸리티 구현
    - 개발 서버 실행 (http://localhost:5173)
    
    클라이언트가 정상 작동 중입니다. 다음 스프린트로 진행할까요?
  
  auto_validation:
    - "http://localhost:5173 accessible"
    - "build process successful"
    - "all components created"
    - "tailwind styles working"
```