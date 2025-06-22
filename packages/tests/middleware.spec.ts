import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import type * as JWT from 'jsonwebtoken';
import { adminAuth, middleware } from '../../apps/http-backened/src/middleware';

// Mock jwt.verify
const mockVerify = vi.fn();

vi.mock('jsonwebtoken', () => ({
  verify: mockVerify,
}));

// Mock process.env
vi.stubGlobal('process', {
  ...process,
  env: {
    ...process.env,
    ADMIN_JWT_PASSWORD: 'test-secret'
  }
});

// Mock Express types
const createMockRequest = (headers = {}): Partial<Request> => ({
  headers: { ...headers },
  userId: undefined,
  userRole: undefined,
});

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const nextFunction = vi.fn();

describe('Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let mockJson: any;
  let mockStatus: any;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnThis();
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
    nextFunction = vi.fn();
    vi.clearAllMocks();
  });

  describe('adminAuth', () => {
    it('should return 500 if ADMIN_JWT_PASSWORD is not set', async () => {
      process.env.ADMIN_JWT_PASSWORD = '';
      
      await adminAuth(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: "Server configuration error"
      });
    });

    it('should call next() with valid token', async () => {
      process.env.ADMIN_JWT_PASSWORD = 'test-secret';
      const mockUserId = 'test-user-id';
      
      // Mock a valid token
      (jwt.verify as jest.Mock).mockReturnValueOnce({ userId: mockUserId });
      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };
      
      await adminAuth(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.userId).toBe(mockUserId);
    });

    it('should return 401 with invalid token', async () => {
      process.env.ADMIN_JWT_PASSWORD = 'test-secret';
      
      // Mock an invalid token
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });
      
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };
      
      await adminAuth(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: "Unauthorized: Invalid or expired admin token"
      });
    });
  });

  describe('middleware', () => {
    it('should call next() with valid token', async () => {
      const mockUserId = 'test-user-id';
      const secret = 'test-secret';
      
      // Mock a valid token
      (jwt.verify as jest.Mock).mockReturnValueOnce({ userId: mockUserId });
      
      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };
      
      const mw = middleware(secret);
      await mw(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.userId).toBe(mockUserId);
    });

    it('should return 401 with invalid token', async () => {
      const secret = 'test-secret';
      
      // Mock an invalid token
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });
      
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };
      
      const mw = middleware(secret);
      await mw(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: "Unauthorized: Invalid or expired token"
      });
    });
  });
});
