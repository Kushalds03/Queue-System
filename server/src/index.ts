import { createApp } from './app.js';
import { config } from './config/index.js';
import prisma from './db.js';

const app = createApp();

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✓ Successfully connected to database');

    app.listen(config.port, () => {
      console.log(`===============================================`);
      console.log(`🚀 QueueFlow Backend API running on port ${config.port}`);
      console.log(`📡 Environment: ${config.nodeEnv}`);
      console.log(`🔗 API Base: http://localhost:${config.port}/api`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server and DB connections');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server and DB connections');
  await prisma.$disconnect();
  process.exit(0);
});

