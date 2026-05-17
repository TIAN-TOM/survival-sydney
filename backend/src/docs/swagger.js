// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// OpenAPI document construction and Swagger UI mounting helper.
const jsonContent = (schema, example) => ({
  'application/json': {
    schema,
    ...(example ? { example } : {}),
  },
});

const okDataResponse = (description, dataSchema) => ({
  description,
  content: jsonContent({
    allOf: [
      { $ref: '#/components/schemas/OkEnvelope' },
      {
        type: 'object',
        properties: {
          data: dataSchema,
        },
      },
    ],
  }),
});

const okResponse = (description, dataProperties = {}) =>
  okDataResponse(description, {
    type: 'object',
    properties: dataProperties,
  });

const failResponse = (description) => ({
  description,
  content: jsonContent({ $ref: '#/components/schemas/FailEnvelope' }),
});

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'COMP5347 Quiz API',
    version: '1.0.0',
    description: 'API documentation for the full-stack quiz application.',
  },
  servers: [
    {
      url: '/api',
      description: 'Local API base path',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      OkEnvelope: {
        type: 'object',
        required: ['success', 'data'],
        properties: {
          success: { type: 'boolean', example: true },
          data: { nullable: true },
          meta: { type: 'object', additionalProperties: true },
        },
      },
      FailEnvelope: {
        type: 'object',
        required: ['success', 'error'],
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Request failed' },
          code: { type: 'string', example: 'VALIDATION_ERROR' },
          details: { nullable: true },
          statusCode: { type: 'integer', example: 400 },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          username: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['user', 'admin'] },
        },
      },
      Question: {
        type: 'object',
        required: ['questionText', 'options', 'correctAnswer'],
        properties: {
          _id: { type: 'string' },
          questionText: { type: 'string', example: 'Which stack is used?' },
          options: {
            type: 'array',
            minItems: 4,
            maxItems: 4,
            items: { type: 'string' },
            example: ['MERN', 'LAMP', 'Django', 'Rails'],
          },
          correctAnswer: { type: 'integer', minimum: 0, maximum: 3, example: 0 },
          explanation: { type: 'string', example: 'MongoDB, Express, React, and Node.' },
          active: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      PublicQuestion: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          questionText: { type: 'string' },
          options: {
            type: 'array',
            minItems: 4,
            maxItems: 4,
            items: { type: 'string' },
          },
        },
      },
      QuizAnswerInput: {
        type: 'object',
        required: ['questionId', 'selectedAnswer'],
        properties: {
          questionId: { type: 'string' },
          selectedAnswer: { type: 'integer', minimum: 0, maximum: 3 },
        },
      },
      Attempt: {
        type: 'object',
        properties: {
          score: { type: 'integer' },
          total: { type: 'integer', example: 10 },
          createdAt: { type: 'string', format: 'date-time' },
          review: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                questionId: { type: 'string' },
                questionText: { type: 'string' },
                options: {
                  type: 'array',
                  items: { type: 'string' },
                },
                selectedAnswer: { type: 'integer' },
                correctAnswer: { type: 'integer', nullable: true },
                isCorrect: { type: 'boolean' },
                explanation: { type: 'string', nullable: true },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a player account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                username: 'demo',
                email: 'demo@example.com',
                password: 'Password123'
              }
            }
          }
        },
        responses: {
          201: okResponse('Registered user (sign in to obtain a JWT)', {
            user: { $ref: '#/components/schemas/User' },
            message: { type: 'string' },
          }),
          400: failResponse('Validation failed'),
          409: failResponse('Username or email already exists'),
          429: failResponse('Too many registration attempts. Please wait and try again.')
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Login with username and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                username: 'demo',
                password: 'Password123'
              }
            }
          }
        },
        responses: {
          200: okResponse('JWT token and user profile', {
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
          }),
          400: failResponse('Validation failed'),
          401: failResponse('Invalid credentials'),
          429: failResponse('Too many login attempts. Please wait and try again.')
        }
      }
    },
    '/auth/me': {
      get: {
        summary: 'Return the current authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: okResponse('Current user profile', {
            user: { $ref: '#/components/schemas/User' },
          }),
          401: failResponse('Authentication required'),
        },
      },
    },
    '/quiz/start': {
      get: {
        summary: 'Start a random fixed 10-question quiz',
        security: [{ bearerAuth: [] }],
        responses: {
          200: okDataResponse('Ten active questions without correct answers', {
            type: 'array',
            items: { $ref: '#/components/schemas/PublicQuestion' },
          }),
          401: failResponse('Authentication required'),
          400: failResponse('Not enough active questions'),
          403: failResponse('Admins cannot take quizzes.')
        }
      }
    },
    '/quiz/submit': {
      post: {
        summary: 'Submit quiz answers and persist a score attempt',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['answers'],
                properties: {
                  answers: {
                    type: 'array',
                    minItems: 10,
                    maxItems: 10,
                    items: { $ref: '#/components/schemas/QuizAnswerInput' },
                  },
                },
              },
              example: {
                answers: [
                  { questionId: '507f1f77bcf86cd799439011', selectedAnswer: 0 },
                  { questionId: '507f1f77bcf86cd799439012', selectedAnswer: 1 },
                  { questionId: '507f1f77bcf86cd799439013', selectedAnswer: 2 },
                  { questionId: '507f1f77bcf86cd799439014', selectedAnswer: 3 },
                  { questionId: '507f1f77bcf86cd799439015', selectedAnswer: 0 },
                  { questionId: '507f1f77bcf86cd799439016', selectedAnswer: 1 },
                  { questionId: '507f1f77bcf86cd799439017', selectedAnswer: 2 },
                  { questionId: '507f1f77bcf86cd799439018', selectedAnswer: 3 },
                  { questionId: '507f1f77bcf86cd799439019', selectedAnswer: 0 },
                  { questionId: '507f1f77bcf86cd799439020', selectedAnswer: 1 },
                ]
              }
            }
          }
        },
        responses: {
          200: okResponse('Saved attempt with Review Mode data', {
            scoreId: { type: 'string' },
            score: { type: 'integer' },
            total: { type: 'integer', example: 10 },
            review: { $ref: '#/components/schemas/Attempt/properties/review' },
          }),
          400: failResponse('Invalid answers'),
          401: failResponse('Authentication required'),
          403: failResponse('Admins cannot take quizzes.'),
          429: failResponse('Too many quiz submissions. Please wait and try again.')
        }
      }
    },
    '/quiz/history': {
      get: {
        summary: 'List current user quiz attempts',
        security: [{ bearerAuth: [] }],
        responses: {
          200: okDataResponse('Past attempts', {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                score: { type: 'integer' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          }),
          401: failResponse('Authentication required'),
          403: failResponse('Admins cannot take quizzes.')
        }
      }
    },
    '/quiz/history/{id}': {
      get: {
        summary: 'Load one completed attempt for Review Mode',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: okDataResponse('Review-ready attempt', { $ref: '#/components/schemas/Attempt' }),
          401: failResponse('Authentication required'),
          403: failResponse('Admins cannot take quizzes.'),
          404: failResponse('Attempt not found')
        }
      }
    },
    '/quiz/leaderboard': {
      get: {
        summary: 'Best-per-user leaderboard',
        description:
          'Returns up to 50 leaderboard rows for authenticated player users (best score per user, highest first). Ties use the earliest attempt that achieved that best score. Admin users are blocked from player quiz routes.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: okDataResponse('Leaderboard rows sorted by best score', {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                username: { type: 'string' },
                bestScore: { type: 'integer' },
                bestAchievedAt: { type: 'string', format: 'date-time' },
              },
            },
          }),
          401: failResponse('Authentication required'),
          403: failResponse('Admins cannot take quizzes.')
        }
      }
    },
    '/admin/questions': {
      get: {
        summary: 'List questions',
        security: [{ bearerAuth: [] }],
        responses: {
          200: okDataResponse('Question bank', {
            type: 'array',
            items: { $ref: '#/components/schemas/Question' },
          }),
          401: failResponse('Authentication required'),
          403: failResponse('Admin access required')
        }
      },
      post: {
        summary: 'Create a question',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: jsonContent({ $ref: '#/components/schemas/Question' }, {
            questionText: 'Which stack is used?',
            options: ['MERN', 'LAMP', 'Django', 'Rails'],
            correctAnswer: 0,
            explanation: 'The assignment uses MongoDB, Express, React, and Node.',
            active: true,
          }),
        },
        responses: {
          201: okDataResponse('Created question', { $ref: '#/components/schemas/Question' }),
          400: failResponse('Validation failed'),
          401: failResponse('Authentication required'),
          403: failResponse('Admin access required')
        }
      }
    },
    '/admin/questions/{id}': {
      put: {
        summary: 'Update a question',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: jsonContent({ $ref: '#/components/schemas/Question' }),
        },
        responses: {
          200: okDataResponse('Updated question', { $ref: '#/components/schemas/Question' }),
          400: failResponse('Validation failed'),
          401: failResponse('Authentication required'),
          403: failResponse('Admin access required'),
          404: failResponse('Question not found')
        }
      },
      delete: {
        summary: 'Delete a question',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: okResponse('Deleted question', {
            deletedId: { type: 'string' },
          }),
          401: failResponse('Authentication required'),
          403: failResponse('Admin access required'),
          404: failResponse('Question not found')
        }
      }
    },
    '/admin/questions/{id}/toggle': {
      patch: {
        summary: 'Toggle active/inactive state',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: okDataResponse('Question active state toggled', { $ref: '#/components/schemas/Question' }),
          401: failResponse('Authentication required'),
          403: failResponse('Admin access required'),
          404: failResponse('Question not found')
        }
      }
    },
    '/admin/questions/bulk-import': {
      post: {
        summary: 'Bulk import question JSON array',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: jsonContent({
            type: 'object',
            required: ['questions'],
            properties: {
              questions: {
                type: 'array',
                minItems: 1,
                items: { $ref: '#/components/schemas/Question' },
              },
            },
          }),
        },
        responses: {
          201: okResponse('Inserted questions', {
            insertedCount: { type: 'integer' },
            questions: {
              type: 'array',
              items: { $ref: '#/components/schemas/Question' },
            },
          }),
          400: failResponse('Index-specific validation errors'),
          401: failResponse('Authentication required'),
          403: failResponse('Admin access required')
        }
      }
    }
  },
};

function buildSwaggerSpec() {
  let swaggerJsdoc;

  try {
    swaggerJsdoc = require('swagger-jsdoc');
  } catch (error) {
    return { ...swaggerDefinition };
  }

  return swaggerJsdoc({
    definition: swaggerDefinition,
    apis: ['./src/routes/*.js', './src/controllers/*.js', './src/models/*.js'],
  });
}

function setupSwagger(app) {
  let swaggerUi;

  try {
    swaggerUi = require('swagger-ui-express');
  } catch (error) {
    throw new Error('Swagger setup requires the swagger-ui-express package.');
  }

  const swaggerSpec = buildSwaggerSpec();
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  return swaggerSpec;
}

const swaggerSpec = buildSwaggerSpec();

Object.defineProperties(swaggerSpec, {
  swaggerDefinition: {
    value: swaggerDefinition,
  },
  buildSwaggerSpec: {
    value: buildSwaggerSpec,
  },
  setupSwagger: {
    value: setupSwagger,
  },
});

module.exports = swaggerSpec;
