import { Router, Request, Response } from 'express';

const TestRouter:Router = Router();

TestRouter.post('/create-admin', (req: Request, res: Response) => {
  res.json({
    message: 'Test admin user created successfully!',
    data: req.body,
  });
});

TestRouter.get('/ping', (req: Request, res: Response) => {
  res.json({ message: 'pong', env: process.env.NODE_ENV });
});

export { TestRouter };
