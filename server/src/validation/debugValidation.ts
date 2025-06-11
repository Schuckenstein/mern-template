// server/src/validation/debugValidation.ts

import Joi from 'joi';

export const debugValidation = {
  testEmail: Joi.object({
    to: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Recipient email is required'
      }),
    
    subject: Joi.string()
      .min(1)
      .max(200)
      .default('Test Email')
      .messages({
        'string.min': 'Subject cannot be empty',
        'string.max': 'Subject must not exceed 200 characters'
      }),
    
    message: Joi.string()
      .min(1)
      .max(5000)
      .default('This is a test email.')
      .messages({
        'string.min': 'Message cannot be empty',
        'string.max': 'Message must not exceed 5000 characters'
      })
  }),

  databaseQuery: Joi.object({
    collection: Joi.string()
      .valid('users', 'files', 'emailJobs', 'notifications', 'auditLogs', 'refreshTokens')
      .required()
      .messages({
        'any.required': 'Collection name is required',
        'any.only': 'Invalid collection name'
      }),
    
    query: Joi.object().default({}),
    
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit must not exceed 100'
      }),
    
    skip: Joi.number()
      .integer()
      .min(0)
      .default(0)
      .messages({
        'number.min': 'Skip must be 0 or greater'
      })
  }),

  getLogs: Joi.object({
    level: Joi.string()
      .valid('all', 'error', 'warn', 'info', 'debug')
      .default('all'),
    
    limit: Joi.number()
      .integer()
      .min(1)
      .max(1000)
      .default(100),
    
    filter: Joi.string().max(100).optional(),
    
    startDate: Joi.date().optional(),
    
    endDate: Joi.date()
      .greater(Joi.ref('startDate'))
      .optional()
      .messages({
        'date.greater': 'End date must be after start date'
      })
  })
};