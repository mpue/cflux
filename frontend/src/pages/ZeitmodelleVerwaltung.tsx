import React, { useState, useEffect } from 'react';
import { zeitmodellService, Zeitmodell, ZeitmodellEintrag } from '../services/zeitmodell.service';
import ZeitmodellZuweisung from '../components/ZeitmodellZuweisung';
import './ZeitmodelleVerwaltung.css';
import { useCurrency } from '../contexts/CurrencyContext';

const ZeitmodelleVerwaltung: React.FC = () => {
  const { currency } = useCurrency();
  const [zeitmodelle, setZeitmodelle] = useState<Zeitmodell[]>([]);
  const [selectedZeitmodell, setSelectedZeitmodell] = useState<Zeitmodell | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showZuweisung, setShowZuweisung] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    beschreibung: '',
    gueltigVon: '',
    gueltigBis: '',
    tagesSollStunden: 8.4,
    projektsollAktiv: false,
    projektsollFlexibel: true,
    nachtBeginn: '22:00',
    nachtEnde: '06:00',
    nachtZuschlag: 0.25,
    sonntagZuschlag: 0.50,
    feiertagZuschlag: 1.00,
    samstagZuschlag: 0.00,
    eintraege: [] as Partial<ZeitmodellEintrag>[]
  });

  useEffect(() => {
    loadZeitmodelle();
  }, []);

  const loadZeitmodelle = async () => {
    try {
      setIsLoading(true);
      const data = await zeitmodellService.getAllZeitmodelle();
      setZeitmodelle(data);
    } catch (err: any) {
      setError('Fehler beim Laden der Zeitmodelle: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      beschreibung: '',
      gueltigVon: new Date().toISOString().split('T')[0],
      gueltigBis: '',
      tagesSollStunden: 8.4,
      projektsollAktiv: false,
      projektsollFlexibel: true,
      nachtBeginn: '22:00',
      nachtEnde: '06:00',
      nachtZuschlag: 0.25,
      sonntagZuschlag: 0.50,
      feiertagZuschlag: 1.00,
      samstagZuschlag: 0.00,
      eintraege: [{
        stundensatz: 95,
        startzeit: '08:00',
        endzeit: '17:00',
        wochentage: [0, 1, 2, 3, 4], // Mo-Fr
        nurFeiertage: false,
        keineFeiertage: true,
        prioritaet: 50
      }]
    });
    setIsEditing(false);
    setShowForm(true);
  };

  const handleEdit = (zeitmodell: Zeitmodell) => {
    setFormData({
      name: zeitmodell.name,
      beschreibung: zeitmodell.beschreibung || '',
      gueltigVon: zeitmodell.gueltigVon.split('T')[0],
      gueltigBis: zeitmodell.gueltigBis ? zeitmodell.gueltigBis.split('T')[0] : '',
      tagesSollStunden: zeitmodell.tagesSollStunden ?? 8.4,
      projektsollAktiv: zeitmodell.projektsollAktiv ?? false,
      projektsollFlexibel: zeitmodell.projektsollFlexibel ?? true,
      nachtBeginn: zeitmodell.nachtBeginn ?? '22:00',
      nachtEnde: zeitmodell.nachtEnde ?? '06:00',
      nachtZuschlag: zeitmodell.nachtZuschlag ?? 0.25,
      sonntagZuschlag: zeitmodell.sonntagZuschlag ?? 0.50,
      feiertagZuschlag: zeitmodell.feiertagZuschlag ?? 1.00,
      samstagZuschlag: zeitmodell.samstagZuschlag ?? 0.00,
      eintraege: zeitmodell.eintraege.map(e => ({
        id: e.id,
        stundensatz: e.stundensatz,
        startzeit: zeitmodellService.formatTimeForDisplay(e.startzeit),
        endzeit: zeitmodellService.formatTimeForDisplay(e.endzeit),
        wochentage: e.wochentage,
        nurFeiertage: e.nurFeiertage,
        keineFeiertage: e.keineFeiertage,
        prioritaet: e.prioritaet
      }))
    });
    setSelectedZeitmodell(zeitmodell);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const data = {
        ...formData,
        eintraege: formData.eintraege.map(e => ({
          ...e,
          startzeit: zeitmodellService.formatTimeForApi(e.startzeit || ''),
          endzeit: zeitmodellService.formatTimeForApi(e.endzeit || ''),
          stundensatz: Number(e.stundensatz),
          prioritaet: Number(e.prioritaet || 50),
          wochentage: e.wochentage || [],
          nurFeiertage: e.nurFeiertage || false,
          keineFeiertage: e.keineFeiertage || false
        }))
      };

      if (isEditing && selectedZeitmodell) {
        await zeitmodellService.updateZeitmodell(selectedZeitmodell.id, data);
        setSuccess('Zeitmodell erfolgreich aktualisiert');
      } else {
        await zeitmodellService.createZeitmodell(data as any);
        setSuccess('Zeitmodell erfolgreich erstellt');
      }

      setShowForm(false);
      loadZeitmodelle();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchten Sie dieses Zeitmodell wirklich löschen?')) {
      return;
    }

    try {
      await zeitmodellService.deleteZeitmodell(id);
      setSuccess('Zeitmodell erfolgreich gelöscht');
      loadZeitmodelle();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const addEintrag = () => {
    setFormData({
      ...formData,
      eintraege: [
        ...formData.eintraege,
        {
          stundensatz: 95,
          startzeit: '08:00',
          endzeit: '17:00',
          wochentage: [],
          nurFeiertage: false,
          keineFeiertage: false,
          prioritaet: 50
        }
      ]
    });
  };

  const removeEintrag = (index: number) => {
    setFormData({
      ...formData,
      eintraege: formData.eintraege.filter((_, i) => i !== index)
    });
  };

  const updateEintrag = (index: number, field: string, value: any) => {
    const newEintraege = [...formData.eintraege];
    newEintraege[index] = { ...newEintraege[index], [field]: value };
    setFormData({ ...formData, eintraege: newEintraege });
  };

  const toggleWochentag = (eintragIndex: number, tag: number) => {
    const eintrag = formData.eintraege[eintragIndex];
    const wochentage = eintrag.wochentage || [];
    
    const newWochentage = wochentage.includes(tag)
      ? wochentage.filter(t => t !== tag)
      : [...wochentage, tag].sort((a, b) => a - b);
    
    updateEintrag(eintragIndex, 'wochentage', newWochentage);
  };

  if (isLoading) {
    return <div className="loading">Laden...</div>;
  }

  return (
    <div className="zeitmodelle-verwaltung">
      <div className="header">
        <h1>Zeitmodelle</h1>
        <div className="header-actions">
          <button onClick={() => setShowZuweisung(true)} className="btn-secondary">
            Zeitmodell zuweisen
          </button>
          <button onClick={handleCreate} className="btn-primary">
            + Neues Zeitmodell
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showZuweisung ? (
        <ZeitmodellZuweisung onClose={() => setShowZuweisung(false)} />
      ) : showForm ? (
        <div className="zeitmodell-form-container">
          <div className="form-header">
            <h2>{isEditing ? 'Zeitmodell bearbeiten' : 'Neues Zeitmodell'}</h2>
            <button onClick={() => setShowForm(false)} className="btn-secondary">
              Abbrechen
            </button>
          </div>

          <form onSubmit={handleSubmit} className="zeitmodell-form">
            <div className="form-section">
              <h3>Grunddaten</h3>
              
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Beschreibung</label>
                <textarea
                  value={formData.beschreibung}
                  onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Gültig von *</label>
                  <input
                    type="date"
                    value={formData.gueltigVon}
                    onChange={(e) => setFormData({ ...formData, gueltigVon: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Gültig bis</label>
                  <input
                    type="date"
                    value={formData.gueltigBis}
                    onChange={(e) => setFormData({ ...formData, gueltigBis: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Projektsoll & Tages-Soll</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Tages-Soll Stunden</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.tagesSollStunden}
                    onChange={(e) => setFormData({ ...formData, tagesSollStunden: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.projektsollAktiv}
                      onChange={(e) => setFormData({ ...formData, projektsollAktiv: e.target.checked })}
                    />
                    Projektsoll-Cutting aktiv
                  </label>
                </div>

                <div className="form-group-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.projektsollFlexibel}
                      onChange={(e) => setFormData({ ...formData, projektsollFlexibel: e.target.checked })}
                    />
                    Flexible Projektsoll-Zeiten
                  </label>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Zuschlagsdefinitionen</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Nacht Beginn</label>
                  <input
                    type="time"
                    value={formData.nachtBeginn}
                    onChange={(e) => setFormData({ ...formData, nachtBeginn: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Nacht Ende</label>
                  <input
                    type="time"
                    value={formData.nachtEnde}
                    onChange={(e) => setFormData({ ...formData, nachtEnde: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nachtzuschlag (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={(formData.nachtZuschlag * 100).toFixed(0)}
                    onChange={(e) => setFormData({ ...formData, nachtZuschlag: Number(e.target.value) / 100 })}
                  />
                </div>

                <div className="form-group">
                  <label>Sonntagszuschlag (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={(formData.sonntagZuschlag * 100).toFixed(0)}
                    onChange={(e) => setFormData({ ...formData, sonntagZuschlag: Number(e.target.value) / 100 })}
                  />
                </div>

                <div className="form-group">
                  <label>Feiertagszuschlag (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={(formData.feiertagZuschlag * 100).toFixed(0)}
                    onChange={(e) => setFormData({ ...formData, feiertagZuschlag: Number(e.target.value) / 100 })}
                  />
                </div>

                <div className="form-group">
                  <label>Samstagszuschlag (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={(formData.samstagZuschlag * 100).toFixed(0)}
                    onChange={(e) => setFormData({ ...formData, samstagZuschlag: Number(e.target.value) / 100 })}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="section-header">
                <h3>Einträge</h3>
                <button type="button" onClick={addEintrag} className="btn-secondary">
                  + Eintrag hinzufügen
                </button>
              </div>

              {formData.eintraege.map((eintrag, index) => (
                <div key={index} className="eintrag-card">
                  <div className="eintrag-header">
                    <h4>Eintrag {index + 1}</h4>
                    {formData.eintraege.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEintrag(index)}
                        className="btn-danger-small"
                      >
                        Entfernen
                      </button>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Stundensatz ({currency}) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={eintrag.stundensatz}
                        onChange={(e) => updateEintrag(index, 'stundensatz', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Von *</label>
                      <input
                        type="time"
                        value={eintrag.startzeit}
                        onChange={(e) => updateEintrag(index, 'startzeit', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Bis *</label>
                      <input
                        type="time"
                        value={eintrag.endzeit}
                        onChange={(e) => updateEintrag(index, 'endzeit', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Priorität</label>
                      <input
                        type="number"
                        value={eintrag.prioritaet}
                        onChange={(e) => updateEintrag(index, 'prioritaet', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Wochentage (leer = alle Tage)</label>
                    <div className="wochentage-selector">
                      {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((tag, tagIndex) => (
                        <button
                          key={tagIndex}
                          type="button"
                          className={`wochentag-btn ${(eintrag.wochentage || []).includes(tagIndex) ? 'active' : ''}`}
                          onClick={() => toggleWochentag(index, tagIndex)}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group-checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={eintrag.nurFeiertage || false}
                          onChange={(e) => updateEintrag(index, 'nurFeiertage', e.target.checked)}
                        />
                        Nur Feiertage
                      </label>
                    </div>

                    <div className="form-group-checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={eintrag.keineFeiertage || false}
                          onChange={(e) => updateEintrag(index, 'keineFeiertage', e.target.checked)}
                        />
                        Keine Feiertage
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Abbrechen
              </button>
              <button type="submit" className="btn-primary">
                {isEditing ? 'Aktualisieren' : 'Erstellen'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="zeitmodelle-list">
          {zeitmodelle.length === 0 ? (
            <p className="no-data">Keine Zeitmodelle vorhanden. Erstellen Sie ein neues Zeitmodell.</p>
          ) : (
            zeitmodelle.map((zeitmodell) => (
              <div key={zeitmodell.id} className="zeitmodell-card">
                <div className="card-header">
                  <div>
                    <h3>{zeitmodell.name}</h3>
                    <p className="card-description">{zeitmodell.beschreibung}</p>
                  </div>
                  <div className="card-actions">
                    <button onClick={() => handleEdit(zeitmodell)} className="btn-secondary">
                      Bearbeiten
                    </button>
                    <button onClick={() => handleDelete(zeitmodell.id)} className="btn-danger">
                      Löschen
                    </button>
                  </div>
                </div>

                <div className="card-info">
                  <div className="info-item">
                    <span className="label">Gültig von:</span>
                    <span>{new Date(zeitmodell.gueltigVon).toLocaleDateString('de-CH')}</span>
                  </div>
                  {zeitmodell.gueltigBis && (
                    <div className="info-item">
                      <span className="label">Gültig bis:</span>
                      <span>{new Date(zeitmodell.gueltigBis).toLocaleDateString('de-CH')}</span>
                    </div>
                  )}
                  <div className="info-item">
                    <span className="label">Version:</span>
                    <span>{zeitmodell.version}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Einträge:</span>
                    <span>{zeitmodell.eintraege.length}</span>
                  </div>
                </div>

                <div className="eintraege-preview">
                  <h4>Einträge:</h4>
                  {zeitmodell.eintraege.map((eintrag) => (
                    <div key={eintrag.id} className="eintrag-preview">
                      <span className="stundensatz">{zeitmodellService.formatStundensatz(eintrag.stundensatz, currency)}</span>
                      <span className="zeit">
                        {zeitmodellService.formatTimeForDisplay(eintrag.startzeit)} - {zeitmodellService.formatTimeForDisplay(eintrag.endzeit)}
                      </span>
                      <span className="wochentage">
                        {zeitmodellService.formatWochentage(eintrag.wochentage)}
                      </span>
                      {eintrag.nurFeiertage && <span className="badge">Nur Feiertage</span>}
                      {eintrag.keineFeiertage && <span className="badge">Keine Feiertage</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ZeitmodelleVerwaltung;
