// server/src/validation/commonValidation.ts

import Joi from 'joi';

export const commonValidation = {
  mongoId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid ID format',
      'any.required': 'ID is required'
    }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  search: Joi.object({
    query: Joi.string().min(1).max(100).required(),
    fields: Joi.array().items(Joi.string()).optional(),
    exact: Joi.boolean().default(false)
  }),

  dateRange: Joi.object({
    startDate: Joi.date().required(),
    endDate: Joi.date()
      .greater(Joi.ref('startDate'))
      .required()
      .messages({
        'date.greater': 'End date must be after start date'
      })
  }),

  uploadOptions: Joi.object({
    maxSize: Joi.number().integer().min(1).max(100 * 1024 * 1024).optional(), // Max 100MB
    allowedTypes: Joi.array().items(Joi.string()).optional(),
    resize: Joi.object({
      width: Joi.number().integer().min(1).max(4000).optional(),
      height: Joi.number().integer().min(1).max(4000).optional(),
      quality: Joi.number().integer().min(1).max(100).optional()
    }).optional()
  })
};

// =============================================