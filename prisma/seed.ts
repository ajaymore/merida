import { prisma } from '../server/generated/prisma-client';
import { hash } from 'bcryptjs';

async function main() {
  const password = await hash('nooneknows', 10);
  await prisma.createUser({
    email: 'admin@parallellearning.in',
    name: 'Admin',
    blocked: false,
    contactNumber: '1234567890',
    password,
    roles: { create: { name: 'Super Admin' } },
    groups: { create: { name: 'Admins' } }
  });
}

main();
