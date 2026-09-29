import 'server-only';

type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 600; style: 'normal' };

/**
 * Charge une police Google au format TrueType (Satori ne lit pas le WOFF2),
 * restreinte aux glyphes utiles. En cas d'échec réseau, l'image est rendue
 * avec la police par défaut plutôt que de casser le partage.
 */
async function loadGoogleFont(
  family: string,
  weight: 400 | 600,
  text: string,
): Promise<OgFont | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(url, { next: { revalidate: 86_400 } })).text();
    const source = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!source) return null;
    const response = await fetch(source, { next: { revalidate: 86_400 } });
    if (!response.ok) return null;
    return { name: family, data: await response.arrayBuffer(), weight, style: 'normal' };
  } catch {
    return null;
  }
}

export async function ogFonts(display: string, body: string): Promise<OgFont[]> {
  const fonts = await Promise.all([
    loadGoogleFont('Fraunces', 600, display),
    loadGoogleFont('Manrope', 600, body),
  ]);
  return fonts.filter((font) => font !== null);
}
