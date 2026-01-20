import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    const newPassword = '1234!@#$';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await prisma.member.update({
      where: { username: 'admin' },
      data: { password: hashedPassword },
      select: { id: true, username: true, name: true, grade: true },
    });

    console.log('✅ Admin password updated successfully:');
    console.log(`   Username: ${result.username}`);
    console.log(`   Name: ${result.name}`);
    console.log(`   Grade: ${result.grade}`);
    console.log(`   New Password: ${newPassword}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error updating admin password:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

updateAdminPassword();
