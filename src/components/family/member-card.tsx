'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ROLE_LABELS } from '@/lib/validations/member';
import { Pencil, Trash2, Mail, Calendar } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string | null;
  birthdate: string | null;
  color: string;
  role: string;
}

interface MemberCardProps {
  member: Member;
  isCurrentUser: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function MemberCard({
  member,
  isCurrentUser,
  canEdit,
  onEdit,
  onDelete,
}: MemberCardProps) {
  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Card className="overflow-hidden">
      <div className="h-2" style={{ backgroundColor: member.color }} />
      <CardContent className="pt-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback style={{ backgroundColor: member.color, color: 'white' }}>
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold truncate">{member.name}</h3>
              {isCurrentUser && (
                <Badge variant="secondary" className="text-xs">
                  Du
                </Badge>
              )}
            </div>

            <Badge variant="outline" className="mt-1">
              {ROLE_LABELS[member.role] || member.role}
            </Badge>

            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              {member.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{member.email}</span>
                </div>
              )}
              {member.birthdate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(member.birthdate)}</span>
                </div>
              )}
            </div>
          </div>

          {canEdit && (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
              {!isCurrentUser && (
                <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
