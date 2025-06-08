const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  })

  // Default error response
  let statusCode = 500
  let errorResponse = {
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  }

  // Handle specific error types
  if (err.name === 'ValidationError' || err.isJoi) {
    statusCode = 400
    errorResponse = {
      error: 'Validation Error',
      message: err.message,
      details: err.details || null,
      timestamp: new Date().toISOString()
    }
  } else if (err.code === 'ENOENT') {
    statusCode = 404
    errorResponse = {
      error: 'File Not Found',
      message: 'The requested file or resource was not found',
      timestamp: new Date().toISOString()
    }
  } else if (err.code === 'EACCES' || err.code === 'EPERM') {
    statusCode = 500
    errorResponse = {
      error: 'File System Error',
      message: 'Permission denied accessing file system',
      timestamp: new Date().toISOString()
    }
  } else if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
    statusCode = 400
    errorResponse = {
      error: 'JSON Parse Error',
      message: 'Invalid JSON format in request body',
      timestamp: new Date().toISOString()
    }
  } else if (err.message && err.message.includes('not found')) {
    statusCode = 404
    errorResponse = {
      error: 'Not Found',
      message: err.message,
      timestamp: new Date().toISOString()
    }
  } else if (err.statusCode) {
    statusCode = err.statusCode
    errorResponse = {
      error: err.name || 'Error',
      message: err.message,
      timestamp: new Date().toISOString()
    }
  }

  // In development, include stack trace
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack
  }

  res.status(statusCode).json(errorResponse)
}

// 404 handler for routes that don't exist
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route ${req.method} ${req.originalUrl} not found`)
  error.statusCode = 404
  next(error)
}

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
}