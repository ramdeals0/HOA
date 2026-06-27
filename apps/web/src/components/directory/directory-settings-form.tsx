'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { tenantApi } from '@/lib/api';

export type DirectorySettings = {
  showInDirectory: boolean;
  shareEmail: boolean;
  sharePhone: boolean;
  shareAddress: boolean;
  sharePhoto: boolean;
};

export function DirectorySettingsForm({
  slug,
  initialSettings,
}: {
  slug: string;
  initialSettings: DirectorySettings;
}) {
  const qc = useQueryClient();
  const [settings, setSettings] = useState(initialSettings);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const saveMutation = useMutation({
    mutationFn: (nextSettings: DirectorySettings) =>
      tenantApi<{ directorySettings: DirectorySettings }>(slug, '/account/directory-settings', {
        method: 'PATCH',
        body: JSON.stringify(nextSettings),
      }),
    onSuccess: (response) => {
      setSettings(response.directorySettings);
      setSaved(true);
      setError('');
      qc.invalidateQueries({ queryKey: ['account', slug] });
      qc.invalidateQueries({ queryKey: ['directory', slug] });
    },
    onError: (err) => {
      setSaved(false);
      setError(err instanceof Error ? err.message : 'Failed to save directory settings');
    },
  });

  function updateSetting<K extends keyof DirectorySettings>(key: K, value: DirectorySettings[K]) {
    setSaved(false);
    setSettings((current) => {
      const next = { ...current, [key]: value };
      if (key === 'showInDirectory' && !value) {
        return {
          ...next,
          shareEmail: false,
          sharePhone: false,
          shareAddress: false,
          sharePhoto: false,
        };
      }
      return next;
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neighbor Directory</CardTitle>
        <CardDescription>
          Choose what other logged-in members of your community can see about you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-gray-600">
          The resident directory is only visible to logged-in members of your community. You can
          change these settings at any time.
        </p>

        <label className="flex items-start gap-3 rounded-lg border p-4">
          <input
            type="checkbox"
            className="mt-1"
            checked={settings.showInDirectory}
            onChange={(event) => updateSetting('showInDirectory', event.target.checked)}
          />
          <span>
            <span className="block text-sm font-medium text-gray-900">Show me in the neighbor directory</span>
            <span className="mt-1 block text-sm text-gray-500">
              When enabled, other members can find you in the resident directory.
            </span>
          </span>
        </label>

        <div className={`space-y-3 rounded-lg border p-4 ${settings.showInDirectory ? '' : 'opacity-50'}`}>
          <p className="text-sm font-medium text-gray-900">Share with neighbors</p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={!settings.showInDirectory}
              checked={settings.shareEmail}
              onChange={(event) => updateSetting('shareEmail', event.target.checked)}
            />
            Email address
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={!settings.showInDirectory}
              checked={settings.sharePhone}
              onChange={(event) => updateSetting('sharePhone', event.target.checked)}
            />
            Phone number
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={!settings.showInDirectory}
              checked={settings.shareAddress}
              onChange={(event) => updateSetting('shareAddress', event.target.checked)}
            />
            Home address (street and lot)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={!settings.showInDirectory}
              checked={settings.sharePhoto}
              onChange={(event) => updateSetting('sharePhoto', event.target.checked)}
            />
            Profile photo
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-600">Directory settings saved.</p>}

        <Button
          type="button"
          onClick={() => saveMutation.mutate(settings)}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Saving...' : 'Save directory settings'}
        </Button>
      </CardContent>
    </Card>
  );
}
