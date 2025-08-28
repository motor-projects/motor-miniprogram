const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '摩托车性能数据库 API',
      version: '1.0.0',
      description: '一个完整的摩托车信息管理系统API',
      contact: {
        name: 'API支持',
        email: 'support@motorcycledb.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000/api',
        description: '开发服务器'
      },
      {
        url: 'https://api.motorcycledb.com/api',
        description: '生产服务器'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: '错误信息'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Motorcycle: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            brand: {
              type: 'string',
              example: '雅马哈'
            },
            model: {
              type: 'string',
              example: 'YZF-R6'
            },
            year: {
              type: 'number',
              example: 2023
            },
            category: {
              type: 'string',
              enum: ['街车', '跑车', '巡航', '越野', '踏板', '复古', '旅行', '竞技'],
              example: '跑车'
            },
            price: {
              type: 'object',
              properties: {
                msrp: {
                  type: 'number',
                  example: 120000
                },
                currency: {
                  type: 'string',
                  example: 'CNY'
                }
              }
            },
            engine: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  example: '四缸'
                },
                displacement: {
                  type: 'number',
                  example: 599
                },
                cooling: {
                  type: 'string',
                  example: '水冷'
                },
                fuelSystem: {
                  type: 'string',
                  example: '电喷'
                }
              }
            },
            performance: {
              type: 'object',
              properties: {
                power: {
                  type: 'object',
                  properties: {
                    hp: {
                      type: 'number',
                      example: 118
                    },
                    kw: {
                      type: 'number',
                      example: 88
                    },
                    rpm: {
                      type: 'number',
                      example: 14500
                    }
                  }
                },
                torque: {
                  type: 'object',
                  properties: {
                    nm: {
                      type: 'number',
                      example: 61.7
                    },
                    rpm: {
                      type: 'number',
                      example: 10500
                    }
                  }
                },
                topSpeed: {
                  type: 'number',
                  example: 262
                }
              }
            },
            rating: {
              type: 'object',
              properties: {
                overall: {
                  type: 'number',
                  minimum: 0,
                  maximum: 5,
                  example: 4.5
                },
                reviews: {
                  type: 'number',
                  example: 25
                }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            username: {
              type: 'string',
              example: 'motorcyclelover'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'moderator'],
              example: 'user'
            },
            profile: {
              type: 'object',
              properties: {
                firstName: {
                  type: 'string',
                  example: '张'
                },
                lastName: {
                  type: 'string',
                  example: '三'
                },
                avatar: {
                  type: 'string',
                  example: 'https://example.com/avatar.jpg'
                }
              }
            },
            emailVerified: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Review: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            user: {
              $ref: '#/components/schemas/User'
            },
            motorcycle: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            title: {
              type: 'string',
              example: '出色的性能表现'
            },
            content: {
              type: 'string',
              example: '这款摩托车的性能表现非常出色，动力充沛...'
            },
            rating: {
              type: 'object',
              properties: {
                overall: {
                  type: 'number',
                  minimum: 1,
                  maximum: 5,
                  example: 5
                },
                performance: {
                  type: 'number',
                  minimum: 1,
                  maximum: 5,
                  example: 5
                },
                comfort: {
                  type: 'number',
                  minimum: 1,
                  maximum: 5,
                  example: 4
                }
              }
            },
            status: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected', 'flagged'],
              example: 'approved'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            currentPage: {
              type: 'number',
              example: 1
            },
            totalPages: {
              type: 'number',
              example: 10
            },
            totalItems: {
              type: 'number',
              example: 100
            },
            hasNext: {
              type: 'boolean',
              example: true
            },
            hasPrev: {
              type: 'boolean',
              example: false
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js'], // 指向路由文件
};

const specs = swaggerJsdoc(options);

const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin-bottom: 50px }
  `,
  customSiteTitle: '摩托车数据库 API 文档',
  customfavIcon: '/favicon.ico'
};

module.exports = {
  specs,
  swaggerUi,
  swaggerOptions
};