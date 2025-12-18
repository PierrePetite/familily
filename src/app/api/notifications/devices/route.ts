import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const deviceSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100),
  type: z.enum(['PUSHOVER', 'NTFY', 'EMAIL']).default('PUSHOVER'),
  userKey: z.string().min(1, 'User Key ist erforderlich'),
  enabled: z.boolean().default(true),
  subscribedMemberIds: z.array(z.string()).default([]),
});

// GET: Alle Notification Devices der Familie
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const devices = await prisma.notificationDevice.findMany({
      where: {
        familyId: session.user.familyId,
      },
      include: {
        subscribedMembers: {
          include: {
            member: {
              select: { id: true, name: true, color: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(devices);
  } catch (error) {
    console.error('Get notification devices error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// POST: Neues Notification Device erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = deviceSchema.parse(body);

    const device = await prisma.notificationDevice.create({
      data: {
        name: validatedData.name,
        type: validatedData.type,
        userKey: validatedData.userKey,
        enabled: validatedData.enabled,
        familyId: session.user.familyId,
        subscribedMembers: {
          create: validatedData.subscribedMemberIds.map((memberId) => ({
            memberId,
          })),
        },
      },
      include: {
        subscribedMembers: {
          include: {
            member: {
              select: { id: true, name: true, color: true },
            },
          },
        },
      },
    });

    return NextResponse.json(device, { status: 201 });
  } catch (error) {
    console.error('Create notification device error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
