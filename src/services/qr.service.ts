import { QRType } from '../constants';
import { QRPayload } from '../constants/types';

const generateNonce = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result + Date.now().toString(36).toUpperCase();
};

export const generateQRPayloads = (
  sessionId: string,
  sectionId: string,
  durationMinutes: number
): Record<QRType, string> => {
  const expiresAt = Date.now() + durationMinutes * 60 * 1000;
  const make = (type: QRType): string =>
    JSON.stringify({
      type,
      sessionId,
      sectionId,
      nonce: generateNonce(),
      expiresAt,
      generatedAt: Date.now(),
    } as QRPayload);
  return {
    [QRType.PRESENT]: make(QRType.PRESENT),
    [QRType.EXCUSED]: make(QRType.EXCUSED),
    [QRType.OUTSIDE]: make(QRType.OUTSIDE),
  };
};

export const parseQRPayload = (raw: string): QRPayload | null => {
  try {
    const parsed = JSON.parse(raw) as QRPayload;
    if (!parsed.type || !parsed.sessionId || !parsed.sectionId) return null;
    if (Date.now() > parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
};
