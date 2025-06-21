import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ADMIN_JWT_PASSWORD } from "../config";



export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
    const tokenVerified = verifyToken(req, res, ADMIN_JWT_PASSWORD);
    if (tokenVerified) {
        console.log("Admin authentication successful");
        next();
        return;
    }
    
    res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or expired token"
    });
};

export function verifyToken(req: Request, res: Response, secret: string): boolean {
    const authHeader = req.headers.authorization;

    console.log("Authorization header:", authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No token or invalid token format');
        return false;
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
        console.log('No token found in Authorization header');
        return false;
    }

    // For testing with hardcoded token
    if (token === 'generated-jwt-token-here') {
        console.log('Using test token, bypassing verification');
        req.userId = 'test-user-id';
        return true;
    }

    try {
        console.log('Verifying token with secret:', secret);
        const decoded = jwt.verify(token, secret);
        console.log("Token decoded successfully:", decoded);
        
        // Attach user info to request object
        if (typeof decoded === 'object' && decoded !== null) {
            req.userId = (decoded as any).id;
            req.userRole = (decoded as any).role;
        }
        
        if (typeof decoded === "string") {
            console.log('Token payload is a string, expected object');
            return false;
        }
        
        req.userId = (decoded as any).userId || (decoded as any).id;
        console.log('User ID set to:', req.userId);
        return true;
        
    } catch(e: any) {
        console.error('Token verification failed:', e.message);
        return false;
    }
}