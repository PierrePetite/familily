import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { isSetupComplete } from '@/lib/setup';
import { setupSchema } from '@/lib/validations/setup';

export async function GET() {
  try {
    const setupComplete = await isSetupComplete();
    return NextResponse.json({ setupComplete });
  } catch (error) {
    console.error('Setup check error:', error);
    return NextResponse.json({ setupComplete: false });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Prüfen ob Setup bereits abgeschlossen
    const setupComplete = await isSetupComplete();
    if (setupComplete) {
      return NextResponse.json(
        { error: 'Setup wurde bereits durchgeführt' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validierung
    const validationResult = setupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, familyName } = validationResult.data;

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 12);

    // Familie und Admin in einer Transaktion erstellen
    const result = await prisma.$transaction(async (tx) => {
      // Familie erstellen
      const family = await tx.family.create({
        data: {
          name: familyName,
        },
      });

      // Admin-Mitglied erstellen
      const admin = await tx.familyMember.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'ADMIN',
          familyId: family.id,
          color: '#3B82F6',
        },
      });

      return { family, admin };
    });

    return NextResponse.json({
      success: true,
      message: 'Setup erfolgreich abgeschlossen',
      familyId: result.family.id,
      adminId: result.admin.id,
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
