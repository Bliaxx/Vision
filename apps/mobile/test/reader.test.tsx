import { fireEvent, render, screen } from '@testing-library/react-native';
import { ReaderScreen } from '@/components/reader/reader-screen';
import { readLocalSave } from '@/lib/saves';
import { Providers, resetStorage, samplePackage } from './helpers';

jest.mock('@/lib/api', () => ({
  api: {
    reading: {
      saveProgress: jest.fn().mockResolvedValue({}),
      track: jest.fn().mockResolvedValue({}),
    },
  },
}));

beforeEach(() => resetStorage());

describe('liseuse mobile', () => {
  it('affiche le passage de départ puis avance au choix, en sauvegardant sur l’appareil', async () => {
    const pkg = samplePackage();
    const start = pkg.document.passages.find((passage) => passage.id === pkg.document.start);
    await render(
      <Providers>
        <ReaderScreen pkg={pkg} signedIn={false} onClose={jest.fn()} />
      </Providers>,
    );
    expect(screen.getByRole('header', { name: start?.title })).toBeTruthy();

    const first = start?.choices[0];
    await fireEvent.press(screen.getByRole('button', { name: first?.text }));

    expect(screen.queryByRole('header', { name: start?.title })).toBeNull();
    expect(readLocalSave(pkg.storyId)?.data.actions).toHaveLength(1);
  });

  it('ferme la liseuse', async () => {
    const onClose = jest.fn();
    await render(
      <Providers>
        <ReaderScreen pkg={samplePackage()} signedIn={false} onClose={onClose} />
      </Providers>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Quitter la lecture' }));
    expect(onClose).toHaveBeenCalled();
  });
});
