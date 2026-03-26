export type TimeRoundingMode = 'none' | 'round' | 'ceil' | 'floor';

interface TimeRoundingConfig {
  mode: TimeRoundingMode;
  threshold: number; // Sekunden-Schwelle für "round" Modus (0-59)
}

// Globale Konfiguration, wird beim App-Start aus den System-Settings geladen
let config: TimeRoundingConfig = { mode: 'round', threshold: 30 };

/** Konfiguration setzen (wird beim App-Start aus SystemSettings geladen) */
export function setTimeRoundingConfig(mode: TimeRoundingMode, threshold: number): void {
  config = { mode, threshold };
}

function applyRounding(minutes: number, remainingSeconds: number): number {
  switch (config.mode) {
    case 'none':
      return minutes;
    case 'ceil':
      return remainingSeconds > 0 ? minutes + 1 : minutes;
    case 'floor':
      return minutes;
    case 'round':
    default:
      return remainingSeconds >= config.threshold ? minutes + 1 : minutes;
  }
}

/**
 * Rundet Millisekunden auf ganze Minuten gemäss konfiguriertem Rundungsmodus.
 */
export function roundMsToMinutes(ms: number): number {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return applyRounding(minutes, remainingSeconds);
}

/**
 * Berechnet gerundete Arbeitsstunden aus Millisekunden-Differenz.
 */
export function roundMsToHours(ms: number): number {
  const minutes = roundMsToMinutes(ms);
  return minutes / 60;
}
