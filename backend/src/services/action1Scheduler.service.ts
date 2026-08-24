import { prisma } from '../lib/prisma';
import { syncAllDevices } from './action1.service';

/**
 * Geplanter Auto-Sync der Action1-Software-Inventarisierung.
 * Spiegelt das Muster des Backup-Schedulers (setInterval-basiert,
 * liest die Konfiguration bei jedem Lauf neu aus SystemSettings).
 */

function msUntilNext(time: string, interval: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();

  const next = new Date(now);
  next.setHours(hours || 0, minutes || 0, 0, 0);

  if (next.getTime() <= now.getTime()) {
    if (interval === 'weekly') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1); // daily
    }
  }
  return next.getTime() - now.getTime();
}

function intervalToMs(interval: string): number {
  return interval === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
}

class Action1Scheduler {
  private initialTimer: ReturnType<typeof setTimeout> | null = null;
  private recurringTimer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    await this.scheduleNext();
    console.log('⏰ [Action1-Sync] Scheduler started');
  }

  stop(): void {
    if (this.initialTimer) clearTimeout(this.initialTimer);
    if (this.recurringTimer) clearInterval(this.recurringTimer);
    this.initialTimer = null;
    this.recurringTimer = null;
    this.running = false;
    console.log('⏹️ [Action1-Sync] Scheduler stopped');
  }

  private async scheduleNext(): Promise<void> {
    if (this.initialTimer) clearTimeout(this.initialTimer);
    if (this.recurringTimer) clearInterval(this.recurringTimer);

    const settings = await prisma.systemSettings.findFirst();
    if (!settings?.action1Enabled || !settings?.action1AutoSync) {
      console.log('ℹ️ [Action1-Sync] Auto-Sync ist in den Einstellungen deaktiviert');
      return;
    }

    const interval = settings.action1SyncInterval || 'daily';
    const delay = msUntilNext(settings.action1SyncTime || '03:00', interval);
    const nextRun = new Date(Date.now() + delay);
    console.log(`⏰ [Action1-Sync] Nächster Sync um ${nextRun.toLocaleString()} (${interval})`);

    this.initialTimer = setTimeout(async () => {
      await this.runSync();
      this.recurringTimer = setInterval(async () => {
        const current = await prisma.systemSettings.findFirst();
        if (!current?.action1Enabled || !current?.action1AutoSync) {
          console.log('ℹ️ [Action1-Sync] Auto-Sync wurde deaktiviert, Scheduler stoppt');
          this.stop();
          return;
        }
        await this.runSync();
      }, intervalToMs(interval));
    }, delay);
  }

  private async runSync(): Promise<void> {
    try {
      const summary = await syncAllDevices();
      console.log(
        `✅ [Action1-Sync] Fertig – ${summary.devicesMatched}/${summary.devicesTotal} Geräte, ` +
          `+${summary.added} / ~${summary.updated} / -${summary.removed} Einträge`
      );
    } catch (error) {
      console.error('❌ [Action1-Sync] Fehlgeschlagen:', error);
    }
  }

  /** Nach Änderung der Einstellungen neu planen. */
  async reschedule(): Promise<void> {
    this.stop();
    this.running = true;
    await this.scheduleNext();
  }
}

export const action1Scheduler = new Action1Scheduler();
