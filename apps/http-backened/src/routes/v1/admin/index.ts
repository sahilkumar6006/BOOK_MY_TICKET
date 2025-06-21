import { Router, Request, Response } from 'express';
import { generateToken, verifyToken } from 'authenticator';
import jwt from 'jsonwebtoken';
import { client } from '@repo/db/client';
import { TOPT_SECRET, ADMIN_JWT_PASSWORD } from '../../../config';
import eventsRouter from './events';

// Extend the Express Request type to include userId
declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

const adminRouter: Router = Router();

// Mount the events router
adminRouter.use('/events', eventsRouter);

interface SignupRequest extends Request {
    body: {
        number: string;
    };
}

interface SigninRequest extends Request {
    body: {
        number: string;
    };
}

interface VerifySigninRequest extends Request {
    body: {
        number: string;
        otp: string;
    };
}

interface VerifyRequest extends Request {
    body: {
        number: string;
        name: string;
        email: string;
        state: string;
        otp: string;
    };
}

adminRouter.post('/signup', (async (req: SignupRequest, res: Response) => {
    const { number } = req.body;
    if (!number) {
        res.status(400).json({ message: "Phone number is required" });
        return;
    }

    const otp = process.env.NODE_ENV !== "production" ? "0000" : generateToken(number + "ADMIN_SIGNUP");

    try {
        await client.admin.upsert({
            where: { number },
            create: { 
                number,
                name: '', 
                verified: false,
                type: 'Creator'
            },
            update: {}
        });

        res.json({
            otp: process.env.NODE_ENV !== "production" ? "0000" : "OTP sent to your registered contact"
        });
    } catch (error) {
        console.error("Error in admin signup:", error);
        res.status(500).json({ message: "Error processing signup" });
    }
}) as any);

adminRouter.post('/signup/verify', (async (req: VerifyRequest, res: Response) => {
    try {
        const { number, name, otp } = req.body;
        if (!number || !name || !otp) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }

        let isValidOtp = false;
        if (process.env.NODE_ENV !== "production" && otp === "0000") {
            isValidOtp = true;
        } else {
            isValidOtp = verifyToken(TOPT_SECRET + "_ADMIN", otp) !== null;
        }

        if (!isValidOtp) {
            res.status(400).json({ message: "Invalid OTP" });
            return;
        }

        await client.admin.update({
            where: { number },
            data: { 
                name, 
                verified: true 
            }
        });

        res.json({ message: "Admin account verified successfully" });
    } catch (error) {
        console.error("Error in admin verification:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}) as any);

// Admin Sign In
adminRouter.post('/signin', (async (req: SigninRequest, res: Response) => {
    console.log('Admin signin request body:', req.body); // Log the request body
    
    if (!req.body) {
        console.error('No request body received');
        return res.status(400).json({ 
            success: false,
            message: "Request body is required" 
        });
    }
    
    const { number } = req.body;
    if (!number) {
        return res.status(400).json({ 
            success: false,
            message: "Phone number is required in the request body" 
        });
    }

    try {
        // Check if admin exists
        const admin = await client.admin.findUnique({
            where: { number }
        });

        if (!admin) {
            res.status(404).json({ message: "Admin not found" });
            return;
        }

        // In production, generate and send OTP
        const otp = process.env.NODE_ENV !== "production" ? "0000" : generateToken(number + "ADMIN_SIGNIN");
        
        // In a real app, you would send the OTP via SMS or email
        console.log(`OTP for ${number}: ${otp}`);

        res.json({
            success: true,
            message: "OTP sent successfully",
            // Only return OTP in development for testing
            otp: process.env.NODE_ENV !== "production" ? otp : undefined
        });
    } catch (error) {
        console.error("Error in admin signin:", error);
        res.status(500).json({ message: "Error processing signin" });
    }
}) as any);

// Verify Admin Sign In
adminRouter.post('/signin/verify', (async (req: VerifySigninRequest, res: Response) => {
    console.log('Admin signin verify request body:', req.body); // Log the request body
    
    if (!req.body) {
        console.error('No request body received for verification');
        return res.status(400).json({ 
            success: false,
            message: "Request body is required" 
        });
    }
    
    const { number, otp } = req.body;
    
    if (!number || !otp) {
        res.status(400).json({ message: "Phone number and OTP are required" });
        return;
    }

    try {
        // Verify OTP
        let isValidOtp = false;
        if (process.env.NODE_ENV !== "production" && otp === "0000") {
            isValidOtp = true;
        } else {
            isValidOtp = verifyToken(TOPT_SECRET + "_ADMIN_SIGNIN", otp) !== null;
        }

        if (!isValidOtp) {
            res.status(400).json({ message: "Invalid OTP" });
            return;
        }

        // Get admin details
        const admin = await client.admin.findUnique({
            where: { number },
            select: {
                id: true,
                number: true,
                name: true,
                type: true,
                verified: true
            }
        });

        if (!admin) {
            res.status(404).json({ message: "Admin not found" });
            return;
        }

        // Generate JWT token
        const authToken = jwt.sign(
            { 
                id: admin.id, 
                number: admin.number,
                type: admin.type,
                role: 'admin'
            }, 
            ADMIN_JWT_PASSWORD,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: "Sign in successful",
            data: {
                ...admin,
                token: authToken
            }
        });
    } catch (error) {
        console.error("Error in admin signin verification:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}) as any);

export default adminRouter;