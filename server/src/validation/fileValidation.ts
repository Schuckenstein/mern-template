// server/src/validation/fileValidation.ts
import Joi from 'joi';

export const fileValidation = {
  getFilesQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    type: Joi.string().valid('image', 'video', 'audio', 'document', 'application').optional(),
    search: Joi.string().max(100).optional()
  }),

  uploadFile: Joi.object({
    file: Joi.any().required().messages({
      'any.required': 'File is required'
    })
  }),

  updateFile: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    isPublic: Joi.boolean().optional(),
    metadata: Joi.object().optional()
  })
};