import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthReq extends Request { userId?: number }

export function requireAuth(req: AuthReq, res: Response, next: NextFunction) {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { sub: string };
    req.userId = parseInt(payload.sub);
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
