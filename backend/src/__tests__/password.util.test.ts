import { generateOneTimePassword } from '../utils/password';

describe('generateOneTimePassword', () => {
  it('hält die gewünschte Länge ein', () => {
    expect(generateOneTimePassword()).toHaveLength(14);
    expect(generateOneTimePassword(20)).toHaveLength(20);
  });

  it('lehnt zu kurze Passwörter ab', () => {
    expect(() => generateOneTimePassword(7)).toThrow(/mindestens 8 Zeichen/);
  });

  it('enthält jede Zeichenklasse mindestens einmal', () => {
    for (let i = 0; i < 200; i++) {
      const password = generateOneTimePassword(8);

      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[0-9]/);
      expect(password).toMatch(/[!@#$%*?\-_]/);
    }
  });

  it('lässt mehrdeutige Zeichen weg', () => {
    for (let i = 0; i < 200; i++) {
      // 0/O und 1/l/I werden beim Abtippen oder am Telefon verwechselt
      expect(generateOneTimePassword(24)).not.toMatch(/[0O1lI]/);
    }
  });

  it('erzeugt bei jedem Aufruf ein anderes Passwort', () => {
    const seen = new Set<string>();

    for (let i = 0; i < 500; i++) {
      seen.add(generateOneTimePassword());
    }

    expect(seen.size).toBe(500);
  });

  it('verteilt die Zeichen ohne sichtbare Positionsschlagseite', () => {
    // Die vier garantierten Zeichen dürfen nicht immer vorne stehen —
    // sonst begänne jedes Passwort mit einem Grossbuchstaben.
    const firstIsUppercase = Array.from({ length: 300 }, () =>
      /[A-Z]/.test(generateOneTimePassword()[0])
    ).filter(Boolean).length;

    expect(firstIsUppercase).toBeGreaterThan(20);
    expect(firstIsUppercase).toBeLessThan(280);
  });
});
