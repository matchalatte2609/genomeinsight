import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import mongoose from 'mongoose';
import { createClient } from 'redis';

// Load environment variables
dotenv.config();

// Import routes (we'll create these next)
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import datasetRoutes from './routes/datasets';

const app = express();
const PORT = process.env.API_PORT || 3001;

// Database connections
let pgPool: Pool;
let redisClient: any;

// PostgreSQL connection
const initPostgreSQL = async () => {
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@postgres:5432/genomeinsight',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  try {
    await pgPool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected successfully');
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    process.exit(1);
  }
};

// MongoDB connection
const initMongoDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://admin:password@mongodb:27017/genomeinsight?authSource=admin',
      {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    );
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Redis connection - FIXED
const initRedis = async () => {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://redis:6379'
  });

  redisClient.on('error', (err: any) => console.error('Redis Client Error', err));
  redisClient.on('connect', () => console.log('✅ Redis connected successfully'));

  await redisClient.connect();
};

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Make database connections available to routes
app.use((req: any, res, next) => {
  req.pgPool = pgPool;
  req.redisClient = redisClient;
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check PostgreSQL
    await pgPool.query('SELECT 1');
    
    // Check MongoDB
    const mongoState = mongoose.connection.readyState;
    
    // Check Redis
    await redisClient.ping();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'running',
        postgresql: 'connected',
        mongodb: mongoState === 1 ? 'connected' : 'disconnected',
        redis: 'connected'
      },
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/datasets', datasetRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'GenomeInsight API Gateway',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      datasets: '/api/datasets'
    },
    docs: '/api/docs'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} does not exist`
  });
});

// Error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
const startServer = async () => {
  try {
    await initPostgreSQL();
    await initMongoDB();
    await initRedis();

    app.listen(PORT, () => {
      console.log(`🚀 API Gateway running on port ${PORT}`);
      console.log(`📚 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API endpoint: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  await pgPool.end();
  await mongoose.connection.close();
  await redisClient.quit();
  process.exit(0);
});

// Start the server
startServer();

export { pgPool, redisClient };