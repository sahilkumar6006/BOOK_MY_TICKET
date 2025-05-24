import { generateToken, verifyToken } from 'authenticator';
import {Router} from 'express';
import {client} from '@repo/db/client'
import jwt from 'jsonwebtoken';
import { SECRET } from '../../config';

const userRouter:Router = Router();

userRouter.post("/signup", (req, res)=> {
        const number = req.body;
        const totp = generateToken(number + "SIGNUP");

      const user =  client.user.upsert({
        where:{
            number,
            name: ''
        },
        create:{
            number,
            name: ''
        },
        update:{
        
        }
    
           
        })
        res.json({
            totp
        })
});


userRouter.post('/signup/verify',async(req,res) => {
    const number = req.body.phoneNumber;
    const name = req.body.name;
    if(!verifyToken(number + "SIGNUP", req.body.otp)) {
        res.json({
            message: "Invalid token"
        })
        return
    }

    const userId = await client.user.update({
        where:{
            number
        },
        data:{
            name,
            verified:true
        }
    })

    const token = jwt.sign({
        userId
    }, SECRET)

    res.json(
        token
    )
})

export {userRouter}