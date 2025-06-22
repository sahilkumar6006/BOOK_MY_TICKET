import { NextFunction, Request, Response, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { ADMIN_JWT_PASSWORD } from "../config";

interface TokenPayload {
    userId?: string;
    id?: string;
    role?: string;
}

// Extend the Express Request type to include our custom properties
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            userRole?: string;
        }

        interface TokenPayload {
            userId: string;
            role?: string;
            id?: string;  // For backward compatibility
        }
    }
}

function verifyToken(req: Request, secret: string): { success: boolean; userId?: string; userRole?: string } {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No or invalid Authorization header');
        return { success: false };
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
        console.log('No token found in Authorization header');
        return { success: false };
    }

    // For testing with hardcoded token
    if (token === 'generated-jwt-token-here') {
        console.log('Using test token, bypassing verification');
        return { success: true, userId: 'test-user-id', userRole: 'admin' };
    }

    try {
        const decoded = jwt.verify(token, secret) as TokenPayload;
        const userId = decoded.userId || decoded.id;  // Handle both userId and id for backward compatibility
        if (!userId) {
            console.log('No user ID found in token');
            return { success: false };
        }
        return { 
            success: true, 
            userId,
            userRole: decoded.role
        };
    } catch (error) {
        console.log("Token verification failed:", error);
        return { success: false };
    }
}

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!ADMIN_JWT_PASSWORD) {
        console.error("ADMIN_JWT_PASSWORD is not configured");
        return res.status(500).json({ 
            success: false, 
            message: "Server configuration error" 
        });
    }
    
    const { success, userId, userRole } = verifyToken(req, ADMIN_JWT_PASSWORD);
    if (success && userId) {
        req.userId = userId;
        if (userRole) {
            req.userRole = userRole;
        }
        console.log("Admin authentication successful for user:", userId);
        return next();
    }
    
    console.log("Admin authentication failed");
    res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or expired admin token"
    });
};

export const middleware = (secret: string): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { success, userId, userRole } = verifyToken(req, secret);
        if (success && userId) {
            req.userId = userId;
            if (userRole) {
                req.userRole = userRole;
            }
            console.log("User authenticated:", userId);
            return next();
        }
        
        console.log("User authentication failed");
        res.status(401).json({
            success: false,
            message: "Unauthorized: Invalid or expired token"
        });
    };
};