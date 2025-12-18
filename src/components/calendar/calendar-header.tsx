'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { CalendarFilter } from './calendar-filter';
import { useTranslation } from '@/lib/i18n';

type ViewType = 'month' | 'week' | 'day';

interface FamilyMember {
  id: string;
  name: string;
  color: string;
}

interface CalendarHeaderProps {
  currentDate: Date;
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onCreateEvent: () => void;
  members: FamilyMember[];
  selectedMembers: string[];
  selectedCategories: string[];
  onMemberToggle: (memberId: string) => void;
  onCategoryToggle: (category: string) => void;
  onClearFilters: () => void;
}

export function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  onCreateEvent,
  members,
  selectedMembers,
  selectedCategories,
  onMemberToggle,
  onCategoryToggle,
  onClearFilters,
}: CalendarHeaderProps) {
  const { t, language } = useTranslation();
  const dateLocale = language === 'de' ? de : enUS;

  const getTitle = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: dateLocale });
      case 'week':
        return language === 'de'
          ? `KW ${format(currentDate, 'w', { locale: dateLocale })} - ${format(currentDate, 'MMMM yyyy', { locale: dateLocale })}`
          : `Week ${format(currentDate, 'w', { locale: dateLocale })} - ${format(currentDate, 'MMMM yyyy', { locale: dateLocale })}`;
      case 'day':
        return format(currentDate, language === 'de' ? 'EEEE, d. MMMM yyyy' : 'EEEE, MMMM d, yyyy', { locale: dateLocale });
      default:
        return format(currentDate, 'MMMM yyyy', { locale: dateLocale });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onToday}>
          <CalendarIcon className="h-4 w-4 mr-2" />
          {t('common.today')}
        </Button>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onPrevious}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onNext}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <h2 className="text-xl font-semibold capitalize">{getTitle()}</h2>
      </div>

      <div className="flex items-center gap-2">
        <CalendarFilter
          members={members}
          selectedMembers={selectedMembers}
          selectedCategories={selectedCategories}
          onMemberToggle={onMemberToggle}
          onCategoryToggle={onCategoryToggle}
          onClearFilters={onClearFilters}
        />

        <div className="flex rounded-lg border overflow-hidden">
          {(['month', 'week', 'day'] as ViewType[]).map((v) => (
            <Button
              key={v}
              variant={view === v ? 'default' : 'ghost'}
              className="rounded-none"
              onClick={() => onViewChange(v)}
            >
              {t(`calendar.views.${v}`)}
            </Button>
          ))}
        </div>

        <Button onClick={onCreateEvent}>
          <Plus className="h-4 w-4 mr-2" />
          {t('calendar.newEvent')}
        </Button>
      </div>
    </div>
  );
}
