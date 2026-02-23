import api from './api';

export interface ZeitmodellEintrag {
  id?: string;
  stundensatz: number;
  startzeit: string; // Format "HH:MM:SS"
  endzeit: string;
  wochentage: number[]; // [0-6], 0=Montag, 6=Sonntag
  nurFeiertage: boolean;
  keineFeiertage: boolean;
  prioritaet: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Zeitmodell {
  id: string;
  name: string;
  beschreibung?: string;
  gueltigVon: string;
  gueltigBis?: string;
  version: number;

  // Tages-Soll und Projektsoll-Steuerung
  tagesSollStunden?: number;    // Standard-Tages-Soll (8.4)
  projektsollAktiv?: boolean;   // Projektsoll-Cutting aktiviert
  projektsollFlexibel?: boolean; // Flexible Projektsoll-Zeiten

  // Zuschlagsdefinitionen
  nachtBeginn?: string;         // z.B. "22:00"
  nachtEnde?: string;           // z.B. "06:00"
  nachtZuschlag?: number;       // 0.25 = 25%
  sonntagZuschlag?: number;     // 0.50 = 50%
  feiertagZuschlag?: number;    // 1.00 = 100%
  samstagZuschlag?: number;     // CH: 0.00, DE: 0.50

  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
  eintraege: ZeitmodellEintrag[];
  updatedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  mitarbeiter?: MitarbeiterZeitmodell[];
  aenderungen?: ZeitmodellAenderung[];
}

export interface MitarbeiterZeitmodell {
  id: string;
  mitarbeiterId: string;
  zeitmodellId: string;
  gueltigVon: string;
  gueltigBis?: string;
  createdAt: string;
  updatedAt: string;
  zeitmodell?: Zeitmodell;
  mitarbeiter?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ZeitmodellAenderung {
  id: string;
  zeitmodellId: string;
  aenderungstyp: 'CREATE' | 'UPDATE' | 'DELETE';
  altJson?: any;
  neuJson: any;
  kommentar?: string;
  createdAt: string;
  createdBy?: string;
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface StundensatzResult {
  stundensatz: number;
  eintragId: string;
  zeitmodellId: string;
  zeitmodellName: string;
}

export interface AbrechnungsPosition {
  zeitraum: {
    von: string;
    bis: string;
  };
  stundensatz: number;
  dauer: number;
  betrag: number;
}

export interface AbrechnungsResult {
  positionen: AbrechnungsPosition[];
  gesamtStunden: number;
  gesamtBetrag: number;
}

export interface ZeitmodellStatistics {
  total: number;
  active: number;
  assignments: number;
  mitarbeiterMitZeitmodell: number;
}

class ZeitmodellService {
  
  // ==================== Zeitmodelle ====================
  
  async getAllZeitmodelle(): Promise<Zeitmodell[]> {
    const response = await api.get('/zeitmodelle');
    return response.data;
  }

  async getZeitmodellById(id: string): Promise<Zeitmodell> {
    const response = await api.get(`/zeitmodelle/${id}`);
    return response.data;
  }

  async createZeitmodell(data: {
    name: string;
    beschreibung?: string;
    gueltigVon: string;
    gueltigBis?: string;
    eintraege: Omit<ZeitmodellEintrag, 'id' | 'createdAt' | 'updatedAt'>[];
  }): Promise<Zeitmodell> {
    const response = await api.post('/zeitmodelle', data);
    return response.data;
  }

  async updateZeitmodell(
    id: string,
    data: {
      name?: string;
      beschreibung?: string;
      gueltigVon?: string;
      gueltigBis?: string;
      eintraege?: Omit<ZeitmodellEintrag, 'createdAt' | 'updatedAt'>[];
    }
  ): Promise<Zeitmodell> {
    const response = await api.put(`/zeitmodelle/${id}`, data);
    return response.data;
  }

  async deleteZeitmodell(id: string): Promise<void> {
    await api.delete(`/zeitmodelle/${id}`);
  }

  // ==================== Mitarbeiter-Zuweisung ====================

  async assignToMitarbeiter(data: {
    mitarbeiterId: string;
    zeitmodellId: string;
    gueltigVon: string;
    gueltigBis?: string;
  }): Promise<MitarbeiterZeitmodell> {
    const response = await api.post('/zeitmodelle/assign', data);
    return response.data;
  }

  async getMitarbeiterZeitmodelle(mitarbeiterId: string): Promise<MitarbeiterZeitmodell[]> {
    const response = await api.get(`/zeitmodelle/mitarbeiter/${mitarbeiterId}`);
    return response.data;
  }

  async removeMitarbeiterZeitmodell(id: string): Promise<void> {
    await api.delete(`/zeitmodelle/assign/${id}`);
  }

  // ==================== Stundensatz-Ermittlung ====================

  async getStundensatz(
    mitarbeiterId: string,
    datum: string,
    uhrzeit: string
  ): Promise<StundensatzResult> {
    const response = await api.get(`/zeitmodelle/stundensatz/${mitarbeiterId}`, {
      params: { datum, uhrzeit }
    });
    return response.data;
  }

  async calculateArbeitszeitabrechnung(
    mitarbeiterId: string,
    von: string,
    bis: string
  ): Promise<AbrechnungsResult> {
    const response = await api.get(`/zeitmodelle/abrechnung/${mitarbeiterId}`, {
      params: { von, bis }
    });
    return response.data;
  }

  // ==================== Statistiken ====================

  async getStatistics(): Promise<ZeitmodellStatistics> {
    const response = await api.get('/zeitmodelle/stats/overview');
    return response.data;
  }

  // ==================== Helper Functions ====================

  formatTimeForDisplay(time: string): string {
    // "HH:MM:SS" => "HH:MM"
    return time.substring(0, 5);
  }

  formatTimeForApi(time: string): string {
    // "HH:MM" => "HH:MM:00"
    if (time.length === 5) {
      return `${time}:00`;
    }
    return time;
  }

  getWochentagName(tag: number): string {
    const namen = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    return namen[tag] || '';
  }

  getWochentagKuerzel(tag: number): string {
    const kuerzel = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    return kuerzel[tag] || '';
  }

  formatWochentage(wochentage: number[]): string {
    if (!wochentage || wochentage.length === 0) {
      return 'Alle Tage';
    }
    if (wochentage.length === 7) {
      return 'Alle Tage';
    }
    return wochentage
      .sort((a, b) => a - b)
      .map(tag => this.getWochentagKuerzel(tag))
      .join(', ');
  }

  formatStundensatz(betrag: number): string {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(betrag);
  }

  formatDuration(stunden: number): string {
    const h = Math.floor(stunden);
    const m = Math.round((stunden - h) * 60);
    return `${h}h ${m}m`;
  }
}

export const zeitmodellService = new ZeitmodellService();
