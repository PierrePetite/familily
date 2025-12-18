import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, addDays, getMonth, getDate } from 'date-fns';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const weekEnd = endOfDay(addDays(today, 7));

  // Fetch today's events
  const todaysEvents = await prisma.event.findMany({
    where: {
      familyId: session.user.familyId,
      startTime: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    include: {
      participants: {
        include: {
          member: {
            select: { id: true, name: true, color: true },
          },
        },
      },
    },
    orderBy: { startTime: 'asc' },
  });

  // Fetch upcoming events (next 7 days, excluding today)
  const upcomingEvents = await prisma.event.findMany({
    where: {
      familyId: session.user.familyId,
      startTime: {
        gt: todayEnd,
        lte: weekEnd,
      },
    },
    include: {
      participants: {
        include: {
          member: {
            select: { id: true, name: true, color: true },
          },
        },
      },
    },
    orderBy: { startTime: 'asc' },
    take: 10,
  });

  // Fetch family members for birthdays
  const members = await prisma.familyMember.findMany({
    where: {
      familyId: session.user.familyId,
      birthdate: { not: null },
    },
    select: {
      id: true,
      name: true,
      birthdate: true,
      color: true,
    },
  });

  // Find upcoming birthdays (within next 30 days)
  const upcomingBirthdays = members
    .filter((member) => {
      if (!member.birthdate) return false;
      const birthMonth = getMonth(member.birthdate);
      const birthDay = getDate(member.birthdate);

      // Check if birthday is within next 30 days
      for (let i = 0; i <= 30; i++) {
        const checkDate = addDays(today, i);
        if (getMonth(checkDate) === birthMonth && getDate(checkDate) === birthDay) {
          return true;
        }
      }
      return false;
    })
    .map((member) => {
      const birthMonth = getMonth(member.birthdate!);
      const birthDay = getDate(member.birthdate!);

      // Calculate days until birthday
      let daysUntil = 0;
      for (let i = 0; i <= 30; i++) {
        const checkDate = addDays(today, i);
        if (getMonth(checkDate) === birthMonth && getDate(checkDate) === birthDay) {
          daysUntil = i;
          break;
        }
      }

      return {
        ...member,
        daysUntil,
        isToday: daysUntil === 0,
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <DashboardClient
      userName={session.user.name || 'User'}
      todaysEvents={todaysEvents.map((e) => ({
        ...e,
        startTime: e.startTime,
        endTime: e.endTime,
      }))}
      upcomingEvents={upcomingEvents.map((e) => ({
        ...e,
        startTime: e.startTime,
        endTime: e.endTime,
      }))}
      upcomingBirthdays={upcomingBirthdays}
    />
  );
}
