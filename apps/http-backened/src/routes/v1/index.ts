import {Router} from 'express';
import { TestRouter } from '../test';
import {userRouter} from './user';
const mainRouter: Router = Router();

mainRouter.use('/user', userRouter);


if (process.env.NODE_ENV !== "production") {
    mainRouter.use("/test", TestRouter);
}

export {mainRouter}