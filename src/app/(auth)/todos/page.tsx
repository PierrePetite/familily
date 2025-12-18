'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TodoListCard } from '@/components/todos/todo-list-card';
import { TodoListForm } from '@/components/todos/todo-list-form';
import type { TodoListInput } from '@/lib/validations/todo';
import { useTranslation } from '@/lib/i18n';

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
  assignedTo: { id: string; name: string; color: string } | null;
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

export default function TodosPage() {
  const { t } = useTranslation();
  const [lists, setLists] = useState<TodoList[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<TodoList | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch('/api/members');
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }, []);

  const fetchLists = useCallback(async () => {
    try {
      const response = await fetch('/api/todos');
      if (response.ok) {
        const data = await response.json();
        setLists(data);
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
    fetchLists();
  }, [fetchMembers, fetchLists]);

  const handleCreateList = async (data: TodoListInput) => {
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      await fetchLists();
      setIsDialogOpen(false);
    }
  };

  const handleUpdateList = async (data: TodoListInput) => {
    if (!editingList) return;

    const response = await fetch(`/api/todos/${editingList.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      await fetchLists();
      setEditingList(null);
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm(t('todos.deleteListConfirm', { name: '' }))) return;

    const response = await fetch(`/api/todos/${listId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      await fetchLists();
      setEditingList(null);
    }
  };

  const handleToggleItem = async (listId: string, itemId: string, completed: boolean) => {
    const response = await fetch(`/api/todos/${listId}/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });

    if (response.ok) {
      await fetchLists();
    }
  };

  const handleAddItem = async (listId: string, title: string) => {
    const response = await fetch(`/api/todos/${listId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, listId }),
    });

    if (response.ok) {
      await fetchLists();
    }
  };

  const handleDeleteItem = async (listId: string, itemId: string) => {
    const response = await fetch(`/api/todos/${listId}/items/${itemId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      await fetchLists();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('todos.title')}</h1>
          <p className="text-muted-foreground">
            {t('nav.todos')}
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('todos.newList')}
        </Button>
      </div>

      {/* Lists Grid */}
      {lists.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {lists.map((list) => (
            <TodoListCard
              key={list.id}
              list={list}
              onToggleItem={handleToggleItem}
              onAddItem={handleAddItem}
              onDeleteItem={handleDeleteItem}
              onEditList={setEditingList}
              onDeleteList={handleDeleteList}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg border">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-semibold mb-2">{t('todos.noLists')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('todos.newList')}
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('todos.newList')}
          </Button>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('todos.newList')}</DialogTitle>
          </DialogHeader>
          <TodoListForm
            members={members}
            onSubmit={handleCreateList}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingList} onOpenChange={(open) => !open && setEditingList(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('todos.editList')}</DialogTitle>
          </DialogHeader>
          {editingList && (
            <TodoListForm
              initialData={editingList}
              members={members}
              onSubmit={handleUpdateList}
              onCancel={() => setEditingList(null)}
              onDelete={async () => {
                await handleDeleteList(editingList.id);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
