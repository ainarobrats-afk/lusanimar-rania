import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export default function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || req.headers.Authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing token' });
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    // normalize to { sub, email, role }
    req.user = { sub: decoded.sub || decoded.id, email: decoded.email, role: decoded.role };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' });
  }
}

