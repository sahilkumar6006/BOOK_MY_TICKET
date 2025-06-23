import { Express, Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';

export const setupSwagger = (app: Express) => {
    // Define the OpenAPI specification
    const swaggerDefinition = {
        openapi: '3.0.0',
        info: {
            title: 'Book My Ticket API',
            version: '1.0.0',
            description: 'API documentation for Book My Ticket application',
            contact: {
                name: 'API Support',
                email: 'support@bookmyticket.com'
            },
        },
        servers: [
            {
                url: 'http://localhost:3000/api/v1',
                description: 'Development server',
            },
            {
                url: 'https://book-my-ticket-8i4jfc1my-sahilkumar6006s-projects.vercel.app/api/v1',
                description: 'Production server',
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
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        number: { type: 'string' },
                        state: { type: 'string' },
                        role: { type: 'string', enum: ['USER', 'ADMIN', 'SUPER_ADMIN'] },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Event: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        date: { type: 'string', format: 'date-time' },
                        location: { type: 'string' },
                        availableSeats: { type: 'integer' },
                        price: { type: 'number' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Booking: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        userId: { type: 'string' },
                        eventId: { type: 'string' },
                        seats: { type: 'integer' },
                        totalPrice: { type: 'number' },
                        status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'CANCELLED'] },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                }
            },
            responses: {
                UnauthorizedError: {
                    description: 'Access token is missing or invalid',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    status: { type: 'string' },
                                    message: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                BadRequest: {
                    description: 'Bad Request',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    status: { type: 'string' },
                                    message: { type: 'string' },
                                    errors: { type: 'array', items: { type: 'string' } }
                                }
                            }
                        }
                    }
                },
                NotFound: {
                    description: 'Not Found',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    status: { type: 'string' },
                                    message: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ],
        tags: [
            {
                name: 'Authentication',
                description: 'User authentication endpoints'
            },
            {
                name: 'User',
                description: 'User operations (events, bookings, profile)'
            },
            {
                name: 'Admin',
                description: 'Admin operations (manage events, locations)'
            },
            {
                name: 'Super Admin',
                description: 'Super admin operations (manage admins, events)'
            },
            {
                name: 'Razorpay',
                description: 'Payment processing endpoints'
            }
        ],
        paths: {
            // Authentication endpoints
            '/auth/signup': {
                post: {
                    tags: ['Authentication'],
                    summary: 'User signup',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        email: { type: 'string', format: 'email' },
                                        password: { type: 'string', format: 'password' },
                                        number: { type: 'string' },
                                        state: { type: 'string' }
                                    },
                                    required: ['name', 'email', 'password', 'number', 'state']
                                }
                            }
                        }
                    },
                    responses: {
                        201: { description: 'User registered successfully' },
                        400: { $ref: '#/components/responses/BadRequest' },
                        409: { description: 'User already exists' }
                    }
                }
            },
            '/auth/verify': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Verify user email/phone',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        email: { type: 'string', format: 'email' },
                                        otp: { type: 'string' }
                                    },
                                    required: ['email', 'otp']
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Verification successful' },
                        400: { $ref: '#/components/responses/BadRequest' },
                        401: { $ref: '#/components/responses/UnauthorizedError' }
                    }
                }
            },
            '/auth/signin': {
                post: {
                    tags: ['Authentication'],
                    summary: 'User signin',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        email: { type: 'string', format: 'email' },
                                        password: { type: 'string', format: 'password' }
                                    },
                                    required: ['email', 'password']
                                }
                            }
                        }
                    },
                    responses: {
                        200: { 
                            description: 'Signin successful',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            token: { type: 'string' },
                                            user: { $ref: '#/components/schemas/User' }
                                        }
                                    }
                                }
                            }
                        },
                        401: { $ref: '#/components/responses/UnauthorizedError' }
                    }
                }
            },
            
            // User endpoints
            '/user/profile': {
                get: {
                    tags: ['User'],
                    summary: 'Get user profile',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'User profile retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/User'
                                    }
                                }
                            }
                        },
                        401: { $ref: '#/components/responses/UnauthorizedError' }
                    }
                }
            },
            
            // Admin endpoints
            '/admin/events': {
                get: {
                    tags: ['Admin'],
                    summary: 'Get all events (Admin)',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'List of events',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Event' }
                                    }
                                }
                            }
                        },
                        401: { $ref: '#/components/responses/UnauthorizedError' },
                        403: { description: 'Forbidden - Admin access required' }
                    }
                },
                post: {
                    tags: ['Admin'],
                    summary: 'Create new event (Admin)',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        title: { type: 'string' },
                                        description: { type: 'string' },
                                        date: { type: 'string', format: 'date-time' },
                                        location: { type: 'string' },
                                        availableSeats: { type: 'integer' },
                                        price: { type: 'number' }
                                    },
                                    required: ['title', 'date', 'location', 'availableSeats', 'price']
                                }
                            }
                        }
                    },
                    responses: {
                        201: { description: 'Event created successfully' },
                        400: { $ref: '#/components/responses/BadRequest' },
                        401: { $ref: '#/components/responses/UnauthorizedError' },
                        403: { description: 'Forbidden - Admin access required' }
                    }
                }
            },
            
            // Super Admin endpoints
            '/superadmin/admins': {
                get: {
                    tags: ['Super Admin'],
                    summary: 'Get all admins (Super Admin)',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'List of admins',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/User' }
                                    }
                                }
                            }
                        },
                        401: { $ref: '#/components/responses/UnauthorizedError' },
                        403: { description: 'Forbidden - Super Admin access required' }
                    }
                },
                post: {
                    tags: ['Super Admin'],
                    summary: 'Create new admin (Super Admin)',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        email: { type: 'string', format: 'email' },
                                        name: { type: 'string' },
                                        password: { type: 'string', format: 'password' }
                                    },
                                    required: ['email', 'name', 'password']
                                }
                            }
                        }
                    },
                    responses: {
                        201: { description: 'Admin created successfully' },
                        400: { $ref: '#/components/responses/BadRequest' },
                        401: { $ref: '#/components/responses/UnauthorizedError' },
                        403: { description: 'Forbidden - Super Admin access required' }
                    }
                }
            },
            
            // Razorpay endpoints
            '/razorpay/create-order': {
                post: {
                    tags: ['Razorpay'],
                    summary: 'Create Razorpay order',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        amount: { type: 'number' },
                                        currency: { type: 'string', default: 'INR' },
                                        receipt: { type: 'string' }
                                    },
                                    required: ['amount']
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Order created successfully' },
                        400: { $ref: '#/components/responses/BadRequest' },
                        401: { $ref: '#/components/responses/UnauthorizedError' }
                    }
                }
            }
        }
    };

    // Generate the Swagger specification
    const specs = swaggerJsdoc({
        swaggerDefinition,
        apis: ['./src/routes/**/*.ts']
    });

    // Serve Swagger UI
    app.get('/api-docs', (req: Request, res: Response) => {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Book My Ticket API</title>
                <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css">
                <style>
                    .swagger-ui .topbar { display: none; }
                    .swagger-ui { margin: 20px; }
                    body { margin: 0; }
                </style>
            </head>
            <body>
                <div id="swagger-ui"></div>
                <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js"></script>
                <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-standalone-preset.js"></script>
                <script>
                    window.onload = function() {
                        window.ui = SwaggerUIBundle({
                            url: '/api-docs.json',
                            dom_id: '#swagger-ui',
                            presets: [
                                SwaggerUIBundle.presets.apis,
                                SwaggerUIStandalonePreset
                            ],
                            layout: "StandaloneLayout"
                        });
                    };
                </script>
            </body>
            </html>
        `);
    });

    // Serve the JSON spec
    app.get('/api-docs.json', (req: Request, res: Response) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(specs);
    });

    // Redirect root to API docs
    app.get('/', (req: Request, res: Response) => {
        res.redirect('/api-docs');
    });
};
