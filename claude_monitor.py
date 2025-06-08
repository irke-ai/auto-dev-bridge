#!/usr/bin/env python3
"""
Claude Request Monitor
자동으로 요청 파일을 모니터링하고 Claude Code에게 알립니다.
"""

import json
import time
import os
from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class ClaudeRequestHandler(FileSystemEventHandler):
    def __init__(self, file_path):
        self.file_path = file_path
        self.processed_ids = set()
        self.load_existing_requests()
    
    def load_existing_requests(self):
        """기존 요청들의 ID를 로드하여 중복 처리 방지"""
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                requests = json.load(f)
                for req in requests:
                    if req.get('status') == 'processed':
                        self.processed_ids.add(req['request']['id'])
        except FileNotFoundError:
            pass
    
    def on_modified(self, event):
        if event.src_path == self.file_path:
            self.check_new_requests()
    
    def check_new_requests(self):
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                requests = json.load(f)
            
            new_requests = []
            for req in requests:
                if req['status'] == 'pending' and req['request']['id'] not in self.processed_ids:
                    new_requests.append(req['request'])
            
            if new_requests:
                print(f"\n🔔 [AUTO-DEV BRIDGE] 새로운 요청이 도착했습니다!")
                print(f"📋 대기 중인 요청: {len(new_requests)}개")
                for req in new_requests:
                    print(f"\n📌 요청 ID: {req['id']}")
                    print(f"📝 메시지: {req['message']}")
                    print(f"⏰ 시간: {req['timestamp']}")
                print("\n" + "="*50)
                print("💡 응답을 생성하려면 claude_process_requests() 함수를 실행하세요.")
                print("="*50 + "\n")
                
        except Exception as e:
            print(f"❌ 오류 발생: {e}")

def monitor_requests():
    """요청 파일 모니터링 시작"""
    file_path = "/mnt/c/DEV/projects/auto-dev-bridge/data/claude_requests.json"
    
    # 파일이 있는 디렉토리 확인
    directory = os.path.dirname(file_path)
    if not os.path.exists(directory):
        print(f"❌ 디렉토리가 존재하지 않습니다: {directory}")
        return
    
    print(f"🚀 Claude Request Monitor 시작")
    print(f"📁 모니터링 파일: {file_path}")
    print(f"⏳ 새로운 요청을 기다리는 중...\n")
    
    event_handler = ClaudeRequestHandler(file_path)
    observer = Observer()
    observer.schedule(event_handler, directory, recursive=False)
    observer.start()
    
    try:
        # 시작 시 한 번 체크
        event_handler.check_new_requests()
        
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        print("\n👋 모니터링을 종료합니다.")
    observer.join()

if __name__ == "__main__":
    monitor_requests()