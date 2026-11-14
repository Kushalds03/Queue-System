import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import prisma from '../src/db.js';

const app = createApp();

describe('QueueFlow Full-Stack API Suite', () => {
  let authToken = '';
  let userId = '';
  let queueId = '';
  let token1Id = '';
  let token2Id = '';
  let token3Id = '';

  const testEmail = `test.manager.${Date.now()}@queueflow.com`;
  const testPassword = 'Password123!';

  afterAll(async () => {
    // Cleanup test user and associated records
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  describe('1. Authentication Module', () => {
    it('should register a new manager account', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Manager',
          email: testEmail,
          password: testPassword,
          organization: 'Test Enterprise',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testEmail.toLowerCase());
      userId = res.body.user.id;
    });

    it('should prevent registration with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate',
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should log in with valid credentials and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      authToken = res.body.token;
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fetch authenticated user profile with /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(testEmail.toLowerCase());
    });
  });

  describe('2. Queue Management Module', () => {
    it('should create a new queue', async () => {
      const res = await request(app)
        .post('/api/queues')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Consultation Desk 1',
          description: 'General doctor consultation desk',
          prefix: 'C',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.queue.name).toBe('Consultation Desk 1');
      expect(res.body.queue.prefix).toBe('C');
      expect(res.body.queue.status).toBe('ACTIVE');
      queueId = res.body.queue.id;
    });

    it('should retrieve all queues for the manager', async () => {
      const res = await request(app)
        .get('/api/queues')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.queues)).toBe(true);
      expect(res.body.queues.some((q: any) => q.id === queueId)).toBe(true);
    });

    it('should pause and resume queue status', async () => {
      // Pause
      const pauseRes = await request(app)
        .patch(`/api/queues/${queueId}/toggle-status`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(pauseRes.status).toBe(200);
      expect(pauseRes.body.queue.status).toBe('PAUSED');

      // Resume
      const resumeRes = await request(app)
        .patch(`/api/queues/${queueId}/toggle-status`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(resumeRes.status).toBe(200);
      expect(resumeRes.body.queue.status).toBe('ACTIVE');
    });

    it('should rename / update queue details', async () => {
      const res = await request(app)
        .put(`/api/queues/${queueId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Consultation Desk',
          description: 'Updated description for consultation',
        });

      expect(res.status).toBe(200);
      expect(res.body.queue.name).toBe('Updated Consultation Desk');
    });
  });

  describe('3. Token Management & Queue Ordering', () => {
    it('should add customers and generate unique sequential tokens', async () => {
      // Customer 1
      const res1 = await request(app)
        .post('/api/tokens')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          queueId,
          customerName: 'Alice Johnson',
          customerPhone: '+1-555-1001',
        });
      expect(res1.status).toBe(201);
      expect(res1.body.token.tokenNumber).toBe('C-001');
      expect(res1.body.token.position).toBe(1);
      expect(res1.body.token.status).toBe('WAITING');
      token1Id = res1.body.token.id;

      // Customer 2
      const res2 = await request(app)
        .post('/api/tokens')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          queueId,
          customerName: 'Bob Smith',
          customerPhone: '+1-555-1002',
        });
      expect(res2.status).toBe(201);
      expect(res2.body.token.tokenNumber).toBe('C-002');
      expect(res2.body.token.position).toBe(2);
      token2Id = res2.body.token.id;

      // Customer 3
      const res3 = await request(app)
        .post('/api/tokens')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          queueId,
          customerName: 'Charlie Brown',
          customerPhone: '+1-555-1003',
        });
      expect(res3.status).toBe(201);
      expect(res3.body.token.tokenNumber).toBe('C-003');
      expect(res3.body.token.position).toBe(3);
      token3Id = res3.body.token.id;
    });

    it('should prevent invalid reorder movements (moving top token up)', async () => {
      const res = await request(app)
        .patch(`/api/tokens/${token1Id}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ direction: 'UP' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Cannot move up');
    });

    it('should prevent invalid reorder movements (moving bottom token down)', async () => {
      const res = await request(app)
        .patch(`/api/tokens/${token3Id}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ direction: 'DOWN' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Cannot move down');
    });

    it('should move token 2 UP and persist ordering in database', async () => {
      // Bob is position 2, Alice is position 1.
      // Moving Bob UP should make Bob position 1 and Alice position 2.
      const res = await request(app)
        .patch(`/api/tokens/${token2Id}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ direction: 'UP' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify in DB directly
      const bob = await prisma.token.findUnique({ where: { id: token2Id } });
      const alice = await prisma.token.findUnique({ where: { id: token1Id } });
      expect(bob?.position).toBe(1);
      expect(alice?.position).toBe(2);
    });

    it('should move token 2 DOWN back to position 2', async () => {
      // Bob is currently position 1. Move Bob DOWN.
      const res = await request(app)
        .patch(`/api/tokens/${token2Id}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ direction: 'DOWN' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const bob = await prisma.token.findUnique({ where: { id: token2Id } });
      const alice = await prisma.token.findUnique({ where: { id: token1Id } });
      expect(bob?.position).toBe(2);
      expect(alice?.position).toBe(1);
    });
  });

  describe('4. Service Management & Lifecycle', () => {
    it('should Call Next customer (Alice, position 1) and assign to SERVING', async () => {
      const res = await request(app)
        .post('/api/tokens/call-next')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ queueId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.servingToken.id).toBe(token1Id);
      expect(res.body.servingToken.status).toBe('SERVING');
      expect(res.body.servingToken.servedAt).toBeDefined();

      // Bob should now be position 1 and Charlie position 2
      const bob = await prisma.token.findUnique({ where: { id: token2Id } });
      const charlie = await prisma.token.findUnique({ where: { id: token3Id } });
      expect(bob?.position).toBe(1);
      expect(charlie?.position).toBe(2);
    });

    it('should prevent multiple simultaneous service assignments', async () => {
      // Calling next while Alice is serving should fail with 400
      const res = await request(app)
        .post('/api/tokens/call-next')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ queueId });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('currently being served');
    });

    it('should complete service for the currently serving customer', async () => {
      const res = await request(app)
        .patch(`/api/tokens/${token1Id}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token.status).toBe('COMPLETED');
      expect(res.body.token.completedAt).toBeDefined();
    });

    it('should allow cancelling a waiting customer and adjust remaining positions', async () => {
      // Charlie is position 2. Cancel Charlie.
      const res = await request(app)
        .patch(`/api/tokens/${token3Id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token.status).toBe('CANCELLED');

      const cancelledCharlie = await prisma.token.findUnique({ where: { id: token3Id } });
      expect(cancelledCharlie?.position).toBe(0);
    });
  });

  describe('5. Real Database Analytics', () => {
    it('should return calculated metrics from actual records', async () => {
      const res = await request(app)
        .get(`/api/analytics?queueId=${queueId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const metrics = res.body.data.metrics;

      expect(metrics.totalServed).toBe(1); // Alice
      expect(metrics.totalCancelled).toBe(1); // Charlie
      expect(metrics.currentWaiting).toBe(1); // Bob
      expect(metrics.queueLength).toBe(1); // Bob
      expect(res.body.data.statusDistribution).toBeDefined();
      expect(res.body.data.dailyTrends).toBeDefined();
    });
  });
});
