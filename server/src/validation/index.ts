// server/src/validation/index.ts

export { authValidation } from './authValidation';
export { userValidation } from './userValidation';
export { fileValidation } from './fileValidation';
export { debugValidation } from './debugValidation';
export { commonValidation } from './commonValidation';

// Validation middleware factory
export const createValidationMiddleware = (schema: any, target: 'body' | 'query' | 'params' = 'body') => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const details = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        error: {
          code: 'VALIDATION_ERROR',
          details
        }
      });
    }

    req[target] = value;
    next();
  };
};

// Custom validation rules
export const customValidations = {
  // Password strength validation
  strongPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),

  // Username validation
  username: Joi.string()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 30 characters',
      'string.pattern.base': 'Username can only contain letters, numbers, and underscores'
    }),

  // File size validation (in bytes)
  fileSize: (maxSize: number) => Joi.number()
    .integer()
    .min(1)
    .max(maxSize)
    .messages({
      'number.min': 'File cannot be empty',
      'number.max': `File size must not exceed ${Math.round(maxSize / 1024 / 1024)}MB`
    }),

  // URL validation
  url: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .messages({
      'string.uri': 'Please provide a valid URL (http or https)'
    }),

  // Phone number validation
  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),

  // Color hex validation
  hexColor: Joi.string()
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .messages({
      'string.pattern.base': 'Please provide a valid hex color code'
    }),

  // Timezone validation
  timezone: Joi.string()
    .pattern(/^[A-Za-z]+\/[A-Za-z_]+$/)
    .messages({
      'string.pattern.base': 'Please provide a valid timezone'
    })
};