import prisma from '@/lib/prisma';

export async function isSetupComplete(): Promise<boolean> {
  try {
    const familyCount = await prisma.family.count();
    return familyCount > 0;
  } catch (error) {
    console.error('Setup check failed:', error);
    return false;
  }
}

export async function getFirstFamily() {
  return prisma.family.findFirst({
    include: {
      members: true,
    },
  });
}
