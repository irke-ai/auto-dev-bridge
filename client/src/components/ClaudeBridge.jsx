import React, { useState, useEffect, useContext } from 'react';
import { SSEContext } from '../context/SSEContext';

function ClaudeBridge() {
  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [error, setError] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!command.trim() || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/claude-bridge/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: command })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setLastResponse({ ...data, message: command });
        setCommand('');
        
        // 응답 확인 (폴링 - 간단한 구현)
        setTimeout(() => checkResponse(data.commandId, command), 3000);
      } else {
        throw new Error(data.error || 'Failed to send command');
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };
  
  const checkResponse = async (commandId, originalMessage) => {
    try {
      const response = await fetch(`/api/claude-bridge/response/${commandId}`);
      
      if (response.ok) {
        const data = await response.json();
        setLastResponse(prev => ({ ...prev, response: data, message: originalMessage || prev.message }));
        setIsLoading(false);
      } else if (response.status === 404) {
        // 아직 응답 없음 - 다시 시도
        setTimeout(() => checkResponse(commandId, originalMessage), 2000);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (err) {
      setError('Failed to get response');
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Claude Bridge</h2>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter command for Claude Code..."
            disabled={isLoading}
          />
        </div>
        
        <button
          type="submit"
          disabled={!command.trim() || isLoading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Processing...' : 'Send to Claude Code'}
        </button>
      </form>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {lastResponse && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">실행 결과</h3>
          
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">명령 ID:</span>
                <span className="text-sm text-gray-800 ml-2">{lastResponse.commandId}</span>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-600">요청:</span>
                <span className="text-sm text-gray-800 ml-2">{lastResponse.message || command}</span>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-600">상태:</span>
                <span className={`text-sm ml-2 ${
                  isLoading ? 'text-yellow-600' : 
                  lastResponse.response ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {isLoading ? '처리 중...' : 
                   lastResponse.response ? '완료' : '대기 중'}
                </span>
              </div>
              
              {lastResponse.response && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">응답:</h4>
                  <div className="bg-white p-4 rounded border text-sm">
                    <pre className="whitespace-pre-wrap font-mono">
                      {lastResponse.response.response || JSON.stringify(lastResponse.response, null, 2)}
                    </pre>
                  </div>
                  {lastResponse.response.timestamp && (
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(lastResponse.response.timestamp).toLocaleString('ko-KR')}
                    </p>
                  )}
                </div>
              )}
              
              {isLoading && !lastResponse.response && (
                <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded">
                  <p className="text-sm">Claude Code가 명령을 처리하고 있습니다...</p>
                  <p className="text-xs mt-1">AutoHotkey 스크립트가 실행 중인지 확인하세요.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClaudeBridge;