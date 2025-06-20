import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// GET /api/users/profile
router.get('/profile', authenticateToken, (req: any, res) => {
  res.json({
    message: 'User profile endpoint',
    user: req.user
  });
});

// GET /api/users (admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req: any, res) => {
  try {
    const pgPool = req.pgPool;
    const result = await pgPool.query(
      'SELECT id, email, first_name, last_name, institution, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      users: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

export default router;
