#!/bin/bash
# AUTO-DEV Bridge Claude Auto Responder
# 이 스크립트를 실행하면 Claude Code가 자동으로 요청을 처리합니다

echo "🚀 AUTO-DEV Bridge Claude Auto Responder"
echo "====================================="
echo ""

# 대기 중인 요청 확인 함수
check_pending_requests() {
    local file="/mnt/c/DEV/projects/auto-dev-bridge/data/claude_requests.json"
    
    if [ ! -f "$file" ]; then
        echo "❌ 요청 파일이 없습니다."
        return 1
    fi
    
    # Python one-liner로 pending 요청 수 확인
    local count=$(python3 -c "
import json
try:
    with open('$file', 'r') as f:
        data = json.load(f)
        pending = [r for r in data if r['status'] == 'pending']
        print(len(pending))
except:
    print(0)
")
    
    if [ "$count" -eq 0 ]; then
        echo "✅ 대기 중인 요청이 없습니다."
        return 1
    else
        echo "📋 대기 중인 요청: ${count}개"
        
        # 요청 목록 표시
        python3 -c "
import json
with open('$file', 'r') as f:
    data = json.load(f)
    for req in data:
        if req['status'] == 'pending':
            print(f\"\\n🔹 ID: {req['request']['id']}\")
            print(f\"   메시지: {req['request']['message'][:50]}...\")
            print(f\"   시간: {req['request']['timestamp']}\")
"
        return 0
    fi
}

# 메인 루프
echo "⏳ 요청 모니터링을 시작합니다..."
echo "   (종료하려면 Ctrl+C를 누르세요)"
echo ""

while true; do
    if check_pending_requests; then
        echo ""
        echo "🤖 Claude Code가 요청을 처리합니다..."
        echo ""
        
        # 여기서 Claude가 요청을 처리하도록 트리거
        echo "💡 다음 명령을 실행하세요:"
        echo "   python3 /mnt/c/DEV/projects/auto-dev-bridge/claude_process.py"
        echo ""
        
        # 사용자 입력 대기
        read -p "처리하시겠습니까? (y/n): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🔄 처리 시작..."
            # 실제로는 Claude가 직접 처리
            break
        fi
    fi
    
    # 5초 대기
    sleep 5
done