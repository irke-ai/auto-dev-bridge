import React, { useState, useEffect } from 'react';

function CommandHistory() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState(new Set());

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/claude-history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading history...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">요청 기록</h2>
        <button
          onClick={fetchHistory}
          className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md"
        >
          새로고침
        </button>
      </div>
      
      {history.length === 0 ? (
        <p className="text-gray-500">아직 요청 기록이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {history.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            const hasResponse = item.response && item.response.response;
            
            return (
              <div key={item.id} className="border rounded-lg overflow-hidden">
                <div
                  className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-600">
                          {item.id}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          hasResponse 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {hasResponse ? '완료' : '대기중'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 line-clamp-2">
                        {item.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(item.timestamp).toLocaleString('ko-KR')}
                      </p>
                    </div>
                    <div className="ml-2">
                      <svg
                        className={`w-5 h-5 text-gray-400 transform transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="p-4 border-t bg-white">
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">요청:</h4>
                        <pre className="text-sm bg-gray-50 p-3 rounded whitespace-pre-wrap">
                          {item.message}
                        </pre>
                      </div>
                      
                      {hasResponse && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">응답:</h4>
                          <pre className="text-sm bg-blue-50 p-3 rounded whitespace-pre-wrap">
                            {item.response.response}
                          </pre>
                          {item.response.timestamp && (
                            <p className="text-xs text-gray-500 mt-1">
                              응답 시간: {new Date(item.response.timestamp).toLocaleString('ko-KR')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CommandHistory;