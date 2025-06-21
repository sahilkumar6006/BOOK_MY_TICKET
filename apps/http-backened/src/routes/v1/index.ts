import { Router } from 'express';
import { TestRouter } from '../test';
import { userRouter } from './user';
import adminRouter from './admin';
import locaton from './admin/location'

const mainRouter: Router = Router();

// Public routes
mainRouter.use('/user', userRouter);
mainRouter.use('/admin', adminRouter);
mainRouter.use('/location', locaton)

// Test routes (development only)
if (process.env.NODE_ENV !== "production") {
    mainRouter.use("/test", TestRouter);
}

export { mainRouter }