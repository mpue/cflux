import { PrismaClient, Zeitmodell, ZeitmodellEintrag, AenderungsTyp } from '@prisma/client';

const prisma = new PrismaClient();

export interface ZeitmodellWithEintraege extends Zeitmodell {
  eintraege: ZeitmodellEintrag[];
}

export interface StundensatzResult {
  stundensatz: number;
  eintragId: string;
  zeitmodellId: string;
  zeitmodellName: string;
}

export interface AbrechnungsPosition {
  zeitraum: { von: Date; bis: Date };
  stundensatz: number;
  dauer: number; // in Stunden
  betrag: number;
}

export interface AbrechnungsResult {
  positionen: AbrechnungsPosition[];
  gesamtStunden: number;
  gesamtBetrag: number;
}

class ZeitmodellService {
  
  // ==================== CRUD Operations ====================
  
  async getAllZeitmodelle(): Promise<ZeitmodellWithEintraege[]> {
    return prisma.zeitmodell.findMany({
      include: {
        eintraege: {
          orderBy: { prioritaet: 'desc' }
        },
        updatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getZeitmodellById(id: string): Promise<ZeitmodellWithEintraege | null> {
    return prisma.zeitmodell.findUnique({
      where: { id },
      include: {
        eintraege: {
          orderBy: { prioritaet: 'desc' }
        },
        mitarbeiter: {
          include: {
            mitarbeiter: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        aenderungen: {
          include: {
            createdByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });
  }

  async createZeitmodell(data: {
    name: string;
    beschreibung?: string;
    gueltigVon: Date;
    gueltigBis?: Date;
    updatedBy?: string;
    eintraege: Array<{
      stundensatz: number;
      startzeit: string;
      endzeit: string;
      wochentage?: number[];
      nurFeiertage?: boolean;
      keineFeiertage?: boolean;
      prioritaet?: number;
    }>;
  }): Promise<ZeitmodellWithEintraege> {
    // Validierung
    this.validateZeitmodellData(data);
    this.validateEintraege(data.eintraege);

    const { eintraege, ...zeitmodellData } = data;

    const zeitmodell = await prisma.zeitmodell.create({
      data: {
        ...zeitmodellData,
        eintraege: {
          create: eintraege.map(e => ({
            stundensatz: e.stundensatz,
            startzeit: e.startzeit,
            endzeit: e.endzeit,
            wochentage: e.wochentage || [],
            nurFeiertage: e.nurFeiertage || false,
            keineFeiertage: e.keineFeiertage || false,
            prioritaet: e.prioritaet || 50
          }))
        }
      },
      include: {
        eintraege: true
      }
    });

    // Audit-Log
    await this.createAuditLog(zeitmodell.id, AenderungsTyp.CREATE, null, zeitmodell, data.updatedBy);

    return zeitmodell;
  }

  async updateZeitmodell(id: string, data: {
    name?: string;
    beschreibung?: string;
    gueltigVon?: Date;
    gueltigBis?: Date;
    updatedBy?: string;
    eintraege?: Array<{
      id?: string;
      stundensatz: number;
      startzeit: string;
      endzeit: string;
      wochentage?: number[];
      nurFeiertage?: boolean;
      keineFeiertage?: boolean;
      prioritaet?: number;
    }>;
  }): Promise<ZeitmodellWithEintraege> {
    // Alten Zustand für Audit-Log sichern
    const oldZeitmodell = await this.getZeitmodellById(id);
    if (!oldZeitmodell) {
      throw new Error('Zeitmodell nicht gefunden');
    }

    // Validierung
    if (data.gueltigVon || data.gueltigBis) {
      this.validateDateRange({
        gueltigVon: data.gueltigVon || oldZeitmodell.gueltigVon,
        gueltigBis: data.gueltigBis !== undefined ? data.gueltigBis : oldZeitmodell.gueltigBis
      });
    }

    if (data.eintraege) {
      this.validateEintraege(data.eintraege);
    }

    const { eintraege, ...zeitmodellData } = data;

    // Update Zeitmodell
    const updated = await prisma.$transaction(async (tx) => {
      // Update Hauptdaten und Version
      const zeitmodell = await tx.zeitmodell.update({
        where: { id },
        data: {
          ...zeitmodellData,
          version: { increment: 1 }
        }
      });

      // Update Einträge wenn vorhanden
      if (eintraege) {
        // Lösche alle alten Einträge
        await tx.zeitmodellEintrag.deleteMany({
          where: { zeitmodellId: id }
        });

        // Erstelle neue Einträge
        await tx.zeitmodellEintrag.createMany({
          data: eintraege.map(e => ({
            zeitmodellId: id,
            stundensatz: e.stundensatz,
            startzeit: e.startzeit,
            endzeit: e.endzeit,
            wochentage: e.wochentage || [],
            nurFeiertage: e.nurFeiertage || false,
            keineFeiertage: e.keineFeiertage || false,
            prioritaet: e.prioritaet || 50
          }))
        });
      }

      return tx.zeitmodell.findUnique({
        where: { id },
        include: {
          eintraege: true
        }
      });
    });

    if (!updated) {
      throw new Error('Fehler beim Aktualisieren');
    }

    // Audit-Log
    await this.createAuditLog(id, AenderungsTyp.UPDATE, oldZeitmodell, updated, data.updatedBy);

    return updated;
  }

  async deleteZeitmodell(id: string, userId?: string): Promise<void> {
    const zeitmodell = await this.getZeitmodellById(id);
    if (!zeitmodell) {
      throw new Error('Zeitmodell nicht gefunden');
    }

    // Prüfe ob Zeitmodell Mitarbeitern zugewiesen ist
    const assignments = await prisma.mitarbeiterZeitmodell.count({
      where: { zeitmodellId: id }
    });

    if (assignments > 0) {
      throw new Error(`Zeitmodell kann nicht gelöscht werden. Es ist ${assignments} Mitarbeiter(n) zugewiesen.`);
    }

    // Audit-Log vor Löschung
    await this.createAuditLog(id, AenderungsTyp.DELETE, zeitmodell, null, userId);

    await prisma.zeitmodell.delete({
      where: { id }
    });
  }

  // ==================== Mitarbeiter-Zuweisung ====================

  async assignZeitmodellToMitarbeiter(data: {
    mitarbeiterId: string;
    zeitmodellId: string;
    gueltigVon: Date;
    gueltigBis?: Date;
  }) {
    // Prüfe ob Zeitmodell existiert
    const zeitmodell = await prisma.zeitmodell.findUnique({
      where: { id: data.zeitmodellId }
    });
    if (!zeitmodell) {
      throw new Error('Zeitmodell nicht gefunden');
    }

    // Prüfe ob Mitarbeiter existiert
    const mitarbeiter = await prisma.user.findUnique({
      where: { id: data.mitarbeiterId }
    });
    if (!mitarbeiter) {
      throw new Error('Mitarbeiter nicht gefunden');
    }

    // Prüfe auf Überlappungen
    const overlapping = await prisma.mitarbeiterZeitmodell.findFirst({
      where: {
        mitarbeiterId: data.mitarbeiterId,
        OR: [
          {
            gueltigVon: { lte: data.gueltigBis || new Date('2099-12-31') },
            gueltigBis: { gte: data.gueltigVon }
          },
          {
            gueltigVon: { lte: data.gueltigBis || new Date('2099-12-31') },
            gueltigBis: null
          }
        ]
      }
    });

    if (overlapping) {
      throw new Error('Es existiert bereits eine Zuweisung für diesen Zeitraum');
    }

    return prisma.mitarbeiterZeitmodell.create({
      data: {
        mitarbeiterId: data.mitarbeiterId,
        zeitmodellId: data.zeitmodellId,
        gueltigVon: data.gueltigVon,
        gueltigBis: data.gueltigBis
      },
      include: {
        zeitmodell: true,
        mitarbeiter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
  }

  async getMitarbeiterZeitmodelle(mitarbeiterId: string) {
    return prisma.mitarbeiterZeitmodell.findMany({
      where: { mitarbeiterId },
      include: {
        zeitmodell: {
          include: {
            eintraege: true
          }
        }
      },
      orderBy: { gueltigVon: 'desc' }
    });
  }

  async removeMitarbeiterZeitmodell(id: string): Promise<void> {
    await prisma.mitarbeiterZeitmodell.delete({
      where: { id }
    });
  }

  // ==================== Stundensatz-Ermittlung ====================

  async getStundensatz(
    mitarbeiterId: string,
    datum: Date,
    uhrzeit: string // Format "HH:MM:SS"
  ): Promise<StundensatzResult> {
    // 1. Aktives Zeitmodell für Mitarbeiter finden
    const assignment = await prisma.mitarbeiterZeitmodell.findFirst({
      where: {
        mitarbeiterId,
        gueltigVon: { lte: datum },
        OR: [
          { gueltigBis: null },
          { gueltigBis: { gte: datum } }
        ]
      },
      include: {
        zeitmodell: {
          include: {
            eintraege: {
              orderBy: { prioritaet: 'desc' }
            }
          }
        }
      }
    });

    if (!assignment) {
      throw new Error('Kein aktives Zeitmodell für diesen Mitarbeiter gefunden');
    }

    // 2. Wochentag bestimmen (0=Montag, 6=Sonntag)
    const wochentag = (datum.getDay() + 6) % 7; // Konvertiere Sunday=0 zu Monday=0

    // 3. Feiertag prüfen
    const istFeiertag = await this.isHoliday(datum);

    // 4. Passenden Eintrag finden
    const matchingEintrag = this.findMatchingEintrag(
      assignment.zeitmodell.eintraege,
      uhrzeit,
      wochentag,
      istFeiertag
    );

    if (!matchingEintrag) {
      throw new Error('Kein passender Zeitmodell-Eintrag für diese Zeit gefunden');
    }

    return {
      stundensatz: matchingEintrag.stundensatz,
      eintragId: matchingEintrag.id,
      zeitmodellId: assignment.zeitmodell.id,
      zeitmodellName: assignment.zeitmodell.name
    };
  }

  private findMatchingEintrag(
    eintraege: ZeitmodellEintrag[],
    uhrzeit: string,
    wochentag: number,
    istFeiertag: boolean
  ): ZeitmodellEintrag | null {
    // Filtern nach Feiertags-Regeln und Zeitbereich
    const candidates = eintraege.filter(eintrag => {
      // Feiertags-Filter
      if (eintrag.nurFeiertage && !istFeiertag) return false;
      if (eintrag.keineFeiertage && istFeiertag) return false;

      // Wochentags-Filter (leer = alle Tage)
      if (eintrag.wochentage.length > 0 && !eintrag.wochentage.includes(wochentag)) {
        return false;
      }

      // Zeitbereich prüfen
      return this.isTimeInRange(uhrzeit, eintrag.startzeit, eintrag.endzeit);
    });

    // Sortiere nach Priorität (höchste zuerst) und gib den ersten zurück
    candidates.sort((a, b) => b.prioritaet - a.prioritaet);

    return candidates.length > 0 ? candidates[0] : null;
  }

  private isTimeInRange(time: string, start: string, end: string): boolean {
    const [h, m, s] = time.split(':').map(Number);
    const [sh, sm, ss] = start.split(':').map(Number);
    const [eh, em, es] = end.split(':').map(Number);

    const timeSeconds = h * 3600 + m * 60 + s;
    const startSeconds = sh * 3600 + sm * 60 + ss;
    const endSeconds = eh * 3600 + em * 60 + es;

    return timeSeconds >= startSeconds && timeSeconds <= endSeconds;
  }

  private async isHoliday(datum: Date): Promise<boolean> {
    // Prüfe gegen Holiday-Tabelle für öffentliche Feiertage
    const holiday = await prisma.holiday.findFirst({
      where: {
        date: datum
      }
    });

    return !!holiday;
  }

  // ==================== Arbeitszeitabrechnung ====================

  async calculateArbeitszeitabrechnung(
    mitarbeiterId: string,
    von: Date,
    bis: Date
  ): Promise<AbrechnungsResult> {
    const positionen: AbrechnungsPosition[] = [];

    // Zerlege Zeitraum in Tage
    const currentDate = new Date(von);
    
    while (currentDate <= bis) {
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const segmentEnd = dayEnd < bis ? dayEnd : bis;

      try {
        // Ermittle Stundensatz für diesen Tag (Mittagszeit als Referenz)
        const result = await this.getStundensatz(
          mitarbeiterId,
          currentDate,
          '12:00:00'
        );

        // Berechne Dauer in Stunden
        const dauer = (segmentEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60);
        const betrag = dauer * result.stundensatz;

        positionen.push({
          zeitraum: { von: new Date(currentDate), bis: segmentEnd },
          stundensatz: result.stundensatz,
          dauer,
          betrag
        });

      } catch (error) {
        // Wenn kein Stundensatz gefunden, überspringe diesen Tag
        console.warn(`Kein Stundensatz für ${currentDate.toISOString()}:`, error);
      }

      // Nächster Tag
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
    }

    const gesamtStunden = positionen.reduce((sum, p) => sum + p.dauer, 0);
    const gesamtBetrag = positionen.reduce((sum, p) => sum + p.betrag, 0);

    return {
      positionen,
      gesamtStunden,
      gesamtBetrag
    };
  }

  // ==================== Validierung ====================

  private validateZeitmodellData(data: {
    name: string;
    gueltigVon: Date;
    gueltigBis?: Date | null;
  }): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Name ist erforderlich');
    }

    this.validateDateRange({ gueltigVon: data.gueltigVon, gueltigBis: data.gueltigBis });
  }

  private validateDateRange(data: { gueltigVon: Date; gueltigBis?: Date | null }): void {
    if (!data.gueltigVon) {
      throw new Error('Gültig-Von Datum ist erforderlich');
    }

    if (data.gueltigBis && data.gueltigBis < data.gueltigVon) {
      throw new Error('Gültig-Bis muss nach Gültig-Von liegen');
    }
  }

  private validateEintraege(eintraege: any[]): void {
    if (!eintraege || eintraege.length === 0) {
      throw new Error('Mindestens ein Eintrag ist erforderlich');
    }

    for (const eintrag of eintraege) {
      // Zeitformat prüfen
      if (!this.isValidTimeFormat(eintrag.startzeit)) {
        throw new Error(`Ungültiges Zeitformat für Startzeit: ${eintrag.startzeit}`);
      }
      if (!this.isValidTimeFormat(eintrag.endzeit)) {
        throw new Error(`Ungültiges Zeitformat für Endzeit: ${eintrag.endzeit}`);
      }

      // Feiertags-Flags prüfen
      if (eintrag.nurFeiertage && eintrag.keineFeiertage) {
        throw new Error('nurFeiertage und keineFeiertage können nicht beide TRUE sein');
      }

      // Wochentage prüfen
      if (eintrag.wochentage) {
        for (const tag of eintrag.wochentage) {
          if (tag < 0 || tag > 6) {
            throw new Error(`Ungültiger Wochentag: ${tag}`);
          }
        }
      }

      // Stundensatz prüfen
      if (eintrag.stundensatz <= 0) {
        throw new Error('Stundensatz muss größer als 0 sein');
      }
    }

    // Überlappungsprüfung
    this.checkOverlaps(eintraege);
  }

  private isValidTimeFormat(time: string): boolean {
    const regex = /^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/;
    return regex.test(time);
  }

  private checkOverlaps(eintraege: any[]): void {
    // Gruppiere nach Wochentagen
    const groups: { [key: string]: any[] } = {};

    for (const eintrag of eintraege) {
      const wochentage = eintrag.wochentage && eintrag.wochentage.length > 0
        ? eintrag.wochentage
        : [0, 1, 2, 3, 4, 5, 6]; // Alle Tage wenn leer

      for (const tag of wochentage) {
        const key = `${tag}-${eintrag.nurFeiertage}-${eintrag.keineFeiertage}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(eintrag);
      }
    }

    // Prüfe Überlappungen in jeder Gruppe
    for (const [key, gruppe] of Object.entries(groups)) {
      for (let i = 0; i < gruppe.length; i++) {
        for (let j = i + 1; j < gruppe.length; j++) {
          if (this.timeRangesOverlap(
            gruppe[i].startzeit,
            gruppe[i].endzeit,
            gruppe[j].startzeit,
            gruppe[j].endzeit
          )) {
            throw new Error(
              `Zeitüberlappung gefunden für ${key}: ${gruppe[i].startzeit}-${gruppe[i].endzeit} und ${gruppe[j].startzeit}-${gruppe[j].endzeit}`
            );
          }
        }
      }
    }
  }

  private timeRangesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    const [h1, m1] = start1.split(':').map(Number);
    const [h2, m2] = end1.split(':').map(Number);
    const [h3, m3] = start2.split(':').map(Number);
    const [h4, m4] = end2.split(':').map(Number);

    const s1 = h1 * 60 + m1;
    const e1 = h2 * 60 + m2;
    const s2 = h3 * 60 + m3;
    const e2 = h4 * 60 + m4;

    return s1 < e2 && s2 < e1;
  }

  // ==================== Audit-Log ====================

  private async createAuditLog(
    zeitmodellId: string,
    aenderungstyp: AenderungsTyp,
    altData: any,
    neuData: any,
    userId?: string
  ): Promise<void> {
    await prisma.zeitmodellAenderung.create({
      data: {
        zeitmodellId,
        aenderungstyp,
        altJson: altData ? JSON.parse(JSON.stringify(altData)) : null,
        neuJson: JSON.parse(JSON.stringify(neuData)),
        createdBy: userId
      }
    });
  }

  // ==================== Reports ====================

  async getZeitmodellStatistics() {
    const total = await prisma.zeitmodell.count();
    const active = await prisma.zeitmodell.count({
      where: {
        gueltigVon: { lte: new Date() },
        OR: [
          { gueltigBis: null },
          { gueltigBis: { gte: new Date() } }
        ]
      }
    });

    const assignments = await prisma.mitarbeiterZeitmodell.count();
    const mitarbeiterMitZeitmodell = await prisma.mitarbeiterZeitmodell.groupBy({
      by: ['mitarbeiterId'],
      _count: true
    });

    return {
      total,
      active,
      assignments,
      mitarbeiterMitZeitmodell: mitarbeiterMitZeitmodell.length
    };
  }
}

export const zeitmodellService = new ZeitmodellService();
