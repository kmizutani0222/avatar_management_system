import { PrismaClient, AvatarBodyType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface PartSeed {
  bodyType: AvatarBodyType;
  category: string;
  name: string;
  sortOrder: number;
  metadata: object;
}

async function upsertPart(part: PartSeed) {
  const existing = await prisma.avatarPart.findFirst({
    where: {
      bodyType: part.bodyType,
      category: part.category,
      name: part.name,
    },
  });

  if (existing) {
    await prisma.avatarPart.update({
      where: { id: existing.id },
      data: { metadata: part.metadata, sortOrder: part.sortOrder },
    });
    return;
  }

  await prisma.avatarPart.create({
    data: {
      bodyType: part.bodyType,
      category: part.category,
      name: part.name,
      sortOrder: part.sortOrder,
      metadata: part.metadata,
    },
  });
}

const humanoidParts: PartSeed[] = [
  {
    bodyType: 'humanoid_vrm',
    category: 'hair',
    name: 'Short Hair',
    sortOrder: 1,
    metadata: {
      preview: {
        color: '#5c4033',
        geometry: 'sphere',
        attachTo: 'head',
        offset: [0, 0.15, 0],
        scale: [1.2, 0.8, 1.2],
      },
    },
  },
  {
    bodyType: 'humanoid_vrm',
    category: 'hair',
    name: 'Long Hair',
    sortOrder: 2,
    metadata: {
      preview: {
        color: '#2c1810',
        geometry: 'sphere',
        attachTo: 'head',
        offset: [0, 0.05, -0.1],
        scale: [1.4, 1.4, 1.3],
      },
    },
  },
  {
    bodyType: 'humanoid_vrm',
    category: 'hair',
    name: 'Pink Twin Tails',
    sortOrder: 3,
    metadata: {
      preview: {
        color: '#ff69b4',
        geometry: 'sphere',
        attachTo: 'head',
        offset: [0.25, 0.1, 0],
        scale: [0.7, 1.2, 0.7],
      },
    },
  },
  {
    bodyType: 'humanoid_vrm',
    category: 'eyes',
    name: 'Round Eyes',
    sortOrder: 1,
    metadata: {
      preview: {
        color: '#2196f3',
        geometry: 'sphere',
        attachTo: 'head',
        offset: [0.08, 0.02, 0.18],
        scale: [0.35, 0.35, 0.2],
      },
    },
  },
  {
    bodyType: 'humanoid_vrm',
    category: 'eyes',
    name: 'Sharp Eyes',
    sortOrder: 2,
    metadata: {
      preview: {
        color: '#9c27b0',
        geometry: 'box',
        attachTo: 'head',
        offset: [0.08, 0.02, 0.18],
        scale: [0.4, 0.2, 0.15],
      },
    },
  },
  {
    bodyType: 'humanoid_vrm',
    category: 'outfit',
    name: 'Casual Outfit',
    sortOrder: 1,
    metadata: {
      preview: {
        color: '#4caf50',
        geometry: 'box',
        attachTo: 'body',
        offset: [0, 0, 0],
        scale: [1.3, 1.2, 0.8],
      },
    },
  },
  {
    bodyType: 'humanoid_vrm',
    category: 'outfit',
    name: 'School Uniform',
    sortOrder: 2,
    metadata: {
      preview: {
        color: '#1565c0',
        geometry: 'box',
        attachTo: 'body',
        offset: [0, 0, 0],
        scale: [1.35, 1.3, 0.85],
      },
    },
  },
  {
    bodyType: 'humanoid_vrm',
    category: 'accessory',
    name: 'Headphones',
    sortOrder: 1,
    metadata: {
      preview: {
        color: '#424242',
        geometry: 'box',
        attachTo: 'head',
        offset: [0, 0.05, 0],
        scale: [1.3, 0.5, 1.1],
      },
    },
  },
];

const mascotParts: PartSeed[] = [
  {
    bodyType: 'biped_mascot',
    category: 'body',
    name: 'Round Body',
    sortOrder: 1,
    metadata: {
      preview: {
        color: '#ffb347',
        geometry: 'sphere',
        attachTo: 'body',
        offset: [0, -0.1, 0],
        scale: [1.5, 1.5, 1.5],
      },
    },
  },
  {
    bodyType: 'biped_mascot',
    category: 'body',
    name: 'Fluffy Body',
    sortOrder: 2,
    metadata: {
      preview: {
        color: '#ffe0b2',
        geometry: 'sphere',
        attachTo: 'body',
        offset: [0, -0.05, 0],
        scale: [1.7, 1.6, 1.6],
      },
    },
  },
  {
    bodyType: 'biped_mascot',
    category: 'ears',
    name: 'Cat Ears',
    sortOrder: 1,
    metadata: {
      preview: {
        color: '#ff8a65',
        geometry: 'sphere',
        attachTo: 'head',
        offset: [0.18, 0.2, 0],
        scale: [0.5, 0.6, 0.5],
      },
    },
  },
  {
    bodyType: 'biped_mascot',
    category: 'ears',
    name: 'Bear Ears',
    sortOrder: 2,
    metadata: {
      preview: {
        color: '#8d6e63',
        geometry: 'sphere',
        attachTo: 'head',
        offset: [0.2, 0.18, 0],
        scale: [0.6, 0.55, 0.55],
      },
    },
  },
  {
    bodyType: 'biped_mascot',
    category: 'tail',
    name: 'Fluffy Tail',
    sortOrder: 1,
    metadata: {
      preview: {
        color: '#ff7043',
        geometry: 'capsule',
        attachTo: 'back',
        offset: [0, 0, -0.3],
        scale: [0.8, 1.5, 0.8],
      },
    },
  },
  {
    bodyType: 'biped_mascot',
    category: 'tail',
    name: 'Short Tail',
    sortOrder: 2,
    metadata: {
      preview: {
        color: '#ffab91',
        geometry: 'sphere',
        attachTo: 'back',
        offset: [0, 0, -0.25],
        scale: [0.6, 0.6, 0.6],
      },
    },
  },
  {
    bodyType: 'biped_mascot',
    category: 'face',
    name: 'Smile Face',
    sortOrder: 1,
    metadata: {
      preview: {
        color: '#ffeb3b',
        geometry: 'box',
        attachTo: 'head',
        offset: [0, -0.05, 0.2],
        scale: [0.5, 0.15, 0.1],
      },
    },
  },
  {
    bodyType: 'biped_mascot',
    category: 'face',
    name: 'Star Eyes',
    sortOrder: 2,
    metadata: {
      preview: {
        color: '#ffd54f',
        geometry: 'sphere',
        attachTo: 'head',
        offset: [0.1, 0.05, 0.18],
        scale: [0.25, 0.25, 0.15],
      },
    },
  },
];

async function main() {
  const adminPassword = await bcrypt.hash('admin123456', 10);

  await prisma.admin.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminPassword,
      name: 'System Admin',
    },
  });

  const userPassword = await bcrypt.hash('user123456', 10);
  await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      passwordHash: userPassword,
      displayName: 'Test User',
    },
  });

  const operatorPassword = await bcrypt.hash('operator123456', 10);
  await prisma.operator.upsert({
    where: { email: 'operator@example.com' },
    update: { status: 'active' },
    create: {
      email: 'operator@example.com',
      passwordHash: operatorPassword,
      companyName: 'Demo Operator Inc.',
      status: 'active',
    },
  });

  for (const part of [...humanoidParts, ...mascotParts]) {
    await upsertPart(part);
  }

  console.log('Seed completed');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
