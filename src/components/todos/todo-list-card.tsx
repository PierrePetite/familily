'use client';

import { useState } from 'react';
import { Check, Trash2, Edit2, Plus, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PRIORITIES } from '@/lib/validations/todo';

interface FamilyMember {
  id: string;
  name: string;
  color: string;
}

interface TodoItem {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  completedAt: string | null;
  dueDate: string | null;
  priority: string;
  assignedTo: FamilyMember | null;
  completedBy: { id: string; name: string } | null;
}

interface TodoList {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  isShared: boolean;
  visibleTo?: Array<{ member: FamilyMember }>;
  items: TodoItem[];
  completedCount: number;
  totalCount: number;
}

interface TodoListCardProps {
  list: TodoList;
  onToggleItem: (listId: string, itemId: string, completed: boolean) => Promise<void>;
  onAddItem: (listId: string, title: string) => Promise<void>;
  onDeleteItem: (listId: string, itemId: string) => Promise<void>;
  onEditList: (list: TodoList) => void;
  onDeleteList: (listId: string) => void;
}

export function TodoListCard({
  list,
  onToggleItem,
  onAddItem,
  onDeleteItem,
  onEditList,
  onDeleteList,
}: TodoListCardProps) {
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return;

    setIsAddingItem(true);
    try {
      await onAddItem(list.id, newItemTitle);
      setNewItemTitle('');
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleToggleItem = async (itemId: string, completed: boolean) => {
    setLoadingItems((prev) => new Set(prev).add(itemId));
    try {
      await onToggleItem(list.id, itemId, completed);
    } finally {
      setLoadingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    const p = PRIORITIES.find((pr) => pr.value === priority);
    return p?.color || '#3b82f6';
  };

  const activeItems = list.items.filter((item) => !item.completed);
  const completedItems = list.items.filter((item) => item.completed);

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-muted/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{list.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{list.name}</h3>
              {!list.isShared && (
                <span title="Private Liste">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
              )}
            </div>
            {list.description && (
              <p className="text-sm text-muted-foreground">{list.description}</p>
            )}
            {!list.isShared && list.visibleTo && list.visibleTo.length > 0 && (
              <div className="flex items-center gap-1 mt-1">
                {list.visibleTo.map((v) => (
                  <span
                    key={v.member.id}
                    className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: v.member.color }}
                    title={v.member.name}
                  >
                    {v.member.name.charAt(0)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {list.completedCount}/{list.totalCount}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEditList(list)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDeleteList(list.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Add Item */}
      <div className="p-3 border-b">
        <div className="flex gap-2">
          <Input
            placeholder="Neues Element hinzufügen..."
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddItem();
              }
            }}
            disabled={isAddingItem}
          />
          <Button
            size="icon"
            onClick={handleAddItem}
            disabled={isAddingItem || !newItemTitle.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Items */}
      <div className="divide-y">
        {/* Active Items */}
        {activeItems.map((item) => (
          <div
            key={item.id}
            className={cn(
              'p-3 flex items-start gap-3 hover:bg-accent/50 transition-colors',
              loadingItems.has(item.id) && 'opacity-50'
            )}
          >
            <button
              onClick={() => handleToggleItem(item.id, true)}
              disabled={loadingItems.has(item.id)}
              className="mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 hover:border-primary transition-colors"
              style={{ borderColor: getPriorityColor(item.priority) }}
            >
              {loadingItems.has(item.id) && (
                <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{item.title}</p>
              {item.description && (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                {item.assignedTo && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: item.assignedTo.color }}
                  >
                    {item.assignedTo.name}
                  </span>
                )}
                {item.dueDate && (
                  <span className="text-xs text-muted-foreground">
                    Fällig: {new Date(item.dueDate).toLocaleDateString('de-DE')}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => onDeleteItem(list.id, item.id)}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}

        {/* Completed Items */}
        {completedItems.length > 0 && (
          <div className="bg-muted/30">
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Erledigt ({completedItems.length})
            </div>
            {completedItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'p-3 flex items-start gap-3 hover:bg-accent/30 transition-colors',
                  loadingItems.has(item.id) && 'opacity-50'
                )}
              >
                <button
                  onClick={() => handleToggleItem(item.id, false)}
                  disabled={loadingItems.has(item.id)}
                  className="mt-0.5 h-5 w-5 rounded bg-green-500 flex items-center justify-center shrink-0"
                >
                  {loadingItems.has(item.id) ? (
                    <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-muted-foreground line-through">
                    {item.title}
                  </p>
                  {item.completedBy && (
                    <p className="text-xs text-muted-foreground">
                      Erledigt von {item.completedBy.name}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => onDeleteItem(list.id, item.id)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {list.items.length === 0 && (
          <div className="p-6 text-center text-muted-foreground">
            <p>Keine Einträge vorhanden</p>
            <p className="text-sm">Füge oben ein neues Element hinzu</p>
          </div>
        )}
      </div>
    </div>
  );
}
