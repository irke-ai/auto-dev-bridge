const Joi = require('joi')

const requestSchema = Joi.object({
  message: Joi.string()
    .required()
    .min(1)
    .max(10000)
    .trim()
    .description('The request message content'),
    
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .default('medium')
    .description('Request priority level'),
    
  user_id: Joi.string()
    .optional()
    .description('Optional user identifier'),
    
  metadata: Joi.object()
    .optional()
    .description('Additional metadata for the request'),
    
  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(10)
    .optional()
    .description('Optional tags for categorization')
})

const updateRequestSchema = Joi.object({
  message: Joi.string()
    .min(1)
    .max(10000)
    .trim()
    .optional(),
    
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .optional(),
    
  status: Joi.string()
    .valid('pending', 'processing', 'completed', 'cancelled')
    .optional(),
    
  metadata: Joi.object()
    .optional(),
    
  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(10)
    .optional()
})

module.exports = {
  requestSchema,
  updateRequestSchema
}