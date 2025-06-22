import { Router } from 'express';
import { TestRouter } from '../test';
import { userRouter } from './user/user';
import adminRouter from './admin';
import locaton from './admin/location'
import booking from './user/booking';
import transcation from './user/transcation';

const mainRouter: Router = Router();

// Public routes
mainRouter.use('/user', userRouter);
mainRouter.use('/user/events', booking);
mainRouter.use('/admin', adminRouter);
mainRouter.use('/location', locaton)
mainRouter.use('/user/bookings', userRouter)
mainRouter.use('/superadmin', adminRouter);
mainRouter.use('user/transcations', transcation);

// Test routes (development only)
if (process.env.NODE_ENV !== "production") {
    mainRouter.use("/test", TestRouter);
}

export { mainRouter }