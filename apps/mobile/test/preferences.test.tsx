import { act, renderHook } from '@testing-library/react-native';
import { updatePreferences, usePreferences } from '@/lib/preferences';

describe('préférences', () => {
  it('ont des valeurs par défaut accessibles et se mettent à jour en direct', async () => {
    const { result } = await renderHook(() => usePreferences());
    expect(result.current).toMatchObject({
      appearance: 'system',
      readerTheme: 'paper',
      readerSize: 20,
      haptics: true,
    });
    await act(async () => updatePreferences({ readerTheme: 'night', readerSize: 24 }));
    expect(result.current.readerTheme).toBe('night');
    expect(result.current.readerSize).toBe(24);
  });
});
