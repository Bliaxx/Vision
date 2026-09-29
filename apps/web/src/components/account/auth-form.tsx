'use client';

import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { Button } from '../ui/button';
import { Field, Input } from '../ui/field';

/** Formulaire de connexion / inscription (Better Auth, cookie de session HTTP-only). */
export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const t = useTranslations('auth');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');
    setPending(true);
    setError(null);
    const result =
      mode === 'sign-in'
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password, name: String(form.get('name') ?? '') });
    setPending(false);
    if (result.error) {
      setError(
        mode === 'sign-in'
          ? t('invalidCredentials')
          : result.error.status === 422
            ? t('emailTaken')
            : (result.error.message ?? t('invalidCredentials')),
      );
      return;
    }
    router.push('/library');
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {mode === 'sign-up' ? (
        <Field label={t('name')} htmlFor="name">
          <Input id="name" name="name" autoComplete="nickname" required minLength={2} />
        </Field>
      ) : null}
      <Field label={t('email')} htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field
        label={t('password')}
        htmlFor="password"
        hint={mode === 'sign-up' ? t('passwordHint') : undefined}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
          required
          minLength={8}
        />
      </Field>
      {error ? (
        <p
          role="alert"
          className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger"
        >
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending}>
        {mode === 'sign-in' ? t('submitSignIn') : t('submitSignUp')}
      </Button>
      <p className="text-center text-sm text-muted">
        {mode === 'sign-in' ? t('noAccount') : t('hasAccount')}{' '}
        <Link
          href={mode === 'sign-in' ? '/sign-up' : '/sign-in'}
          className="thread-underline font-semibold text-ink"
        >
          {mode === 'sign-in' ? t('submitSignUp') : t('submitSignIn')}
        </Link>
      </p>
      {mode === 'sign-up' ? <p className="text-center text-xs text-subtle">{t('legal')}</p> : null}
    </form>
  );
}
