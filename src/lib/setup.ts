import prisma from '@/lib/prisma';

export async function isSetupComplete(): Promise<boolean> {
  try {
    const familyCount = await prisma.family.count();
    console.log('[Setup Check] Family count:', familyCount);
    return familyCount > 0;
  } catch (error) {
    console.error('[Setup Check] Failed to check setup status:', error);
    // If we can't check, assume setup is complete to avoid redirect loop
    // Users can manually go to /setup if needed
    return true;
  }
}

export async function getFirstFamily() {
  return prisma.family.findFirst({
    include: {
      members: true,
    },
  });
}
