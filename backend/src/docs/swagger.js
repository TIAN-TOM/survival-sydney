// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// OpenAPI document construction and Swagger UI mounting helper.
const jsonContent = (schema, example) => ({
  'application/json': {
    schema,
    ...(example ? { example } : {}),
  },
});

const okResponse = (description, dataProperties = {}) => ({
  description,
  content: jsonContent({
    allOf: [
      { $ref: '#/components/schemas/OkEnvelope' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: dataProperties,
          },
        },
      },
    ],
  }),
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
        required: ['text', 'options', 'correctAnswer'],
        properties: {
          id: { type: 'string' },
          text: { type: 'string', example: 'Which stack is used?' },
          options: {
            type: 'array',
            minItems: 4,
            maxItems: 4,
            items: { type: 'string' },
            example: ['MERN', 'LAMP', 'Django', 'Rails'],
          },
          correctAnswer: { type: 'string', example: 'MERN' },
          topic: { type: 'string', example: 'API Contracts' },
          difficulty: {
            type: 'string',
            enum: ['foundation', 'application', 'analysis'],
            example: 'application',
          },
          explanation: { type: 'string', example: 'MongoDB, Express, React, and Node.' },
          active: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      PublicQuestion: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          text: { type: 'string' },
          options: {
            type: 'array',
            minItems: 4,
            maxItems: 4,
            items: { type: 'string' },
          },
          topic: { type: 'string', example: 'API Contracts' },
          difficulty: {
            type: 'string',
            enum: ['foundation', 'application', 'analysis'],
            example: 'application',
          },
        },
      },
      QuizAnswerInput: {
        type: 'object',
        required: ['questionId', 'selectedAnswer'],
        properties: {
          questionId: { type: 'string' },
          selectedAnswer: { type: 'string' },
        },
      },
      Attempt: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          username: { type: 'string', nullable: true },
          score: { type: 'integer' },
          totalQuestions: { type: 'integer', example: 10 },
          submittedAt: { type: 'string', format: 'date-time' },
          answers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                questionId: { type: 'string' },
                question: { $ref: '#/components/schemas/Question' },
                selectedAnswer: { type: 'string' },
                correctAnswer: { type: 'string' },
                isCorrect: { type: 'boolean' },
                explanation: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
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
          201: okResponse('Registered user and JWT token', {
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
          }),
          400: failResponse('Validation failed'),
          409: failResponse('Username or email already exists'),
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
          401: failResponse('Invalid credentials')
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
        summary: 'Start a balanced fixed 10-question quiz',
        security: [{ bearerAuth: [] }],
        responses: {
          200: okResponse('Session ID and balanced active questions without correct answers', {
            sessionId: { type: 'string', format: 'uuid' },
            quizLength: { type: 'integer', example: 10 },
            totalQuestions: { type: 'integer', example: 10 },
            questions: {
              type: 'array',
              items: { $ref: '#/components/schemas/PublicQuestion' },
            },
          }),
          401: failResponse('Authentication required'),
          409: failResponse('Not enough active questions')
        }
      }
    },
    '/quiz/submit': {
      post: {
        summary: 'Submit quiz session answers and persist a score attempt',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sessionId', 'answers'],
                properties: {
                  sessionId: { type: 'string', format: 'uuid' },
                  answers: {
                    type: 'array',
                    minItems: 10,
                    maxItems: 10,
                    items: { $ref: '#/components/schemas/QuizAnswerInput' },
                  },
                },
              },
              example: {
                sessionId: '11111111-1111-4111-8111-111111111111',
                answers: [
                  { questionId: '507f1f77bcf86cd799439011', selectedAnswer: 'POST' },
                  { questionId: '507f1f77bcf86cd799439012', selectedAnswer: 'GET' },
                  { questionId: '507f1f77bcf86cd799439013', selectedAnswer: 'PUT' },
                  { questionId: '507f1f77bcf86cd799439014', selectedAnswer: 'PATCH' },
                  { questionId: '507f1f77bcf86cd799439015', selectedAnswer: 'DELETE' },
                  { questionId: '507f1f77bcf86cd799439016', selectedAnswer: 'React' },
                  { questionId: '507f1f77bcf86cd799439017', selectedAnswer: 'Express' },
                  { questionId: '507f1f77bcf86cd799439018', selectedAnswer: 'MongoDB' },
                  { questionId: '507f1f77bcf86cd799439019', selectedAnswer: 'JWT' },
                  { questionId: '507f1f77bcf86cd799439020', selectedAnswer: 'Zod' },
                ]
              }
            }
          }
        },
        responses: {
          201: okResponse('Saved attempt with populated Review Mode data', {
            attemptId: { type: 'string' },
            score: { type: 'integer' },
            totalQuestions: { type: 'integer', example: 10 },
            attempt: { $ref: '#/components/schemas/Attempt' },
          }),
          400: failResponse('Invalid answers'),
          401: failResponse('Authentication required'),
          409: failResponse('Session expired or already submitted')
        }
      }
    },
    '/quiz/history': {
      get: {
        summary: 'List current user quiz attempts',
        security: [{ bearerAuth: [] }],
        responses: {
          200: okResponse('Past attempts with populated answer data', {
            attempts: {
              type: 'array',
              items: { $ref: '#/components/schemas/Attempt' },
            },
          }),
          401: failResponse('Authentication required')
        }
      }
    },
    '/quiz/review/{attemptId}': {
      get: {
        summary: 'Load one completed attempt for Review Mode',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'attemptId',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: okResponse('Review-ready attempt', {
            attempt: { $ref: '#/components/schemas/Attempt' },
          }),
          401: failResponse('Authentication required'),
          404: failResponse('Attempt not found')
        }
      }
    },
    '/quiz/leaderboard': {
      get: {
        summary: 'Best-per-user leaderboard',
        responses: {
          200: okResponse('Leaderboard rows sorted by best score', {
            leaderboard: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  rank: { type: 'integer' },
                  userId: { type: 'string' },
                  username: { type: 'string' },
                  score: { type: 'integer' },
                  totalQuestions: { type: 'integer' },
                  attemptId: { type: 'string' },
                  submittedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          })
        }
      }
    },
    '/admin/questions': {
      get: {
        summary: 'List questions',
        security: [{ bearerAuth: [] }],
        responses: {
          200: okResponse('Question bank', {
            questions: {
              type: 'array',
              items: { $ref: '#/components/schemas/Question' },
            },
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
            text: 'Which stack is used?',
            options: ['MERN', 'LAMP', 'Django', 'Rails'],
            correctAnswer: 'MERN',
            topic: 'Setup & Delivery',
            difficulty: 'foundation',
            explanation: 'The assignment uses MongoDB, Express, React, and Node.',
            active: true,
          }),
        },
        responses: {
          201: okResponse('Created question', {
            question: { $ref: '#/components/schemas/Question' },
          }),
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
          200: okResponse('Updated question', {
            question: { $ref: '#/components/schemas/Question' },
          }),
          400: failResponse('Validation failed'),
          401: failResponse('Authentication required'),
          403: failResponse('Admin access required'),
          404: failResponse('Question not found')
        }
      },
      patch: {
        summary: 'Partially update a question',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: jsonContent({ $ref: '#/components/schemas/Question' }),
        },
        responses: {
          200: okResponse('Updated question', {
            question: { $ref: '#/components/schemas/Question' },
          }),
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
            question: { $ref: '#/components/schemas/Question' },
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
        requestBody: {
          required: false,
          content: jsonContent({
            type: 'object',
            properties: {
              active: { type: 'boolean' },
            },
            additionalProperties: false,
          }, { active: false }),
        },
        responses: {
          200: okResponse('Question active state updated', {
            question: { $ref: '#/components/schemas/Question' },
          }),
          400: failResponse('Validation failed'),
          401: failResponse('Authentication required'),
          403: failResponse('Admin access required'),
          404: failResponse('Question not found')
        }
      }
    },
    '/admin/bulk-import': {
      post: {
        summary: 'Bulk import question JSON array',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: jsonContent({
            type: 'array',
            minItems: 1,
            maxItems: 100,
            items: { $ref: '#/components/schemas/Question' },
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
