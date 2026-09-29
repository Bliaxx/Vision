import { apiErrorCode } from '@dedale/api-client';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { StoryEditor } from '@/components/studio/editor';
import { toLocale } from '@/i18n/locale';
import { redirect } from '@/i18n/navigation';
import { serverApi } from '@/lib/api/server';
import { getMe } from '@/lib/session';

export const metadata: Metadata = { robots: { index: false } };

export default async function EditorPage({ params }: PageProps<'/[locale]/studio/[id]'>) {
  const { id, locale: segment } = await params;
  const locale = toLocale(segment);
  setRequestLocale(locale);
  const me = await getMe();
  if (!me) redirect({ href: '/sign-in', locale });
  const api = await serverApi();
  try {
    const draft = await api.authoring.get({ id });
    // La clé force un éditeur neuf si l'on navigue d'un récit à l'autre.
    return (
      <StoryEditor
        key={draft.id}
        draft={draft}
        advancedAnalytics={me?.entitlements.includes('author_analytics') ?? false}
        privatePublishing={me?.entitlements.includes('private_publishing') ?? false}
      />
    );
  } catch (error) {
    const code = apiErrorCode(error);
    if (code === 'NOT_FOUND' || code === 'FORBIDDEN' || code === 'BAD_REQUEST') notFound();
    throw error;
  }
}
