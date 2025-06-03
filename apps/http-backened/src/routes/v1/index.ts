import {Router} from 'express';
import {userRouter} from './user'
const mainRouter: Router = Router();

mainRouter.use('/user', userRouter);


if (process.env.NODE_ENV !== "production") {
    // Used only for testing, should never be deployed to prod.
    // Lets the tester create admins etc
    mainRouter.use("/test", testRouter);
}

export {mainRouter}