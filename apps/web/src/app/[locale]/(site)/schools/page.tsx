import { BookHeart, ShieldCheck, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Monogram } from '@/components/brand/monogram';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/misc';
import { toLocale } from '@/i18n/locale';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/schools'>): Promise<Metadata> {
  const t = await getTranslations({
    locale: toLocale((await params).locale),
    namespace: 'schools',
  });
  return { title: t('eyebrow'), description: t('subtitle') };
}

export default async function SchoolsPage({ params }: PageProps<'/[locale]/schools'>) {
  setRequestLocale(toLocale((await params).locale));
  const t = await getTranslations('schools');
  const points = [
    { icon: Users, title: t('point1Title'), body: t('point1Body') },
    { icon: ShieldCheck, title: t('point2Title'), body: t('point2Body') },
    { icon: BookHeart, title: t('point3Title'), body: t('point3Body') },
  ];
  return (
    <Container className="flex flex-col gap-16 py-16">
      <header className="relative flex flex-col gap-5 overflow-hidden rounded-3xl bg-brass-soft p-10 sm:p-16">
        <p className="eyebrow !text-brass">{t('eyebrow')}</p>
        <h1 className="max-w-3xl font-display text-5xl leading-tight font-semibold">
          {t('title')}
        </h1>
        <p className="max-w-2xl text-lg text-muted">{t('subtitle')}</p>
        <div>
          <Button asChild size="lg">
            <a href="mailto:classe@dedale.app">{t('cta')}</a>
          </Button>
        </div>
        <Monogram
          size={320}
          className="absolute -right-16 -bottom-20 hidden text-brass opacity-20 md:block"
          title=""
          aria-hidden
        />
      </header>
      <div className="grid gap-5 md:grid-cols-3">
        {points.map(({ icon: Icon, title, body }) => (
          <article
            key={title}
            className="dog-ear flex flex-col gap-3 rounded-lg border border-line bg-surface p-7 shadow-paper"
          >
            <Icon className="size-7 text-thread" aria-hidden />
            <h2 className="font-display text-2xl font-semibold">{title}</h2>
            <p className="leading-relaxed text-muted">{body}</p>
          </article>
        ))}
      </div>
      <p className="mx-auto max-w-2xl text-center font-display text-2xl italic">{t('pricing')}</p>
    </Container>
  );
}
