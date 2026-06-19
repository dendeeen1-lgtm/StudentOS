import { QRType } from '../constants';
import { QRPayload } from '../constants/types';

const generateNonce = () =>
  Math.random().toString(36).substring(2, 10).toUpperCase();

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
    if (Date.now() > parsed.expiresAt) return null; // expired
    return parsed;
  } catch {
    return null;
  }
};
