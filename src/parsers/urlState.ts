/**
 * Safe Base64 URL Hash encoder / decoder for sharing state
 */

export function encodeStateToHash(data: { code: string; direction: string }): string {
  try {
    const jsonStr = JSON.stringify(data);
    const bytes = new TextEncoder().encode(jsonStr);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (e) {
    console.error('Failed to encode hash:', e);
    return '';
  }
}

export function decodeHashToState(hash: string): { code: string; direction: 'LR' | 'TB' } | null {
  try {
    let clean = hash.replace(/^#/, '').trim();
    if (!clean) return null;

    clean = clean.replace(/-/g, '+').replace(/_/g, '/');
    while (clean.length % 4) {
      clean += '=';
    }

    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const jsonStr = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(jsonStr);

    if (parsed && typeof parsed.code === 'string') {
      return {
        code: parsed.code,
        direction: parsed.direction === 'TB' ? 'TB' : 'LR',
      };
    }
    return null;
  } catch (e) {
    console.error('Failed to decode hash:', e);
    return null;
  }
}
