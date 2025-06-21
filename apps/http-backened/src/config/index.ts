// In production, use environment variables for these secrets
export const JWT_PASSWORD = process.env.JWT_PASSWORD || "your-secure-jwt-secret-123"
export const ADMIN_JWT_PASSWORD = process.env.ADMIN_JWT_PASSWORD || "your-secure-admin-jwt-secret-456"
export const SUPERADMIN_JWT_PASSWORD = process.env.SUPERADMIN_JWT_PASSWORD || "your-secure-superadmin-jwt-secret-789"
export const TOPT_SECRET = process.env.TOPT_SECRET || "your-secure-totp-secret-123";