'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Plus, Clock, MapPin, Cake, Wallet, Settings } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useTranslation } from '@/lib/i18n';
import { CATEGORY_MAP } from '@/lib/validations/event';
import { BudgetWidget } from '@/components/finance/budget-widget';

interface Event {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date | null;
  allDay: boolean;
  location: string | null;
  category: string;
  participants: {
    member: {
      id: string;
      name: string;
      color: string;
    };
  }[];
}

interface BirthdayMember {
  id: string;
  name: string;
  birthdate: Date | null;
  color: string;
  daysUntil: number;
  isToday: boolean;
}

interface DashboardClientProps {
  userName: string;
  todaysEvents: Event[];
  upcomingEvents: Event[];
  upcomingBirthdays: BirthdayMember[];
}

export function DashboardClient({
  userName,
  todaysEvents,
  upcomingEvents,
  upcomingBirthdays,
}: DashboardClientProps) {
  const { t, language } = useTranslation();
  const today = new Date();
  const dateLocale = language === 'de' ? de : enUS;

  const formatDate = (date: Date, formatStr: string) => {
    return format(date, formatStr, { locale: dateLocale });
  };

  const getEventsCountText = (count: number) => {
    if (count === 0) return t('dashboard.noEventsToday');
    if (count === 1) return t('dashboard.events', { count });
    return t('dashboard.eventsPlural', { count });
  };

  const getUpcomingEventsCountText = (count: number) => {
    if (count === 0) return t('dashboard.noUpcomingEvents');
    if (count === 1) return t('dashboard.events', { count });
    return t('dashboard.eventsPlural', { count });
  };

  const getDaysUntilText = (member: BirthdayMember) => {
    if (member.isToday) return t('dashboard.todayBirthday');
    if (member.daysUntil === 1) return t('dashboard.tomorrow');
    return t('dashboard.inDays', { days: member.daysUntil });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('dashboard.welcome', { name: userName })}</h1>
          <p className="text-muted-foreground">
            {formatDate(today, language === 'de' ? 'EEEE, d. MMMM yyyy' : 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Link href="/calendar">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t('dashboard.newEvent')}
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Today's Events */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              {t('dashboard.today')}
            </CardTitle>
            <CardDescription>{getEventsCountText(todaysEvents.length)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaysEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t('dashboard.enjoyYourDay')}
              </p>
            ) : (
              todaysEvents.map((event) => {
                const category = CATEGORY_MAP[event.category];
                const firstParticipant = event.participants[0]?.member;

                return (
                  <Link
                    key={event.id}
                    href="/calendar"
                    className="block p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    style={{
                      borderLeftWidth: '4px',
                      borderLeftColor: firstParticipant?.color || '#94a3b8',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {category?.icon} {event.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {event.allDay
                            ? t('calendar.allDay')
                            : formatDate(new Date(event.startTime), 'HH:mm')}
                          {event.endTime &&
                            !event.allDay &&
                            ` - ${formatDate(new Date(event.endTime), 'HH:mm')}`}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                      {event.participants.length > 0 && (
                        <div className="flex -space-x-1">
                          {event.participants.slice(0, 3).map((p) => (
                            <div
                              key={p.member.id}
                              className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs text-white font-medium"
                              style={{ backgroundColor: p.member.color }}
                              title={p.member.name}
                            >
                              {p.member.name[0]}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-blue-500" />
              {t('dashboard.next7days')}
            </CardTitle>
            <CardDescription>{getUpcomingEventsCountText(upcomingEvents.length)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t('dashboard.noUpcomingEvents')}
              </p>
            ) : (
              upcomingEvents.map((event) => {
                const category = CATEGORY_MAP[event.category];
                const firstParticipant = event.participants[0]?.member;

                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <div
                      className="w-1 h-10 rounded-full"
                      style={{ backgroundColor: firstParticipant?.color || '#94a3b8' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {category?.icon} {event.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(
                          new Date(event.startTime),
                          language === 'de' ? 'EEE, d. MMM' : 'EEE, MMM d'
                        )}
                        {!event.allDay && ` • ${formatDate(new Date(event.startTime), 'HH:mm')}`}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <Link
              href="/calendar"
              className="block text-center text-sm text-primary hover:underline pt-2"
            >
              {t('dashboard.viewAll')}
            </Link>
          </CardContent>
        </Card>

        {/* Budget Widget */}
        <BudgetWidget />

        {/* Birthdays */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Cake className="h-5 w-5 text-pink-500" />
              {t('dashboard.birthdays')}
            </CardTitle>
            <CardDescription>
              {upcomingBirthdays.length === 0
                ? t('dashboard.noBirthdaysInSight')
                : t('dashboard.upcomingBirthdays')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingBirthdays.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t('dashboard.noBirthdays')}
              </p>
            ) : (
              upcomingBirthdays.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 p-2 rounded ${
                    member.isToday
                      ? 'bg-pink-50 dark:bg-pink-950 border border-pink-200 dark:border-pink-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {member.name}
                      {member.isToday && ' 🎉'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getDaysUntilText(member)}
                      {member.birthdate &&
                        ` • ${formatDate(
                          new Date(member.birthdate),
                          language === 'de' ? 'd. MMMM' : 'MMMM d'
                        )}`}
                    </p>
                  </div>
                </div>
              ))
            )}
            <Link
              href="/family"
              className="block text-center text-sm text-primary hover:underline pt-2"
            >
              {t('dashboard.manageMembers')}
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/calendar" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">{t('dashboard.calendar')}</p>
                <p className="text-sm text-muted-foreground">{t('dashboard.allEvents')}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/family" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">{t('nav.family')}</p>
                <p className="text-sm text-muted-foreground">{t('dashboard.members')}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/finances" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Wallet className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="font-medium">{t('nav.finances')}</p>
                <p className="text-sm text-muted-foreground">{t('dashboard.budgets')}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-2 rounded-lg bg-slate-500/10">
                <Settings className="h-6 w-6 text-slate-500" />
              </div>
              <div>
                <p className="font-medium">{t('nav.settings')}</p>
                <p className="text-sm text-muted-foreground">{t('dashboard.members')}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
