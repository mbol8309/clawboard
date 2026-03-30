const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { ApiKey } = require('../models');

const verifyToken = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    req.user = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    req.authType = 'jwt';
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const verifyApiKey = async (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (!key) return res.status(401).json({ error: 'No API key provided' });
  const keys = await ApiKey.findAll({ where: { active: true } });
  for (const k of keys) {
    if (await bcrypt.compare(key, k.keyHash)) {
      await k.update({ lastUsedAt: new Date() });
      req.apiKey = k;
      req.authType = 'apikey';
      return next();
    }
  }
  return res.status(401).json({ error: 'Invalid API key' });
};

const authOrApiKey = async (req, res, next) => {
  const apiKeyHeader = req.headers['x-api-key'];
  if (apiKeyHeader) return verifyApiKey(req, res, next);
  return verifyToken(req, res, next);
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

module.exports = { verifyToken, verifyApiKey, authOrApiKey, requireRole };
