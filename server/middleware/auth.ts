import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { db } from '../db/database.js';
import { User, UserRole } from '../db/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'caresync_secure_dev_jwt_secret_2026_healthcare';
const TOKEN_EXPIRY = '7d';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      fullName: user.fullName 
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Extract token from Cookie or Bearer header
export function extractToken(req: Request): string | null {
  if (req.cookies && req.cookies.caresync_token) {
    return req.cookies.caresync_token;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

// Middleware: Authenticate User
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const payload = verifyToken(token);
  if (!payload || !payload.id) {
    return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }

  const user = db.findUserById(payload.id);
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'User account not found or suspended.' });
  }

  req.user = user;
  next();
}

// Middleware: Role Guard
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Forbidden. You do not have permissions for this action. Required role: ${allowedRoles.join(' or ')}.` 
      });
    }

    next();
  };
}

// Optional Auth (for public routes that can personalize if signed in)
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload && payload.id) {
      const user = db.findUserById(payload.id);
      if (user && user.isActive) {
        req.user = user;
      }
    }
  }
  next();
}
