# Sprint 3: API 엔드포인트 및 파일 기반 데이터 관리

## 메타데이터
```yaml
meta:
  auto_execute: true
  estimated_duration: "30분"
  dependencies: ["sprint-1", "sprint-2"]
  parallel_capable: false
  checkpoint_required: true
```

## 목표
```yaml
objectives:
  primary: "REST API 구현 및 JSON 파일 기반 데이터 시스템 구축"
  success_criteria:
    - metric: "api_endpoints_working"
      test: "all_endpoints_return_200"
      count: 6
    - metric: "file_operations"
      check: "json_crud_working"
    - metric: "file_watcher_active"
      check: "chokidar_monitoring"
```

## Knowledge Base 패턴
```yaml
knowledge_base_patterns:
  - id: "express-api-routes"
    source: "knowledge_base:backend/node_quick_patterns.yaml#express-routes"
    success_rate: 0.98
    
  - id: "file-operations"
    source: "knowledge_base:backend/file_system_patterns.yaml#json-crud"
    success_rate: 0.96
    
  - id: "data-validation"
    source: "knowledge_base:backend/validation_patterns.yaml#joi-schema"
    success_rate: 0.94
    
  - id: "file-watcher"
    source: "knowledge_base:backend/file_system_patterns.yaml#chokidar-watcher"
    success_rate: 0.97
    
  - id: "error-handling"
    source: "knowledge_base:backend/error_patterns.yaml#express-middleware"
    success_rate: 0.99
```

## 자동 구현
```yaml
auto_implementation:
  # 1. 데이터 구조 설정
  data_structure:
    - action: "create_directories"
      paths:
        - "data/requests"
        - "data/responses"
        - "data/history"
        - "data/requests/archive"
        - "data/responses/archive"
        
    - path: "data/requests/active.json"
      pattern: "file-operations"
      extract: "initial_json_structure"
      content: |
        {
          "requests": [],
          "metadata": {
            "created": "{{timestamp}}",
            "last_updated": "{{timestamp}}",
            "version": "1.0.0"
          }
        }
        
    - path: "data/responses/latest.json"
      pattern: "file-operations"
      extract: "initial_json_structure"
      content: |
        {
          "responses": [],
          "metadata": {
            "created": "{{timestamp}}",
            "last_updated": "{{timestamp}}",
            "version": "1.0.0"
          }
        }
  
  # 2. 데이터 매니저 서비스
  data_manager:
    - path: "server/src/services/DataManager.js"
      pattern: "file-operations"
      extract: "data_manager_class"
      modifications:
        - methods: ["create", "read", "update", "delete", "list"]
        - validation: "schema_based"
        - error_handling: "comprehensive"
        
    - path: "server/src/services/FileWatcher.js"
      pattern: "file-watcher"
      extract: "chokidar_service"
      modifications:
        - watch_paths: ["data/requests", "data/responses"]
        - events: ["add", "change", "unlink"]
        - debounce: 100
  
  # 3. API 라우트 구현
  api_routes:
    - path: "server/src/routes/requests.js"
      pattern: "express-api-routes"
      extract: "crud_routes"
      modifications:
        - entity: "requests"
        - validation: "request_schema"
        - endpoints: ["GET /", "POST /", "GET /:id", "PUT /:id", "DELETE /:id"]
        
    - path: "server/src/routes/responses.js"
      pattern: "express-api-routes"
      extract: "crud_routes"
      modifications:
        - entity: "responses"
        - validation: "response_schema"
        - endpoints: ["GET /", "GET /:id", "GET /latest"]
        
    - path: "server/src/routes/history.js"
      pattern: "express-api-routes"
      extract: "read_only_routes"
      modifications:
        - entity: "history"
        - endpoints: ["GET /", "GET /search"]
        - pagination: true
  
  # 4. 데이터 검증 스키마
  validation_schemas:
    - path: "server/src/schemas/requestSchema.js"
      pattern: "data-validation"
      extract: "joi_schema"
      modifications:
        - fields:
          - message: "string.required"
          - priority: "string.valid(low,medium,high)"
          - timestamp: "date.iso"
          - user_id: "string.optional"
          
    - path: "server/src/schemas/responseSchema.js"
      pattern: "data-validation"
      extract: "joi_schema"
      modifications:
        - fields:
          - request_id: "string.required"
          - content: "object.required"
          - status: "string.valid(success,error,pending)"
          - timestamp: "date.iso"
  
  # 5. 미들웨어 및 유틸리티
  middleware:
    - path: "server/src/middleware/errorHandler.js"
      pattern: "error-handling"
      extract: "error_middleware"
      modifications:
        - types: ["ValidationError", "FileSystemError", "NotFoundError"]
        - logging: "detailed"
        
    - path: "server/src/middleware/validation.js"
      pattern: "data-validation"
      extract: "validation_middleware"
      modifications:
        - schema_validation: "automatic"
        - error_formatting: "json_api"
        
    - path: "server/src/utils/fileOperations.js"
      pattern: "file-operations"
      extract: "file_utilities"
      modifications:
        - atomic_writes: true
        - backup_on_error: true
        - json_pretty_print: true
  
  # 6. 라우트 통합
  route_integration:
    - path: "server/src/index.js"
      action: "update_existing"
      modifications:
        - import_routes: ["requests", "responses", "history"]
        - mount_routes:
          - "/api/requests": "requests"
          - "/api/responses": "responses"
          - "/api/history": "history"
        - add_middleware: ["validation", "errorHandler"]
```

## 자동 실행 명령
```yaml
auto_execute:
  - stage: "install_dependencies"
    working_dir: "server"
    commands:
      - "npm install joi"
      - "npm install chokidar"
      - "npm install uuid"
      
  - stage: "data_structure_init"
    commands:
      - action: "ensure_directories"
        paths: ["data/requests", "data/responses", "data/history"]
      - action: "create_initial_files"
        files: ["active.json", "latest.json"]
        
  - stage: "server_restart_test"
    working_dir: "server"
    commands:
      - action: "restart_server"
      - action: "wait_for_health_check"
        timeout: 10000
```

## 품질 게이트
```yaml
quality_gates:
  - name: "Data Directories"
    type: "directory_exists"
    paths:
      - "data/requests"
      - "data/responses"
      - "data/history"
    
  - name: "API Endpoints Test"
    type: "api_test"
    endpoints:
      - "GET /api/health"
      - "GET /api/requests"
      - "POST /api/requests"
      - "GET /api/responses"
      - "GET /api/history"
    expected_status: 200
    
  - name: "File Operations Test"
    type: "integration_test"
    scenario: "create_request_file"
    steps:
      - "POST request to /api/requests"
      - "verify JSON file created"
      - "verify file content matches"
      
  - name: "File Watcher Test"
    type: "integration_test"
    scenario: "file_change_detection"
    steps:
      - "modify JSON file directly"
      - "verify watcher detects change"
      - "verify event is logged"
      
  - name: "Data Validation Test"
    type: "api_test"
    scenarios:
      - "POST invalid request data"
      - "expect 400 validation error"
      - "verify error message format"
```

## 자동 복구
```yaml
auto_recovery:
  file_permission_error:
    detection: "EACCES|EPERM"
    actions:
      - "fix_directory_permissions"
      - "create_missing_directories"
      - "retry_operation"
      
  json_parse_error:
    detection: "SyntaxError.*JSON"
    actions:
      - "backup_corrupted_file"
      - "restore_from_backup"
      - "reinitialize_file_structure"
      
  file_watcher_crash:
    detection: "chokidar.*error"
    actions:
      - "restart_file_watcher"
      - "verify_watch_paths"
      - "log_watcher_status"
      
  validation_schema_error:
    detection: "ValidationError"
    actions:
      - "log_validation_details"
      - "return_formatted_error"
      - "continue_processing"
```

## 체크포인트
```yaml
checkpoint:
  auto_proceed: false
  validation_required: true
  user_message: |
    ✅ Sprint 3 완료:
    - REST API 엔드포인트 구현 (6개 엔드포인트)
    - JSON 파일 기반 데이터 시스템 구축
    - 파일 감시 시스템 (chokidar) 설정
    - 데이터 검증 및 에러 처리 구현
    - CRUD 작업 완전 구현
    
    모든 API가 정상 작동하고 파일 시스템이 준비되었습니다. 다음 스프린트로 진행할까요?
  
  auto_validation:
    - "all API endpoints return 200"
    - "file operations working correctly"
    - "data validation schemas active"
    - "file watcher monitoring data directory"
```