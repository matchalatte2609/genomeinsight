import express from 'express';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// GET /api/datasets
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const pgPool = req.pgPool;
    const userId = req.user.id;

    const result = await pgPool.query(
      'SELECT id, filename, file_size, sample_count, variant_count, upload_date, processing_status FROM datasets WHERE user_id = $1 ORDER BY upload_date DESC',
      [userId]
    );

    res.json({
      datasets: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get datasets error:', error);
    res.status(500).json({ error: 'Failed to get datasets' });
  }
});

// POST /api/datasets (placeholder)
router.post('/', authenticateToken, (req: any, res) => {
  res.json({
    message: 'Dataset upload endpoint - coming soon',
    note: 'This will be implemented in the file service'
  });
});

export default router;
