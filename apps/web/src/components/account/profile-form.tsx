'use client';

import { apiErrorCode } from '@dedale/api-client';
import type { Me } from '@dedale/contracts';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api/browser';
import { Button } from '../ui/button';
import { Field, Input, NativeSelect, Textarea } from '../ui/field';

export function ProfileForm({ me }: { me: Me }) {
  const t = useTranslations('account');
  const tc = useTranslations('common');
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    try {
      await api.account.updateProfile({
        handle: String(form.get('handle')),
        displayName: String(form.get('displayName')),
        bio: String(form.get('bio') ?? '') || null,
        locale: form.get('locale') === 'en' ? 'en' : 'fr',
      });
      toast.success(t('profileSaved'));
      router.refresh();
    } catch (caught) {
      setError(
        apiErrorCode(caught) === 'CONFLICT' ? t('handleTaken') : String((caught as Error).message),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('displayName')} htmlFor="displayName">
          <Input
            id="displayName"
            name="displayName"
            defaultValue={me.profile.displayName}
            required
            maxLength={60}
          />
        </Field>
        <Field label={t('handle')} htmlFor="handle" error={error}>
          <Input
            id="handle"
            name="handle"
            defaultValue={me.profile.handle}
            required
            pattern="[a-z0-9_]{3,30}"
            aria-invalid={Boolean(error)}
          />
        </Field>
      </div>
      <Field label={t('bio')} htmlFor="bio">
        <Textarea id="bio" name="bio" defaultValue={me.profile.bio ?? ''} maxLength={600} />
      </Field>
      <Field label={t('language')} htmlFor="locale" className="max-w-xs">
        <NativeSelect id="locale" name="locale" defaultValue={me.profile.locale}>
          <option value="fr">Français</option>
          <option value="en">English</option>
        </NativeSelect>
      </Field>
      <div>
        <Button type="submit" disabled={saving}>
          {saving ? tc('saving') : tc('save')}
        </Button>
      </div>
    </form>
  );
}
