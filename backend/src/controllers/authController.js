import supabase from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export async function register(req, res) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const { data: existing } = await supabase.from('users').select('id').eq('email', email).limit(1);
    if (existing && existing.length) return res.status(409).json({ error: 'email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const payload = { email, name, password: hash, role: 'user', created_at: new Date().toISOString() };
    const { data, error } = await supabase.from('users').insert([payload]).select().limit(1).single();
    if (error) return res.status(500).json({ error: error.message || error });

    const token = jwt.sign({ sub: data.id, email: data.email, role: data.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRE });
    // remove password before returning
    delete data.password;
    return res.status(201).json({ token, user: data });
  } catch (err) {
    console.error('register error', err);
    return res.status(500).json({ error: 'internal' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const { data, error } = await supabase.from('users').select('*').eq('email', email).limit(1).single();
    if (error && error.code !== 'PGRST116') {
      // PGRST116 may indicate no rows; handle below
    }
    const user = data;
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    const match = await bcrypt.compare(password, user.password || '');
    if (!match) return res.status(401).json({ error: 'invalid credentials' });

    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRE });
    delete user.password;
    return res.json({ token, user });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'internal' });
  }
}

export async function me(req, res) {
  // `req.user` is set by auth middleware
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauthenticated' });
  // fetch fresh user record
  try {
    const { data } = await supabase.from('users').select('-password').eq('id', user.sub).limit(1).single();
    return res.json({ user: data || user });
  } catch (err) {
    return res.json({ user });
  }
}

export default { register, login, me };

