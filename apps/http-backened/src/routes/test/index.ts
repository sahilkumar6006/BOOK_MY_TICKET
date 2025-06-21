import { Router, Request, Response } from 'express';

const TestRouter:Router = Router();

// Example test route: create a test admin user
TestRouter.post('/create-admin', (req: Request, res: Response) => {
  // In a real app, you would add logic to create an admin user in your database.
  // For demonstration, we just return a success message.
  res.json({
    message: 'Test admin user created successfully!',
    // You can echo back test data if you want
    data: req.body,
  });
});

// Add more test endpoints as needed
TestRouter.get('/ping', (req: Request, res: Response) => {
  res.json({ message: 'pong', env: process.env.NODE_ENV });
});

export { TestRouter };
