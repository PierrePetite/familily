'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Filter } from 'lucide-react';
import { CATEGORIES } from '@/lib/validations/event';
import { useTranslation } from '@/lib/i18n';

interface FamilyMember {
  id: string;
  name: string;
  color: string;
}

interface CalendarFilterProps {
  members: FamilyMember[];
  selectedMembers: string[];
  selectedCategories: string[];
  onMemberToggle: (memberId: string) => void;
  onCategoryToggle: (category: string) => void;
  onClearFilters: () => void;
}

export function CalendarFilter({
  members,
  selectedMembers,
  selectedCategories,
  onMemberToggle,
  onCategoryToggle,
  onClearFilters,
}: CalendarFilterProps) {
  const { t } = useTranslation();
  const hasActiveFilters =
    selectedMembers.length > 0 || selectedCategories.length > 0;

  // Map category values to translation keys
  const getCategoryLabel = (value: string) => {
    const keyMap: Record<string, string> = {
      DOCTOR: 'calendar.categories.doctor',
      SCHOOL: 'calendar.categories.school',
      SPORT: 'calendar.categories.sport',
      WORK: 'calendar.categories.work',
      LEISURE: 'calendar.categories.leisure',
      BIRTHDAY: 'calendar.categories.birthday',
      HOLIDAY: 'calendar.categories.holiday',
      OTHER: 'calendar.categories.other',
    };
    return t(keyMap[value] || value);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filter
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
              {selectedMembers.length + selectedCategories.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filter</h4>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-auto p-0 text-muted-foreground hover:text-foreground"
              >
                {t('common.back')}
              </Button>
            )}
          </div>

          {/* Members Filter */}
          {members.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                {t('family.title')}
              </Label>
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`member-${member.id}`}
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={() => onMemberToggle(member.id)}
                    />
                    <Label
                      htmlFor={`member-${member.id}`}
                      className="flex items-center gap-2 cursor-pointer text-sm"
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: member.color }}
                      />
                      {member.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories Filter */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">{t('calendar.category')}</Label>
            <div className="space-y-2">
              {CATEGORIES.map((cat) => (
                <div key={cat.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${cat.value}`}
                    checked={selectedCategories.includes(cat.value)}
                    onCheckedChange={() => onCategoryToggle(cat.value)}
                  />
                  <Label
                    htmlFor={`category-${cat.value}`}
                    className="cursor-pointer text-sm"
                  >
                    {cat.icon} {getCategoryLabel(cat.value)}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
