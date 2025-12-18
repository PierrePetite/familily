import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { createMemberSchema } from '@/lib/validations/member';

// GET: Liste aller Familienmitglieder
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const members = await prisma.familyMember.findMany({
      where: { familyId: session.user.familyId },
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
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Get members error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// POST: Neues Familienmitglied erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    // Nur Admins dürfen Mitglieder erstellen
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nur Administratoren können Mitglieder hinzufügen' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const validationResult = createMemberSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, birthdate, color, role } = validationResult.data;

    // Prüfen ob E-Mail bereits existiert
    if (email) {
      const existingMember = await prisma.familyMember.findUnique({
        where: { email },
      });
      if (existingMember) {
        return NextResponse.json(
          { error: 'Diese E-Mail-Adresse wird bereits verwendet' },
          { status: 400 }
        );
      }
    }

    // Passwort hashen falls vorhanden
    const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

    const member = await prisma.familyMember.create({
      data: {
        name,
        email: email || null,
        password: hashedPassword,
        birthdate: birthdate ? new Date(birthdate) : null,
        color,
        role,
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

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Create member error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
