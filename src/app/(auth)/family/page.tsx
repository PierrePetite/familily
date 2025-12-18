'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MemberForm } from '@/components/family/member-form';
import { MemberCard } from '@/components/family/member-card';
import { type MemberFormData, MEMBER_COLORS } from '@/lib/validations/member';
import { ArrowLeft, Plus, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

interface Member {
  id: string;
  name: string;
  email: string | null;
  birthdate: string | null;
  color: string;
  role: string;
}

export default function FamilyPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch('/api/members');
      if (!response.ok) throw new Error(t('common.error'));
      const data = await response.json();
      setMembers(data);
    } catch {
      setError(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleCreate = async (data: MemberFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('common.error'));
      }

      setMembers((prev) => [...prev, result]);
      setIsCreateDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: MemberFormData) => {
    if (!selectedMember) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/members/${selectedMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('common.error'));
      }

      setMembers((prev) =>
        prev.map((m) => (m.id === selectedMember.id ? result : m))
      );
      setIsEditDialogOpen(false);
      setSelectedMember(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMember) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/members/${selectedMember.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || t('common.error'));
      }

      setMembers((prev) => prev.filter((m) => m.id !== selectedMember.id));
      setIsDeleteDialogOpen(false);
      setSelectedMember(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = session?.user?.role === 'ADMIN';

  // Nächste freie Farbe
  const getNextColor = () => {
    const usedColors = members.map((m) => m.color);
    return MEMBER_COLORS.find((c) => !usedColors.includes(c)) || MEMBER_COLORS[0];
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Link>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              {t('family.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('family.subtitle')}
            </p>
          </div>

          {isAdmin && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('family.addMember')}
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-md bg-destructive/10 text-destructive">
            {error}
          </div>
        )}

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : members.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('family.noMembers')}</CardTitle>
              <CardDescription>
                {t('family.addMember')}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isCurrentUser={member.id === session?.user?.id}
                canEdit={isAdmin || member.id === session?.user?.id}
                onEdit={() => {
                  setSelectedMember(member);
                  setIsEditDialogOpen(true);
                }}
                onDelete={() => {
                  setSelectedMember(member);
                  setIsDeleteDialogOpen(true);
                }}
              />
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('family.addMember')}</DialogTitle>
              <DialogDescription>
                {t('family.subtitle')}
              </DialogDescription>
            </DialogHeader>
            <MemberForm
              defaultValues={{ color: getNextColor() }}
              onSubmit={handleCreate}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={isSubmitting}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('family.editMember')}</DialogTitle>
              <DialogDescription>
                {selectedMember?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedMember && (
              <MemberForm
                defaultValues={{
                  name: selectedMember.name,
                  email: selectedMember.email || '',
                  birthdate: selectedMember.birthdate?.split('T')[0] || '',
                  color: selectedMember.color,
                  role: selectedMember.role as MemberFormData['role'],
                }}
                onSubmit={handleUpdate}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setSelectedMember(null);
                }}
                isLoading={isSubmitting}
                isEdit
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('family.deleteMember')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('family.deleteMemberConfirm', { name: selectedMember?.name || '' })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedMember(null)}>
                {t('common.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('common.delete')
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
