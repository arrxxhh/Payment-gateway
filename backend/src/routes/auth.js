import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Demo single-user login
// Accepts { username, password } and returns a JWT if correct
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  // For demo only; do not use in production
  if (username === 'admin' && password === 'password') {
    const token = jwt.sign({ sub: 'admin', role: 'Admin' }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
    return res.json({ token });
  }
  if (username === 'merchant' && password === 'password') {
    const token = jwt.sign({ sub: 'merchant', role: 'Merchant' }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
    return res.json({ token });
  }
  if (username === 'auditor' && password === 'password') {
    const token = jwt.sign({ sub: 'auditor', role: 'Auditor' }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

export default router;


