import { NextResponse } from 'next/server';
import { isSetupComplete } from '@/lib/setup';

export async function GET() {
  try {
    const setupComplete = await isSetupComplete();
    return NextResponse.json({ setupComplete });
  } catch (error) {
    console.error('Setup status check error:', error);
    return NextResponse.json({ setupComplete: false });
  }
}

export const dynamic = 'force-dynamic';
