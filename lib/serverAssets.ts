import fs from 'fs';
import path from 'path';

/** Load a file from /public or /private as a base64 data URL (server-side only). */
function b64(filePath: string, mime: string): string | null {
  try {
    const buf = fs.readFileSync(filePath);
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

export function getLogoBase64(): string {
  return (
    b64(path.join(process.cwd(), 'public', 'assets', 'Logo2_black.png'), 'image/png') ??
    '/assets/Logo2_black.png'
  );
}

/** Light/color logo for dark backgrounds (P&L header, GST header) */
export function getLogoDarkBgBase64(): string {
  return (
    b64(path.join(process.cwd(), 'public', 'assets', 'Logo.png'), 'image/png') ??
    '/assets/Logo.png'
  );
}

export function getSignatureBase64(): string {
  return (
    b64(path.join(process.cwd(), 'private', 'signature.jpg'), 'image/jpeg') ??
    '/api/private/signature'
  );
}
