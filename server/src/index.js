const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize services
const DataManager = require('./services/DataManager');
const FileWatcher = require('./services/FileWatcher');
const SSEManager = require('./services/SSEManager');
const ClaudeResponder = require('./services/ClaudeResponder');
const ClaudeFileWatcher = require('./services/ClaudeFileWatcher');
const AnthropicResponder = require('./services/AnthropicResponder');

const dataManager = new DataManager();
const sseManager = new SSEManager();
const fileWatcher = new FileWatcher([
  path.join(process.cwd(), 'data/requests'),
  path.join(process.cwd(), 'data/responses')
]);
const claudeResponder = new ClaudeResponder(dataManager, sseManager);
const claudeFileWatcher = new ClaudeFileWatcher(
  path.join(process.env.DATA_PATH || '/app/data', 'claude_requests.json')
);
const anthropicResponder = new AnthropicResponder(
  dataManager, 
  sseManager, 
  process.env.ANTHROPIC_API_KEY
);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../public')));
}

// Routes
app.use('/api/health', require('./routes/health'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/responses', require('./routes/responses'));
app.use('/api/history', require('./routes/history'));
app.use('/api/events', require('./routes/events'));

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Serve React app for all non-API routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
  });
} else {
  // 404 handler for unknown routes in development
  app.use(notFoundHandler);
}

// Error handling middleware
app.use(errorHandler);


// Make services available to routes
app.set('sseManager', sseManager);
app.set('claudeResponder', claudeResponder);

// Connect file watcher to SSE
fileWatcher.on('sse_event', (event) => {
  sseManager.broadcast(event.type, event.data);
});

fileWatcher.on('error', (error) => {
  console.error('File watcher error:', error);
  sseManager.broadcast('file_watcher_error', { error: error.message });
});

// Start file watcher
fileWatcher.start();

// Start claude responder
claudeResponder.start();

// Start claude file watcher
claudeFileWatcher.start();

// Start Anthropic API responder if API key is available
if (process.env.ANTHROPIC_API_KEY) {
  anthropicResponder.start();
} else {
  console.log('[AnthropicResponder] No API key found, automatic responses disabled');
}

// Handle pending requests from Claude file watcher
claudeFileWatcher.on('pending_requests', (pendingRequests) => {
  console.log(`\n🔔 [AUTO-DEV BRIDGE] ${pendingRequests.length} new requests detected!`);
  
  // Broadcast to all SSE clients
  sseManager.broadcast('claude_pending_requests', {
    count: pendingRequests.length,
    requests: pendingRequests.map(req => ({
      id: req.request.id,
      message: req.request.message,
      timestamp: req.request.timestamp
    })),
    notification: `⚡ Claude Code: ${pendingRequests.length} 요청이 대기 중입니다!`
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  fileWatcher.stop();
  claudeResponder.stop();
  claudeFileWatcher.stop();
  anthropicResponder.stop();
  sseManager.shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  fileWatcher.stop();
  claudeResponder.stop();
  claudeFileWatcher.stop();
  anthropicResponder.stop();
  sseManager.shutdown();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/api/events`);
  console.log('File watcher monitoring: data/requests, data/responses');
});