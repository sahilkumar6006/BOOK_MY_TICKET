import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

export const setupSwagger = (app: Express) => {
    const options = {
        definition: {
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
            },
            security: [
                {
                    bearerAuth: [],
                },
            ],
        },
        apis: [
            './src/routes/**/*.ts',
            './src/routes/**/*.js',
            './dist/routes/**/*.js',
        ],
    };

    const specs = swaggerJsdoc(options);
    
    // Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Book My Ticket API Documentation',
    }));

    // JSON endpoint
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(specs);
    });
};
