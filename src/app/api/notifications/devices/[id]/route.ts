import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const updateDeviceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  userKey: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
  subscribedMemberIds: z.array(z.string()).optional(),
});

// GET: Ein Device abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const device = await prisma.notificationDevice.findFirst({
      where: {
        id: params.id,
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
    });

    if (!device) {
      return NextResponse.json(
        { error: 'Gerät nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(device);
  } catch (error) {
    console.error('Get notification device error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// PUT: Device aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const existingDevice = await prisma.notificationDevice.findFirst({
      where: {
        id: params.id,
        familyId: session.user.familyId,
      },
    });

    if (!existingDevice) {
      return NextResponse.json(
        { error: 'Gerät nicht gefunden' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateDeviceSchema.parse(body);

    // Update subscriptions if provided
    if (validatedData.subscribedMemberIds !== undefined) {
      // Delete existing subscriptions
      await prisma.notificationSubscription.deleteMany({
        where: { deviceId: params.id },
      });

      // Create new subscriptions
      if (validatedData.subscribedMemberIds.length > 0) {
        await prisma.notificationSubscription.createMany({
          data: validatedData.subscribedMemberIds.map((memberId) => ({
            deviceId: params.id,
            memberId,
          })),
        });
      }
    }

    const device = await prisma.notificationDevice.update({
      where: { id: params.id },
      data: {
        name: validatedData.name,
        userKey: validatedData.userKey,
        enabled: validatedData.enabled,
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

    return NextResponse.json(device);
  } catch (error) {
    console.error('Update notification device error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// DELETE: Device löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const existingDevice = await prisma.notificationDevice.findFirst({
      where: {
        id: params.id,
        familyId: session.user.familyId,
      },
    });

    if (!existingDevice) {
      return NextResponse.json(
        { error: 'Gerät nicht gefunden' },
        { status: 404 }
      );
    }

    await prisma.notificationDevice.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete notification device error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
