import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting QueueFlow database seeding...');

  // Clean existing data
  await prisma.activityLog.deleteMany({});
  await prisma.token.deleteMany({});
  await prisma.queue.deleteMany({});
  await prisma.user.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  // 1. Create Demo Manager
  const manager = await prisma.user.create({
    data: {
      name: 'Sarah Jenkins',
      email: 'manager@queueflow.com',
      passwordHash,
      organization: 'Central Metro Health & Services',
    },
  });
  console.log(`✓ Created Manager: ${manager.name} (${manager.email})`);

  // 2. Create Primary Queue
  const queue1 = await prisma.queue.create({
    data: {
      userId: manager.id,
      name: 'General Service & Admissions',
      description: 'Primary customer service, check-ins, and consultation desk',
      prefix: 'A',
      status: 'ACTIVE',
    },
  });

  // 3. Create Secondary Queue
  const queue2 = await prisma.queue.create({
    data: {
      userId: manager.id,
      name: 'Express Document Verification',
      description: 'Fast-track verification and certificate issuance desk',
      prefix: 'E',
      status: 'ACTIVE',
    },
  });
  console.log(`✓ Created Queues: "${queue1.name}" and "${queue2.name}"`);

  // Helper date generators for realistic timestamps over past 3 days
  const now = new Date();

  // Create Completed tokens for Queue 1
  const completedSamples = [
    { name: 'Michael Chang', phone: '+1-555-0101', waitMins: 4, servMins: 7, daysAgo: 2 },
    { name: 'Elena Rostova', phone: '+1-555-0102', waitMins: 6, servMins: 5, daysAgo: 2 },
    { name: 'David Kim', phone: '+1-555-0103', waitMins: 8, servMins: 9, daysAgo: 1 },
    { name: 'Amara Okafor', phone: '+1-555-0104', waitMins: 5, servMins: 6, daysAgo: 1 },
    { name: 'Liam O\'Connor', phone: '+1-555-0105', waitMins: 3, servMins: 8, daysAgo: 0 },
    { name: 'Sofia Rodriguez', phone: '+1-555-0106', waitMins: 7, servMins: 11, daysAgo: 0 },
  ];

  let seq = 1;
  for (const item of completedSamples) {
    const created = new Date(now.getTime() - (item.daysAgo * 86400000 + (item.waitMins + item.servMins + 30) * 60000));
    const served = new Date(created.getTime() + item.waitMins * 60000);
    const completed = new Date(served.getTime() + item.servMins * 60000);

    await prisma.token.create({
      data: {
        queueId: queue1.id,
        tokenNumber: `A-${String(seq).padStart(3, '0')}`,
        sequenceNumber: seq,
        customerName: item.name,
        customerPhone: item.phone,
        status: 'COMPLETED',
        position: 0,
        createdAt: created,
        servedAt: served,
        completedAt: completed,
      },
    });
    seq++;
  }

  // Create 1 Cancelled token
  const cancelCreated = new Date(now.getTime() - 45 * 60000);
  const cancelledAt = new Date(now.getTime() - 20 * 60000);
  await prisma.token.create({
    data: {
      queueId: queue1.id,
      tokenNumber: `A-${String(seq).padStart(3, '0')}`,
      sequenceNumber: seq,
      customerName: 'Marcus Vance',
      customerPhone: '+1-555-0110',
      status: 'CANCELLED',
      position: 0,
      createdAt: cancelCreated,
      cancelledAt,
    },
  });
  seq++;

  // Create 1 Currently Serving Token
  const servingCreated = new Date(now.getTime() - 15 * 60000);
  const servingStarted = new Date(now.getTime() - 4 * 60000); // 4 minutes ago
  const currentServing = await prisma.token.create({
    data: {
      queueId: queue1.id,
      tokenNumber: `A-${String(seq).padStart(3, '0')}`,
      sequenceNumber: seq,
      customerName: 'Ananya Sharma',
      customerPhone: '+1-555-0125',
      notes: 'Customer inquiring about document renewal',
      status: 'SERVING',
      position: 0,
      createdAt: servingCreated,
      servedAt: servingStarted,
    },
  });
  seq++;
  console.log(`✓ Created Currently Serving Token: ${currentServing.tokenNumber} (${currentServing.customerName})`);

  // Create 4 Waiting Tokens with sequential positions
  const waitingSamples = [
    { name: 'Jordan Hayes', phone: '+1-555-0140', notes: 'First-time registration' },
    { name: 'Fatima Al-Mansoor', phone: '+1-555-0141', notes: 'Urgent passport verification' },
    { name: 'Alexander Wright', phone: '+1-555-0142', notes: '' },
    { name: 'Chloe Bennett', phone: '+1-555-0143', notes: 'Billing query' },
  ];

  let pos = 1;
  for (const item of waitingSamples) {
    const created = new Date(now.getTime() - (waitingSamples.length - pos + 1) * 7 * 60000);
    await prisma.token.create({
      data: {
        queueId: queue1.id,
        tokenNumber: `A-${String(seq).padStart(3, '0')}`,
        sequenceNumber: seq,
        customerName: item.name,
        customerPhone: item.phone,
        notes: item.notes || null,
        status: 'WAITING',
        position: pos,
        createdAt: created,
      },
    });
    seq++;
    pos++;
  }
  console.log(`✓ Created ${waitingSamples.length} Waiting Tokens for Queue 1`);

  // Create sample tokens for Queue 2
  await prisma.token.create({
    data: {
      queueId: queue2.id,
      tokenNumber: 'E-001',
      sequenceNumber: 1,
      customerName: 'Oliver Twist',
      customerPhone: '+1-555-0199',
      status: 'WAITING',
      position: 1,
      createdAt: new Date(now.getTime() - 10 * 60000),
    },
  });

  // Create Activity Logs
  const activities = [
    { action: 'QUEUE_CREATED', details: 'Initialized queue "General Service & Admissions"', mins: 120 },
    { action: 'TOKEN_CREATED', details: 'Token #A-001 created for Michael Chang', mins: 110 },
    { action: 'TOKEN_CALLED', details: 'Called Token #A-001 to Counter', mins: 106 },
    { action: 'TOKEN_COMPLETED', details: 'Service completed for Token #A-001', mins: 99 },
    { action: 'TOKEN_CALLED', details: 'Called Token #A-008 (Ananya Sharma) to Counter', mins: 4 },
  ];

  for (const act of activities) {
    await prisma.activityLog.create({
      data: {
        userId: manager.id,
        queueId: queue1.id,
        action: act.action,
        details: act.details,
        createdAt: new Date(now.getTime() - act.mins * 60000),
      },
    });
  }

  console.log('✓ Created Activity Logs');
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
