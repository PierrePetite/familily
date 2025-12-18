'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { changePasswordSchema, type ChangePasswordFormData } from '@/lib/validations/auth';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  CheckCircle2,
  Bell,
  Calendar,
  Plus,
  Trash2,
  Copy,
  RefreshCw,
  Send,
  Globe,
  ExternalLink,
  CheckCircle,
  XCircle,
  Languages,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NotificationDevice {
  id: string;
  name: string;
  type: string;
  userKey: string;
  enabled: boolean;
  subscribedMembers: Array<{
    member: { id: string; name: string; color: string };
  }>;
}

interface FamilyMember {
  id: string;
  name: string;
  color: string;
}

interface CalendarFeed {
  id: string;
  token: string;
  name: string;
  enabled: boolean;
  lastAccessed: string | null;
  member: { id: string; name: string; color: string } | null;
}

interface AppSettings {
  pushoverAppToken: string | null;
  defaultReminderMin: number;
  externalUrl: string | null;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'password' | 'notifications' | 'calendar' | 'external' | 'language'>('password');
  const { t, language, setLanguage } = useTranslation();

  // Password state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Notification state
  const [devices, setDevices] = useState<NotificationDevice[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [isDeviceDialogOpen, setIsDeviceDialogOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceUserKey, setNewDeviceUserKey] = useState('');
  const [newDeviceMembers, setNewDeviceMembers] = useState<string[]>([]);
  const [pushoverToken, setPushoverToken] = useState('');
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [testingDeviceId, setTestingDeviceId] = useState<string | null>(null);

  // Calendar feed state
  const [feeds, setFeeds] = useState<CalendarFeed[]>([]);
  const [isFeedDialogOpen, setIsFeedDialogOpen] = useState(false);
  const [newFeedName, setNewFeedName] = useState('');
  const [newFeedMemberId, setNewFeedMemberId] = useState<string | null>(null);

  // External access state
  const [externalUrl, setExternalUrl] = useState('');
  const [isSavingExternalUrl, setIsSavingExternalUrl] = useState(false);
  const [isTestingUrl, setIsTestingUrl] = useState(false);
  const [urlTestResult, setUrlTestResult] = useState<'success' | 'error' | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const fetchDevices = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/devices');
      if (response.ok) {
        const data = await response.json();
        setDevices(data);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch('/api/members');
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/settings');
      if (response.ok) {
        const data = await response.json();
        setAppSettings(data);
        setPushoverToken(data.pushoverAppToken || '');
        setExternalUrl(data.externalUrl || '');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  }, []);

  const fetchFeeds = useCallback(async () => {
    try {
      const response = await fetch('/api/calendar/feeds');
      if (response.ok) {
        const data = await response.json();
        setFeeds(data);
      }
    } catch (err) {
      console.error('Error fetching feeds:', err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchDevices();
      fetchMembers();
      fetchSettings();
    } else if (activeTab === 'calendar') {
      fetchFeeds();
      fetchMembers();
      fetchSettings();
    } else if (activeTab === 'external') {
      fetchSettings();
      fetchFeeds();
    }
  }, [activeTab, fetchDevices, fetchMembers, fetchSettings, fetchFeeds]);

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Fehler beim Ändern des Passworts');
      }

      setSuccess(true);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePushoverToken = async () => {
    setIsSavingToken(true);
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pushoverAppToken: pushoverToken || null }),
      });

      if (response.ok) {
        await fetchSettings();
      }
    } catch (err) {
      console.error('Error saving token:', err);
    } finally {
      setIsSavingToken(false);
    }
  };

  const handleCreateDevice = async () => {
    if (!newDeviceName || !newDeviceUserKey) return;

    try {
      const response = await fetch('/api/notifications/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDeviceName,
          userKey: newDeviceUserKey,
          subscribedMemberIds: newDeviceMembers,
        }),
      });

      if (response.ok) {
        await fetchDevices();
        setIsDeviceDialogOpen(false);
        setNewDeviceName('');
        setNewDeviceUserKey('');
        setNewDeviceMembers([]);
      }
    } catch (err) {
      console.error('Error creating device:', err);
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!confirm('Gerät wirklich löschen?')) return;

    try {
      await fetch(`/api/notifications/devices/${id}`, { method: 'DELETE' });
      await fetchDevices();
    } catch (err) {
      console.error('Error deleting device:', err);
    }
  };

  const handleTestDevice = async (id: string) => {
    setTestingDeviceId(id);
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: id }),
      });

      const result = await response.json();
      if (response.ok) {
        alert('Test-Benachrichtigung gesendet!');
      } else {
        alert(`Fehler: ${result.error}`);
      }
    } catch (err) {
      console.error('Error testing device:', err);
      alert('Fehler beim Senden');
    } finally {
      setTestingDeviceId(null);
    }
  };

  const handleCreateFeed = async () => {
    if (!newFeedName) return;

    try {
      const response = await fetch('/api/calendar/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFeedName,
          memberId: newFeedMemberId,
        }),
      });

      if (response.ok) {
        await fetchFeeds();
        setIsFeedDialogOpen(false);
        setNewFeedName('');
        setNewFeedMemberId(null);
      }
    } catch (err) {
      console.error('Error creating feed:', err);
    }
  };

  const handleDeleteFeed = async (id: string) => {
    if (!confirm('Feed wirklich löschen?')) return;

    try {
      await fetch(`/api/calendar/feeds/${id}`, { method: 'DELETE' });
      await fetchFeeds();
    } catch (err) {
      console.error('Error deleting feed:', err);
    }
  };

  const handleRegenerateFeedToken = async (id: string) => {
    if (!confirm('Token erneuern? Die alte URL funktioniert dann nicht mehr.')) return;

    try {
      await fetch(`/api/calendar/feeds/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerateToken: true }),
      });
      await fetchFeeds();
    } catch (err) {
      console.error('Error regenerating token:', err);
    }
  };

  const copyFeedUrl = (token: string, useExternal = false) => {
    const baseUrl = useExternal && appSettings?.externalUrl
      ? appSettings.externalUrl
      : (typeof window !== 'undefined' ? window.location.origin : '');
    const url = `${baseUrl}/api/calendar/ical/${token}`;
    navigator.clipboard.writeText(url);
    alert('URL kopiert!');
  };

  const handleSaveExternalUrl = async () => {
    setIsSavingExternalUrl(true);
    setUrlTestResult(null);
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ externalUrl: externalUrl || null }),
      });

      if (response.ok) {
        await fetchSettings();
      }
    } catch (err) {
      console.error('Error saving external URL:', err);
    } finally {
      setIsSavingExternalUrl(false);
    }
  };

  const handleTestExternalUrl = async () => {
    if (!externalUrl) return;

    setIsTestingUrl(true);
    setUrlTestResult(null);

    try {
      // Try to fetch the manifest.json from the external URL as a connectivity test
      const testUrl = `${externalUrl}/manifest.json`;
      await fetch(testUrl, {
        mode: 'no-cors',
        cache: 'no-store',
      });
      // With no-cors, we can't read the response, but if it doesn't throw, connection worked
      setUrlTestResult('success');
    } catch {
      setUrlTestResult('error');
    } finally {
      setIsTestingUrl(false);
    }
  };

  const getLocalUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'http://localhost:3000';
  };

  const tabs = [
    { id: 'password', label: t('settings.password'), icon: Lock },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
    { id: 'calendar', label: t('settings.calendarFeeds'), icon: Calendar },
    { id: 'external', label: t('settings.externalAccess'), icon: Globe },
    { id: 'language', label: t('settings.language'), icon: Languages },
  ] as const;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">{t('settings.title')}</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 -mb-px transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Password Tab */}
        {activeTab === 'password' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Passwort ändern
              </CardTitle>
              <CardDescription>
                Ändere dein Passwort für mehr Sicherheit
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success && (
                <div className="mb-4 p-3 rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Passwort erfolgreich geändert!
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      {...register('currentPassword')}
                      className={errors.currentPassword ? 'border-destructive pr-10' : 'pr-10'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Neues Passwort</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      {...register('newPassword')}
                      className={errors.newPassword ? 'border-destructive pr-10' : 'pr-10'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Neues Passwort bestätigen</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...register('confirmPassword')}
                      className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird geändert...
                    </>
                  ) : (
                    'Passwort ändern'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* Pushover App Token */}
            <Card>
              <CardHeader>
                <CardTitle>Pushover App Token</CardTitle>
                <CardDescription>
                  Erstelle eine App auf{' '}
                  <a href="https://pushover.net/apps/build" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    pushover.net
                  </a>{' '}
                  und trage den Token hier ein
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="App Token"
                    value={pushoverToken}
                    onChange={(e) => setPushoverToken(e.target.value)}
                  />
                  <Button onClick={handleSavePushoverToken} disabled={isSavingToken}>
                    {isSavingToken ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Speichern'}
                  </Button>
                </div>
                {appSettings?.pushoverAppToken && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    <CheckCircle2 className="h-4 w-4 inline mr-1" />
                    Token konfiguriert
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Devices */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Benachrichtigungs-Geräte</CardTitle>
                  <CardDescription>
                    Geräte die Benachrichtigungen empfangen
                  </CardDescription>
                </div>
                <Button onClick={() => setIsDeviceDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Gerät hinzufügen
                </Button>
              </CardHeader>
              <CardContent>
                {devices.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Noch keine Geräte konfiguriert
                  </p>
                ) : (
                  <div className="space-y-4">
                    {devices.map((device) => (
                      <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{device.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Empfängt für:{' '}
                            {device.subscribedMembers.length === 0
                              ? 'Niemand'
                              : device.subscribedMembers.map((s) => s.member.name).join(', ')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestDevice(device.id)}
                            disabled={testingDeviceId === device.id || !appSettings?.pushoverAppToken}
                          >
                            {testingDeviceId === device.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDevice(device.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Calendar Feeds Tab */}
        {activeTab === 'calendar' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Kalender-Feeds</CardTitle>
                <CardDescription>
                  iCal URLs für externe Kalender-Apps (Apple, Google, etc.)
                </CardDescription>
              </div>
              <Button onClick={() => setIsFeedDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Feed erstellen
              </Button>
            </CardHeader>
            <CardContent>
              {feeds.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Noch keine Feeds erstellt
                </p>
              ) : (
                <div className="space-y-4">
                  {feeds.map((feed) => (
                    <div key={feed.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{feed.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {feed.member ? `Nur ${feed.member.name}` : 'Alle Familienmitglieder'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => copyFeedUrl(feed.token)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleRegenerateFeedToken(feed.id)}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteFeed(feed.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="bg-muted p-2 rounded text-xs font-mono break-all">
                        {`${typeof window !== 'undefined' ? window.location.origin : ''}/api/calendar/ical/${feed.token}`}
                      </div>
                      {feed.lastAccessed && (
                        <p className="text-xs text-muted-foreground">
                          Zuletzt abgerufen: {new Date(feed.lastAccessed).toLocaleString('de-DE')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* External Access Tab */}
        {activeTab === 'external' && (
          <div className="space-y-6">
            {/* External URL Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Externe URL konfigurieren
                </CardTitle>
                <CardDescription>
                  Trage hier deine Tailscale-IP oder externe Domain ein, um von unterwegs auf Familily zuzugreifen.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="z.B. http://100.78.42.15:3000"
                    value={externalUrl}
                    onChange={(e) => {
                      setExternalUrl(e.target.value);
                      setUrlTestResult(null);
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={handleTestExternalUrl}
                    disabled={isTestingUrl || !externalUrl}
                  >
                    {isTestingUrl ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Testen'
                    )}
                  </Button>
                  <Button onClick={handleSaveExternalUrl} disabled={isSavingExternalUrl}>
                    {isSavingExternalUrl ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Speichern'
                    )}
                  </Button>
                </div>
                {urlTestResult === 'success' && (
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Verbindung erfolgreich
                  </p>
                )}
                {urlTestResult === 'error' && (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Verbindung fehlgeschlagen - Prüfe die URL und Tailscale-Verbindung
                  </p>
                )}
                {appSettings?.externalUrl && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Gespeichert: {appSettings.externalUrl}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Setup Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Tailscale einrichten</CardTitle>
                <CardDescription>
                  Tailscale ermöglicht sicheren Zugriff von überall - ohne Port-Forwarding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-3 text-sm">
                  <li>
                    <strong>Server:</strong> Installiere Tailscale auf dem Server wo Familily läuft
                    <div className="ml-5 mt-1 bg-muted p-2 rounded font-mono text-xs">
                      curl -fsSL https://tailscale.com/install.sh | sh<br />
                      sudo tailscale up
                    </div>
                  </li>
                  <li>
                    <strong>iPhone:</strong> Installiere die Tailscale App aus dem App Store
                  </li>
                  <li>
                    <strong>Anmelden:</strong> Melde dich auf beiden Geräten mit dem gleichen Account an
                  </li>
                  <li>
                    <strong>IP finden:</strong> Führe <code className="bg-muted px-1 rounded">tailscale ip</code> auf dem Server aus
                  </li>
                  <li>
                    <strong>URL eintragen:</strong> Trage oben die URL ein, z.B. <code className="bg-muted px-1 rounded">http://100.x.x.x:3000</code>
                  </li>
                </ol>
                <a
                  href="https://tailscale.com/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Tailscale herunterladen
                </a>
              </CardContent>
            </Card>

            {/* Feed URLs with external access */}
            {feeds.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Deine iCal-Feed URLs</CardTitle>
                  <CardDescription>
                    Nutze die externen URLs für dein iPhone (wenn Tailscale konfiguriert ist)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {feeds.map((feed) => (
                    <div key={feed.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{feed.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {feed.member ? `Nur ${feed.member.name}` : 'Alle Familienmitglieder'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Lokal (im WLAN):</p>
                          <div className="flex gap-2">
                            <div className="flex-1 bg-muted p-2 rounded text-xs font-mono break-all">
                              {getLocalUrl()}/api/calendar/ical/{feed.token}
                            </div>
                            <Button variant="outline" size="sm" onClick={() => copyFeedUrl(feed.token, false)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {appSettings?.externalUrl && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Extern (Tailscale):</p>
                            <div className="flex gap-2">
                              <div className="flex-1 bg-primary/10 p-2 rounded text-xs font-mono break-all">
                                {appSettings.externalUrl}/api/calendar/ical/{feed.token}
                              </div>
                              <Button variant="outline" size="sm" onClick={() => copyFeedUrl(feed.token, true)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {!appSettings?.externalUrl && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Konfiguriere oben eine externe URL, um die externen Feed-URLs zu sehen.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* New Device Dialog */}
        <Dialog open={isDeviceDialogOpen} onOpenChange={setIsDeviceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neues Gerät hinzufügen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Gerätename</Label>
                <Input
                  placeholder="z.B. Papa's iPhone"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Pushover User Key</Label>
                <Input
                  placeholder="User Key von pushover.net"
                  value={newDeviceUserKey}
                  onChange={(e) => setNewDeviceUserKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Benachrichtigungen empfangen für:</Label>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`member-${member.id}`}
                        checked={newDeviceMembers.includes(member.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewDeviceMembers([...newDeviceMembers, member.id]);
                          } else {
                            setNewDeviceMembers(newDeviceMembers.filter((id) => id !== member.id));
                          }
                        }}
                      />
                      <Label htmlFor={`member-${member.id}`} className="flex items-center gap-2">
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
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDeviceDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleCreateDevice} disabled={!newDeviceName || !newDeviceUserKey}>
                  Hinzufügen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* New Feed Dialog */}
        <Dialog open={isFeedDialogOpen} onOpenChange={setIsFeedDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Feed erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Feed-Name</Label>
                <Input
                  placeholder="z.B. Familienkalender"
                  value={newFeedName}
                  onChange={(e) => setNewFeedName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Termine für:</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="feed-all"
                      checked={newFeedMemberId === null}
                      onCheckedChange={(checked) => {
                        if (checked) setNewFeedMemberId(null);
                      }}
                    />
                    <Label htmlFor="feed-all">Alle Familienmitglieder</Label>
                  </div>
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`feed-member-${member.id}`}
                        checked={newFeedMemberId === member.id}
                        onCheckedChange={(checked) => {
                          if (checked) setNewFeedMemberId(member.id);
                        }}
                      />
                      <Label htmlFor={`feed-member-${member.id}`} className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: member.color }}
                        />
                        Nur {member.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsFeedDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleCreateFeed} disabled={!newFeedName}>
                  {t('common.create')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Language Tab */}
        {activeTab === 'language' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                {t('settings.languageLabel')}
              </CardTitle>
              <CardDescription>
                {t('settings.languageHint')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-3">
                  <button
                    onClick={() => setLanguage('de')}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                      language === 'de'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="text-2xl">🇩🇪</span>
                    <div className="text-left">
                      <p className="font-medium">{t('settings.german')}</p>
                      <p className="text-sm text-muted-foreground">German</p>
                    </div>
                    {language === 'de' && (
                      <CheckCircle className="h-5 w-5 text-primary ml-auto" />
                    )}
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                      language === 'en'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="text-2xl">🇬🇧</span>
                    <div className="text-left">
                      <p className="font-medium">{t('settings.english')}</p>
                      <p className="text-sm text-muted-foreground">English</p>
                    </div>
                    {language === 'en' && (
                      <CheckCircle className="h-5 w-5 text-primary ml-auto" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
