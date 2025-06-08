#!/usr/bin/env python3
"""
Claude Request Processor
요청을 처리하고 응답을 생성하는 헬퍼 스크립트
"""

import json
import requests
from datetime import datetime
import os

def load_pending_requests():
    """대기 중인 요청 로드"""
    file_path = "/mnt/c/DEV/projects/auto-dev-bridge/data/claude_requests.json"
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            all_requests = json.load(f)
        return [req for req in all_requests if req['status'] == 'pending']
    except FileNotFoundError:
        return []

def create_response(request_id, message, response_type="general"):
    """응답 생성 및 전송"""
    url = "http://localhost:3001/api/responses"
    
    response_data = {
        "request_id": request_id,
        "content": {
            "message": message,
            "type": response_type,
            "generated_by": "Claude Code",
            "timestamp": datetime.now().isoformat()
        },
        "status": "success"
    }
    
    try:
        # JSON 파일로 저장 (curl 사용을 위해)
        temp_file = f"/tmp/response_{request_id}.json"
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(response_data, f, ensure_ascii=False)
        
        # curl 명령어 생성
        cmd = f'curl -X POST {url} -H "Content-Type: application/json" -d @{temp_file}'
        print(f"실행: {cmd}")
        
        # 응답 전송
        result = os.system(cmd)
        
        # 임시 파일 삭제
        os.remove(temp_file)
        
        return result == 0
        
    except Exception as e:
        print(f"❌ 응답 전송 실패: {e}")
        return False

def mark_as_processed(request_id):
    """요청을 처리됨으로 표시"""
    file_path = "/mnt/c/DEV/projects/auto-dev-bridge/data/claude_requests.json"
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            all_requests = json.load(f)
        
        for req in all_requests:
            if req['request']['id'] == request_id:
                req['status'] = 'processed'
                req['processed_at'] = datetime.now().isoformat()
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(all_requests, f, ensure_ascii=False, indent=2)
        
        # 요청 상태도 업데이트
        update_request_status(request_id, 'processed')
        
    except Exception as e:
        print(f"❌ 상태 업데이트 실패: {e}")

def update_request_status(request_id, status):
    """원본 요청의 상태 업데이트"""
    url = f"http://localhost:3001/api/requests/{request_id}"
    
    try:
        # 상태 업데이트를 위한 임시 파일
        temp_file = f"/tmp/update_{request_id}.json"
        update_data = {"status": status}
        
        with open(temp_file, 'w') as f:
            json.dump(update_data, f)
        
        cmd = f'curl -X PUT {url} -H "Content-Type: application/json" -d @{temp_file}'
        os.system(cmd)
        os.remove(temp_file)
        
    except Exception as e:
        print(f"❌ 요청 상태 업데이트 실패: {e}")

def get_pending_count():
    """대기 중인 요청 수 반환"""
    return len(load_pending_requests())

# 사용 예시
if __name__ == "__main__":
    pending = load_pending_requests()
    print(f"📋 대기 중인 요청: {len(pending)}개")
    
    for req in pending:
        print(f"\n요청 ID: {req['request']['id']}")
        print(f"메시지: {req['request']['message']}")
        print(f"시간: {req['request']['timestamp']}")