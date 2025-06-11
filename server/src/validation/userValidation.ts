// server/src/validation/userValidation.ts (additional validations)

import Joi from 'joi';

export const userValidation = {
  updateProfile: Joi.object({
    firstName: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)
      .optional()
      .messages({
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name must not exceed 50 characters',
        'string.pattern.base': 'First name can only contain letters and spaces'
      }),
    
    lastName: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)
      .optional()
      .messages({
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name must not exceed 50 characters',
        'string.pattern.base': 'Last name can only contain letters and spaces'
      }),
    
    username: Joi.string()
      .min(3)
      .max(30)
      .pattern(/^[a-zA-Z0-9_]+$/)
      .optional()
      .messages({
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username must not exceed 30 characters',
        'string.pattern.base': 'Username can only contain letters, numbers, and underscores'
      }),
    
    bio: Joi.string()
      .max(500)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Bio must not exceed 500 characters'
      }),
    
    phoneNumber: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .optional()
      .allow('')
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    
    dateOfBirth: Joi.date()
      .max('now')
      .optional()
      .messages({
        'date.max': 'Date of birth cannot be in the future'
      }),
    
    address: Joi.object({
      street: Joi.string().max(100).optional().allow(''),
      city: Joi.string().max(50).optional().allow(''),
      state: Joi.string().max(50).optional().allow(''),
      zipCode: Joi.string().max(20).optional().allow(''),
      country: Joi.string().max(50).optional().allow('')
    }).optional(),
    
    preferences: Joi.object({
      theme: Joi.string().valid('light', 'dark', 'system').optional(),
      language: Joi.string().min(2).max(5).optional(),
      timezone: Joi.string().optional(),
      emailNotifications: Joi.boolean().optional(),
      pushNotifications: Joi.boolean().optional()
    }).optional(),
    
    socialLinks: Joi.object({
      website: Joi.string().uri().optional().allow(''),
      twitter: Joi.string().optional().allow(''),
      linkedin: Joi.string().uri().optional().allow(''),
      github: Joi.string().optional().allow('')
    }).optional()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required'
      }),
    
    newPassword: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must not exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'New password is required'
      })
  }),

  getUsersQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().max(100).optional(),
    role: Joi.string().valid('USER', 'ADMIN', 'MODERATOR').optional(),
    verified: Joi.boolean().optional(),
    sortBy: Joi.string().valid('createdAt', 'email', 'firstName', 'lastName', 'lastLoginAt').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  updateUserRole: Joi.object({
    role: Joi.string()
      .valid('USER', 'ADMIN', 'MODERATOR')
      .required()
      .messages({
        'any.required': 'Role is required',
        'any.only': 'Role must be one of: USER, ADMIN, MODERATOR'
      })
  }),

  banUser: Joi.object({
    reason: Joi.string().max(500).optional(),
    permanent: Joi.boolean().default(false),
    expiresAt: Joi.date().greater('now').optional()
  })
};