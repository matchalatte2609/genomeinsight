import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { Pool } from 'pg';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

interface AuthRequest extends express.Request {
  pgPool?: Pool;
  redisClient?: any;
  user?: any;
}

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  institution: Joi.string().max(255).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Helper function to generate JWT - FIXED
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
  const expiresIn = '7d'; // Fixed string literal
  
  return jwt.sign({ userId }, secret, { expiresIn });
};

// POST /api/auth/register
router.post('/register', async (req: AuthRequest, res) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const { email, password, firstName, lastName, institution } = value;
    const pgPool = req.pgPool!;

    // Check if user already exists
    const existingUser = await pgPool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userResult = await pgPool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, institution, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, institution, role, created_at`,
      [email.toLowerCase(), passwordHash, firstName, lastName, institution || null, 'researcher']
    );

    const user = userResult.rows[0];

    // Generate JWT token
    const token = generateToken(user.id);

    // Store session in Redis (optional, for token management)
    const redisClient = req.redisClient;
    if (redisClient) {
      await redisClient.setEx(`session:${user.id}`, 7 * 24 * 60 * 60, token); // 7 days
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        institution: user.institution,
        role: user.role,
        createdAt: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: AuthRequest, res) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const { email, password } = value;
    const pgPool = req.pgPool!;

    // Get user
    const userResult = await pgPool.query(
      'SELECT id, email, password_hash, first_name, last_name, institution, role, is_active FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await pgPool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate JWT token
    const token = generateToken(user.id);

    // Store session in Redis
    const redisClient = req.redisClient;
    if (redisClient) {
      await redisClient.setEx(`session:${user.id}`, 7 * 24 * 60 * 60, token);
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        institution: user.institution,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.id;
    const redisClient = req.redisClient;

    // Remove session from Redis
    if (redisClient) {
      await redisClient.del(`session:${userId}`);
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.first_name,
      lastName: req.user.last_name,
      institution: req.user.institution,
      role: req.user.role
    }
  });
});

export default router;