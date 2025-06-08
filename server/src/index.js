const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize services
const DataManager = require('./services/DataManager');
const FileWatcher = require('./services/FileWatcher');

const dataManager = new DataManager();
const fileWatcher = new FileWatcher([
  path.join(process.cwd(), 'data/requests'),
  path.join(process.cwd(), 'data/responses')
]);

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


// Start file watcher and connect to SSE
const eventsRouter = require('./routes/events');
const sseManager = eventsRouter.sseManager;

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

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  fileWatcher.stop();
  sseManager.shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  fileWatcher.stop();
  sseManager.shutdown();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/api/events`);
  console.log('File watcher monitoring: data/requests, data/responses');
});