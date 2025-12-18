'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  todoListSchema,
  type TodoListInput,
  LIST_ICONS,
} from '@/lib/validations/todo';
import { cn } from '@/lib/utils';
import { Users, Lock } from 'lucide-react';

interface FamilyMember {
  id: string;
  name: string;
  color: string;
}

interface TodoListFormProps {
  initialData?: {
    id: string;
    name: string;
    description: string | null;
    icon: string;
    isShared?: boolean;
    visibleTo?: Array<{ member: FamilyMember }>;
  };
  members: FamilyMember[];
  onSubmit: (data: TodoListInput) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}

export function TodoListForm({
  initialData,
  members,
  onSubmit,
  onCancel,
  onDelete,
}: TodoListFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(initialData?.icon || '📝');
  const [isShared, setIsShared] = useState(initialData?.isShared ?? true);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    initialData?.visibleTo?.map((v) => v.member.id) || []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TodoListInput>({
    resolver: zodResolver(todoListSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      icon: initialData?.icon || '📝',
      isShared: initialData?.isShared ?? true,
    },
  });

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const onFormSubmit = async (data: TodoListInput) => {
    setIsLoading(true);
    try {
      await onSubmit({
        ...data,
        icon: selectedIcon,
        isShared,
        visibleToIds: isShared ? [] : selectedMembers,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm('Möchten Sie diese Liste wirklich löschen? Alle Einträge werden gelöscht.')) return;

    setIsLoading(true);
    try {
      await onDelete();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Icon Selection */}
      <div className="space-y-2">
        <Label>Symbol</Label>
        <div className="flex flex-wrap gap-2">
          {LIST_ICONS.map((icon) => (
            <button
              key={icon.value}
              type="button"
              onClick={() => setSelectedIcon(icon.value)}
              className={cn(
                'h-10 w-10 text-xl rounded-lg border-2 flex items-center justify-center transition-colors',
                selectedIcon === icon.value
                  ? 'border-primary bg-primary/10'
                  : 'border-transparent bg-muted hover:bg-accent'
              )}
              title={icon.label}
            >
              {icon.value}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="z.B. Einkaufsliste"
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Optional: Beschreibe die Liste..."
          rows={2}
          disabled={isLoading}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Visibility */}
      <div className="space-y-3">
        <Label>Sichtbarkeit</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={isShared ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsShared(true)}
            disabled={isLoading}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-2" />
            Alle
          </Button>
          <Button
            type="button"
            variant={!isShared ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsShared(false)}
            disabled={isLoading}
            className="flex-1"
          >
            <Lock className="h-4 w-4 mr-2" />
            Bestimmte Personen
          </Button>
        </div>

        {!isShared && (
          <div className="space-y-2 pt-2">
            <p className="text-sm text-muted-foreground">
              Wähle aus, wer diese Liste sehen kann:
            </p>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleMember(member.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                    selectedMembers.includes(member.id)
                      ? 'ring-2 ring-offset-2'
                      : 'opacity-50 hover:opacity-80'
                  )}
                  style={{
                    backgroundColor: member.color,
                    color: 'white',
                    '--tw-ring-color': member.color,
                  } as React.CSSProperties}
                  disabled={isLoading}
                >
                  {member.name}
                </button>
              ))}
            </div>
            {selectedMembers.length === 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Hinweis: Du (als Ersteller) kannst diese Liste immer sehen
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <div>
          {onDelete && initialData && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              Löschen
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Speichern...' : initialData ? 'Aktualisieren' : 'Erstellen'}
          </Button>
        </div>
      </div>
    </form>
  );
}
