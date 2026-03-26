import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type TimeRoundingMode = 'none' | 'round' | 'ceil' | 'floor';

interface TimeRoundingConfig {
  mode: TimeRoundingMode;
  threshold: number; // Sekunden-Schwelle für "round" Modus (0-59)
}

// Cache für die Einstellungen (wird alle 60s neu geladen)
let cachedConfig: TimeRoundingConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 60 Sekunden

async function loadConfig(): Promise<TimeRoundingConfig> {
  const now = Date.now();
  if (cachedConfig && now - cacheTimestamp < CACHE_TTL) {
    return cachedConfig;
  }
  try {
    const settings = await prisma.systemSettings.findFirst();
    cachedConfig = {
      mode: (settings?.timeRoundingMode as TimeRoundingMode) || 'round',
      threshold: settings?.timeRoundingThreshold ?? 30,
    };
  } catch {
    cachedConfig = { mode: 'round', threshold: 30 };
  }
  cacheTimestamp = now;
  return cachedConfig;
}

/** Cache manuell invalidieren (z.B. nach Settings-Update) */
export function invalidateTimeRoundingCache(): void {
  cachedConfig = null;
  cacheTimestamp = 0;
}

/**
 * Rundet Minuten anhand der Restsekunden gemäss Konfiguration.
 */
function applyRounding(minutes: number, remainingSeconds: number, config: TimeRoundingConfig): number {
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
 * Rundet Millisekunden auf ganze Minuten (synchron mit Default-Werten).
 * Verwendet Standard-Rundung (>= 30s aufrunden).
 */
export function roundMsToMinutes(ms: number): number {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return remainingSeconds >= 30 ? minutes + 1 : minutes;
}

/**
 * Rundet Millisekunden auf ganze Minuten (async, liest DB-Konfiguration).
 */
export async function roundMsToMinutesAsync(ms: number): Promise<number> {
  const config = await loadConfig();
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return applyRounding(minutes, remainingSeconds, config);
}

/**
 * Berechnet gerundete Arbeitsstunden aus Millisekunden-Differenz (synchron, Default-Werte).
 */
export function roundMsToHours(ms: number): number {
  const minutes = roundMsToMinutes(ms);
  return minutes / 60;
}

/**
 * Berechnet gerundete Arbeitsstunden aus Millisekunden-Differenz (async, liest DB-Konfiguration).
 */
export async function roundMsToHoursAsync(ms: number): Promise<number> {
  const minutes = await roundMsToMinutesAsync(ms);
  return minutes / 60;
}
