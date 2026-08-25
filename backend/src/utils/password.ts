import crypto from 'crypto';

/**
 * Erzeugung von Einmal-Passwörtern für Administratoren.
 *
 * Die Zeichensätze entsprechen dem Passwort-Generator unter Hilfsmittel, lassen
 * aber mehrdeutige Zeichen (0/O, 1/l/I) weg — die Passwörter werden häufig
 * abgetippt oder telefonisch durchgegeben.
 */

const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghjkmnpqrstuvwxyz';
const NUMBERS = '23456789';
const SYMBOLS = '!@#$%*?-_';

const ALL = UPPERCASE + LOWERCASE + NUMBERS + SYMBOLS;

/** Gleichverteilte Zufallsauswahl ohne Modulo-Bias. */
const pick = (charset: string): string => {
  const limit = Math.floor(256 / charset.length) * charset.length;

  // Werte oberhalb der Grenze verwerfen, sonst wären die ersten Zeichen des
  // Zeichensatzes minimal wahrscheinlicher als die letzten.
  for (;;) {
    const [byte] = crypto.randomBytes(1);
    if (byte < limit) {
      return charset[byte % charset.length];
    }
  }
};

/**
 * Liefert ein Passwort, das garantiert aus jeder Zeichenklasse mindestens ein
 * Zeichen enthält. Standardlänge 14 — deutlich über der Mindestlänge von 6,
 * die beim Ändern gilt.
 */
export const generateOneTimePassword = (length = 14): string => {
  if (length < 8) {
    throw new Error('Einmal-Passwörter müssen mindestens 8 Zeichen lang sein');
  }

  const chars = [pick(UPPERCASE), pick(LOWERCASE), pick(NUMBERS), pick(SYMBOLS)];

  while (chars.length < length) {
    chars.push(pick(ALL));
  }

  // Fisher-Yates, damit die vier garantierten Zeichen nicht immer vorne stehen
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
};
