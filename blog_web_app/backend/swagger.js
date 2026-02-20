const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MOR Blog API',
      version: '1.0.0',
      description: 'API documentation for the MOR Blog Web Application. Includes authentication, blog CRUD, AI agent integration, and social features.',
      contact: {
        name: 'Lucky Chauhan',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from the /api/auth/login endpoint.',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '60d0fe4f5311236168a109ca' },
            username: { type: 'string', example: 'johndoe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            role: { type: 'string', enum: ['admin', 'editor'], example: 'editor' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
            token: { type: 'string', description: 'JWT token for authentication' },
          },
        },
        Blog: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string', example: 'Introduction to AI' },
            slug: { type: 'string', example: 'introduction-to-ai' },
            content: { type: 'string', example: '<p>Full blog content in HTML...</p>' },
            summary: { type: 'string', example: 'A brief overview of artificial intelligence.' },
            author: { type: 'string', example: 'AI Blog Agent' },
            categories: { type: 'array', items: { type: 'string' }, example: ['AI', 'Technology'] },
            isAgentGenerated: { type: 'boolean', example: true },
            bannerImage: { type: 'string', example: 'https://example.com/banner.jpg' },
            date: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Comment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            blog: { type: 'string', description: 'Blog ObjectId' },
            user: { type: 'string', description: 'User ObjectId' },
            username: { type: 'string' },
            text: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AgentStatus: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['idle', 'running', 'completed', 'error'], example: 'idle' },
            node: { type: 'string', example: '' },
            topic: { type: 'string', example: '' },
            lastUpdate: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        BlogStats: {
          type: 'object',
          properties: {
            totalBlogs: { type: 'integer', example: 42 },
            detailedStats: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  title: { type: 'string' },
                  likes: { type: 'integer' },
                  dislikes: { type: 'integer' },
                  comments: { type: 'integer' },
                },
              },
            },
          },
        },
        UserActivity: {
          type: 'object',
          properties: {
            ownPosts: { type: 'array', items: { $ref: '#/components/schemas/Blog' } },
            likedPosts: { type: 'array', items: { $ref: '#/components/schemas/Blog' } },
            dislikedPosts: { type: 'array', items: { $ref: '#/components/schemas/Blog' } },
            userComments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  blogTitle: { type: 'string' },
                  blogSlug: { type: 'string' },
                  comments: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string' },
                        text: { type: 'string' },
                        date: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'User registration and login' },
      { name: 'Blogs', description: 'Blog CRUD operations' },
      { name: 'Social', description: 'Likes, dislikes, and comments' },
      { name: 'AI Agent', description: 'Agent blog generation and status' },
      { name: 'Admin', description: 'Admin-only dashboard endpoints' },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
