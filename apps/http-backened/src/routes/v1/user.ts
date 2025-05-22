import { generateToken } from 'authenticator';
import {Router} from 'express';

const userRouter:Router = Router();

userRouter.post("/signup", (req, res)=> {
        const phoneNumber = req.body;
        const totp = generateToken(phoneNumber + "SIGNUP");

        res.json({
            totp
        })
});


userRouter.post('/signup/verify',(req,res) => {

})

export {userRouter}