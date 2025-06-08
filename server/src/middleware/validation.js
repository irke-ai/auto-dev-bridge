const Joi = require('joi')

const validate = (schema, options = {}) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
      ...options
    }

    const { error, value } = schema.validate(req.body, validationOptions)

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Request data validation failed',
        details: errors
      })
    }

    // Replace req.body with validated and sanitized data
    req.body = value
    next()
  }
}

const validateQuery = (schema, options = {}) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
      ...options
    }

    const { error, value } = schema.validate(req.query, validationOptions)

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))

      return res.status(400).json({
        error: 'Query Validation Error',
        message: 'Query parameters validation failed',
        details: errors
      })
    }

    req.query = value
    next()
  }
}

const validateParams = (schema, options = {}) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
      ...options
    }

    const { error, value } = schema.validate(req.params, validationOptions)

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))

      return res.status(400).json({
        error: 'Parameter Validation Error',
        message: 'URL parameters validation failed',
        details: errors
      })
    }

    req.params = value
    next()
  }
}

// Common parameter schemas
const commonSchemas = {
  id: Joi.object({
    id: Joi.string().required().description('Resource ID')
  }),
  
  pagination: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0),
    sort: Joi.string().valid('created', 'updated', 'priority').default('created'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),
  
  search: Joi.object({
    q: Joi.string().min(1).max(500).required().description('Search query'),
    limit: Joi.number().integer().min(1).max(100).default(20)
  })
}

module.exports = {
  validate,
  validateQuery,
  validateParams,
  commonSchemas
}