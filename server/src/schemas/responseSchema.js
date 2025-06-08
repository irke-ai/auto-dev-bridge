const Joi = require('joi')

const responseSchema = Joi.object({
  request_id: Joi.string()
    .required()
    .description('ID of the related request'),
    
  content: Joi.object()
    .required()
    .description('Response content data'),
    
  status: Joi.string()
    .valid('success', 'error', 'pending', 'partial')
    .default('success')
    .description('Response status'),
    
  error_code: Joi.string()
    .optional()
    .description('Error code if status is error'),
    
  metadata: Joi.object()
    .optional()
    .description('Additional response metadata'),
    
  execution_time: Joi.number()
    .positive()
    .optional()
    .description('Execution time in milliseconds')
})

module.exports = {
  responseSchema
}