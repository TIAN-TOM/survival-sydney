// OpenAPI document construction and Swagger UI mounting helper.
import type { Express } from 'express';
import { API_TITLE, API_DESCRIPTION } from '../config/brand';

type SwaggerSpec = Record<string, unknown>;

const jsonContent = (schema: object, example?: object) => ({
  'application/json': {
    schema,
    ...(example ? { example } : {}),
  },
});

const okDataResponse = (description: string, dataSchema: object) => ({
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

const okResponse = (description: string, dataProperties: object = {}) =>
  okDataResponse(description, {
    type: 'object',
    properties: dataProperties,
  });

const failResponse = (description: string) => ({
  description,
  content: jsonContent({ $ref: '#/components/schemas/FailEnvelope' }),
});

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: API_TITLE,
    version: '1.0.0',
    description: API_DESCRIPTION,
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
        additionalProperties: false,
        properties: {
          success: { type: 'boolean', example: true },
          data: { nullable: true },
        },
      },
      FailEnvelope: {
        type: 'object',
        required: ['success', 'error'],
        additionalProperties: false,
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Request failed' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          username: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['user', 'admin'] },
          createdAt: { type: 'string', format: 'date-time' },
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
          topic: { type: 'string', example: 'general' },
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
          topic: { type: 'string', example: 'general' },
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
                topic: { type: 'string', example: 'general' },
                optionOrder: {
                  type: 'array',
                  description: 'Original option indexes in the order shown during the attempt.',
                  minItems: 4,
                  maxItems: 4,
                  items: { type: 'integer', minimum: 0, maximum: 3 },
                },
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
          200: okDataResponse('Attempt token and ten active questions without correct answers', {
            type: 'object',
            required: ['attemptToken', 'questions'],
            properties: {
              attemptToken: {
                type: 'string',
                description:
                  'Signed short-lived attempt token that carries the per-attempt option order.',
              },
              questions: {
                type: 'array',
                minItems: 10,
                maxItems: 10,
                items: { $ref: '#/components/schemas/PublicQuestion' },
              },
            },
          }),
          401: failResponse('Authentication required'),
          400: failResponse('Not enough active questions'),
          403: failResponse('Admins cannot take quizzes.')
        }
      }
    },
    '/quiz/answer': {
      post: {
        summary: 'Lock one answer server-side (per-question lock)',
        description:
          'Locks the selected answer for a single question. Questions must be answered in order, and a locked answer can never be changed.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['attemptToken', 'questionId', 'selectedAnswer'],
                properties: {
                  attemptToken: {
                    type: 'string',
                    description: 'Token returned by GET /quiz/start.',
                  },
                  questionId: { type: 'string' },
                  selectedAnswer: {
                    type: 'integer',
                    minimum: 0,
                    maximum: 3,
                    description: 'Displayed (shuffled) option index the player chose.',
                  },
                },
              },
              example: {
                attemptToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                questionId: '507f1f77bcf86cd799439011',
                selectedAnswer: 2,
              },
            },
          },
        },
        responses: {
          200: okResponse('Answer locked', {
            locked: { type: 'boolean', example: true },
            answered: { type: 'integer', example: 1 },
            total: { type: 'integer', example: 10 },
          }),
          400: failResponse('Invalid answer, or question not part of this attempt'),
          401: failResponse('Authentication required or attempt token invalid/expired/wrong user'),
          404: failResponse('Attempt not found or expired'),
          409: failResponse('Question already answered, out of order, or attempt already submitted'),
          403: failResponse('Admins cannot take quizzes.'),
          429: failResponse('Too many answers. Please wait and try again.'),
        },
      },
    },
    '/quiz/submit': {
      post: {
        summary: 'Finalise the attempt and score the server-locked answers',
        description:
          'Scores the answers already locked one at a time via POST /quiz/answer. The client sends no answers here.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['attemptToken'],
                properties: {
                  attemptToken: {
                    type: 'string',
                    description: 'Token returned by GET /quiz/start.',
                  },
                },
              },
              example: {
                attemptToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
            },
          },
        },
        responses: {
          200: okResponse('Saved attempt with Review Mode data', {
            scoreId: { type: 'string' },
            score: { type: 'integer' },
            total: { type: 'integer', example: 10 },
            review: { $ref: '#/components/schemas/Attempt/properties/review' },
          }),
          400: failResponse('Not all questions answered'),
          401: failResponse('Authentication required or attempt token invalid/expired/wrong user'),
          404: failResponse('Attempt not found or expired'),
          409: failResponse('Attempt already submitted'),
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
                totalQuestions: { type: 'integer', example: 10 },
                topics: {
                  type: 'array',
                  items: { type: 'string' },
                },
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
            topic: 'general',
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

function buildSwaggerSpec(): SwaggerSpec {
  let swaggerJsdoc: typeof import('swagger-jsdoc');

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- runtime lookup keeps the raw definition usable when swagger-jsdoc is absent.
    swaggerJsdoc = require('swagger-jsdoc');
  } catch {
    return { ...swaggerDefinition };
  }

  // @types/swagger-jsdoc declares a bare `object` return; the built document is a plain JSON spec.
  return swaggerJsdoc({
    definition: swaggerDefinition,
    apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/models/*.ts'],
  }) as SwaggerSpec;
}

function setupSwagger(app: Express): SwaggerSpec {
  let swaggerUi: typeof import('swagger-ui-express');

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- mirrors the optional-dependency handling in buildSwaggerSpec.
    swaggerUi = require('swagger-ui-express');
  } catch {
    throw new Error('Swagger setup requires the swagger-ui-express package.');
  }

  const swaggerSpec = buildSwaggerSpec();
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  return swaggerSpec;
}

const swaggerSpec = buildSwaggerSpec();

export default swaggerSpec;
export { swaggerDefinition, buildSwaggerSpec, setupSwagger };
