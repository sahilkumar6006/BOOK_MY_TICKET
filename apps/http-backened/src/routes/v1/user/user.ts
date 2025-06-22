import { Router, Request, Response, RequestHandler } from 'express';
import { generateToken, verifyToken } from 'authenticator';
import { client } from '@repo/db/client';
import { TOPT_SECRET } from '../../../config';

const isDev = process.env.NODE_ENV !== "production";

const userRouter: Router = Router();

interface SignupRequest extends Request {
    body: {
        number: string;
    };
}

interface UpdateProfileRequest extends Request {
    body: {
        name?: string;
        email?: string;
        state?: string;
    };
    user?: {
        id: string;
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
        otp: string;
    };
}

userRouter.post("/signup", (async (req: SignupRequest, res: Response) => {
    const { number } = req.body;
    if (!number) {
        res.status(400).json({ message: "Missing phone number" });
        return;
    }

    const otp = isDev ? "0000" : generateToken(number + "SIGNUP");

    await client.user.upsert({
        where: { number: number },
        create: { number: number, name: '', verified: false },
        update: {}
    });

    res.json({
        otp: isDev ? "0000" : "OTP sent to your phone"
    });
}) as RequestHandler);


userRouter.post('/signup/verify', (async (req: VerifyRequest, res: Response) => {
    try {
        const { number, name, otp } = req.body;
        if (!number || !name || !otp) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }

        let isValidOtp = false;
        if (isDev && otp === "0000") {
            isValidOtp = true;
        } else {
            isValidOtp = verifyToken(TOPT_SECRET, otp) !== null;
        }

        if (!isValidOtp) {
            res.status(400).json({ message: "Invalid OTP" });
            return;
        }

        await client.user.update({
            where: { number: number },
            data: { name, verified: true }
        });


        const user = await client.user.update({
            where: {
                number
            },
            data: {
                name,
                verified: true
            }
        })


        res.json({ message: "User verified successfully" });

    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({ message: "Error verifying user" });
        return;
    }
}) as RequestHandler);

// User Sign In
userRouter.post('/signin', (async (req: SigninRequest, res: Response) => {
    console.log('Signin request body:', req.body); // Log the request body

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
        // Check if user exists
        const user = await client.user.findUnique({
            where: { number }
        });

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // In production, generate and send OTP
        const otp = isDev ? "0000" : generateToken(number + "USER_SIGNIN");

        // In a real app, you would send the OTP via SMS
        console.log(`OTP for ${number}: ${otp}`);

        res.json({
            success: true,
            message: "OTP sent successfully",
            // Only return OTP in development for testing
            otp: isDev ? otp : undefined
        });
    } catch (error) {
        console.error("Error in user signin:", error);
        res.status(500).json({ message: "Error processing signin" });
    }
}) as RequestHandler);

// Verify User Sign In
userRouter.post('/signin/verify', (async (req: VerifySigninRequest, res: Response) => {
    console.log('Signin verify request body:', req.body); // Log the request body

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
        if (isDev && otp === "0000") {
            isValidOtp = true;
        } else {
            isValidOtp = verifyToken(TOPT_SECRET + "_USER_SIGNIN", otp) !== null;
        }

        if (!isValidOtp) {
            res.status(400).json({ message: "Invalid OTP" });
            return;
        }

        // Get user details
        const user = await client.user.findUnique({
            where: { number },
            select: {
                id: true,
                number: true,
                name: true,
                verified: true
            }
        });

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // In a real app, generate a JWT token here
        const authToken = "generated-jwt-token-here";

        res.json({
            success: true,
            message: "Sign in successful",
            data: {
                ...user,
                token: authToken
            }
        });
    } catch (error) {
        console.error("Error in user signin verification:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}) as RequestHandler);

// Update User Profile
userRouter.put('/profile', (async (req: UpdateProfileRequest, res: Response) => {
    try {
        const { name, email, state } = req.body;

        // In a real app, get user ID from auth token
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (state !== undefined) updateData.state = state;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields to update"
            });
        }

        const updatedUser = await client.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                number: true,
                name: true,
                email: true,
                state: true,
                verified: true
            }
        });

        res.json({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser
        });
    } catch (error: any) {
        console.error("Error updating profile:", error);

        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            return res.status(400).json({
                success: false,
                message: "Email already in use"
            });
        }

        res.status(500).json({
            success: false,
            message: "Error updating profile"
        });
    }
}) as RequestHandler);

export { userRouter };
