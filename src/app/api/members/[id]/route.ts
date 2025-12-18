import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { updateMemberSchema } from '@/lib/validations/member';

// GET: Einzelnes Mitglied abrufen
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

    const member = await prisma.familyMember.findFirst({
      where: {
        id: params.id,
        familyId: session.user.familyId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        birthdate: true,
        color: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Mitglied nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('Get member error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// PUT: Mitglied aktualisieren
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

    // Nur Admins dürfen Mitglieder bearbeiten (außer sich selbst)
    const isOwnProfile = session.user.id === params.id;
    if (!isOwnProfile && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Bearbeiten' },
        { status: 403 }
      );
    }

    const body = await request.json();
    body.id = params.id;

    const validationResult = updateMemberSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, birthdate, color, role } = validationResult.data;

    // Prüfen ob Mitglied zur Familie gehört
    const existingMember = await prisma.familyMember.findFirst({
      where: {
        id: params.id,
        familyId: session.user.familyId,
      },
    });

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Mitglied nicht gefunden' },
        { status: 404 }
      );
    }

    // Prüfen ob E-Mail bereits von anderem Mitglied verwendet wird
    if (email && email !== existingMember.email) {
      const emailInUse = await prisma.familyMember.findFirst({
        where: {
          email,
          id: { not: params.id },
        },
      });
      if (emailInUse) {
        return NextResponse.json(
          { error: 'Diese E-Mail-Adresse wird bereits verwendet' },
          { status: 400 }
        );
      }
    }

    // Nicht-Admins dürfen ihre Rolle nicht ändern
    if (!isOwnProfile && role && role !== existingMember.role && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Ändern der Rolle' },
        { status: 403 }
      );
    }

    // Update-Daten vorbereiten
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email || null;
    if (birthdate !== undefined) updateData.birthdate = birthdate ? new Date(birthdate) : null;
    if (color !== undefined) updateData.color = color;
    if (role !== undefined && session.user.role === 'ADMIN') updateData.role = role;
    if (password) updateData.password = await bcrypt.hash(password, 12);

    const member = await prisma.familyMember.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        birthdate: true,
        color: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Update member error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// DELETE: Mitglied löschen
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

    // Nur Admins dürfen Mitglieder löschen
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nur Administratoren können Mitglieder löschen' },
        { status: 403 }
      );
    }

    // Sich selbst kann man nicht löschen
    if (session.user.id === params.id) {
      return NextResponse.json(
        { error: 'Du kannst dich nicht selbst löschen' },
        { status: 400 }
      );
    }

    // Prüfen ob Mitglied zur Familie gehört
    const existingMember = await prisma.familyMember.findFirst({
      where: {
        id: params.id,
        familyId: session.user.familyId,
      },
    });

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Mitglied nicht gefunden' },
        { status: 404 }
      );
    }

    await prisma.familyMember.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete member error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
