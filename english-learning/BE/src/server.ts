import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth';
import vocabRoutes from './routes/vocab';
import adminRoutes from './routes/admin';
import mediaRoutes from './routes/media';
import quizRoutes from './routes/quiz';
import { prisma } from './prisma';

const app = express();
const PORT = Number(process.env.PORT || 5000);

// Test database connection on startup for clearer errors
const testDbConnection = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
  }
};

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
  credentials: false
}));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/vocab', vocabRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/quiz', quizRoutes);

// Global error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Global error handler caught:', err);
  if (res.headersSent) {
    return; // Headers already sent, don't try to send response
  }
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Authentication reset functionality
const resetAuthenticationData = async () => {
  try {
    console.log('🔄 Resetting authentication data...');
    
    // Clear all password reset tokens
    await prisma.user.updateMany({
      data: {
        resetToken: null,
        resetTokenExpiry: null
      }
    });
    
    console.log('✅ Password reset tokens cleared');
    console.log('✅ Authentication data reset completed');
  } catch (error) {
    console.error('❌ Error resetting authentication data:', error);
  }
};

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Reset authentication data
    await resetAuthenticationData();
    
    // Close database connection
    await prisma.$disconnect();
    console.log('✅ Database connection closed');
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Listen for shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('❌ Uncaught Exception:', error);
  await resetAuthenticationData();
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  await resetAuthenticationData();
  process.exit(1);
});

// Start the server and immediately try to connect to the database
const server = app.listen(PORT, () => {
  console.log(`🚀 API listening on http://localhost:${PORT}`);
  console.log('📝 Authentication reset will occur on server shutdown');
  // Fire-and-forget DB connection test
  void testDbConnection();
});

// Export server for testing
export default server;
