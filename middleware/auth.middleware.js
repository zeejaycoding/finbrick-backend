const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token payload:', decoded); // Debug log
    req.user = decoded; // Should include { userId, iat, exp }
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};