import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export const HolidaysTab: React.FC = () => {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [cantons, setCantons] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCanton, setSelectedCanton] = useState<string>('CH');
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    date: '',
    name: '',
    canton: 'CH',
    percentage: 100
  });

  useEffect(() => {
    loadCantons();
    loadHolidays();
  }, [selectedYear, selectedCanton]);

  const loadCantons = async () => {
    try {
      const response = await api.get('/compliance/cantons');
      setCantons(response.data);
    } catch (error) {
      console.error('Error loading cantons:', error);
    }
  };

  const loadHolidays = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('year', selectedYear.toString());
      if (selectedCanton !== 'ALL') {
        params.append('canton', selectedCanton);
      }

      const response = await api.get(`/compliance/holidays?${params}`);
      setHolidays(response.data);
    } catch (error) {
      console.error('Error loading holidays:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncHolidays = async () => {
    if (!window.confirm(`Feiertage für ${selectedYear} von API synchronisieren?\n\nDies überschreibt alle bestehenden Einträge für dieses Jahr.`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/compliance/holidays/sync', { year: selectedYear });

      const result = response.data;
      alert(`Erfolgreich! ${result.count} Feiertage synchronisiert.\n\nNationale: ${result.details?.national}\nKantonale: ${result.details?.cantonal}\nZusätzliche: ${result.details?.additional}`);
      loadHolidays();
    } catch (error) {
      console.error('Error syncing holidays:', error);
      alert('Fehler beim Synchronisieren der Feiertage');
    } finally {
      setLoading(false);
    }
  };

  const addHoliday = async () => {
    if (!newHoliday.date || !newHoliday.name) {
      alert('Bitte Datum und Name eingeben');
      return;
    }

    try {
      await api.post('/compliance/holidays', newHoliday);

      setShowAddModal(false);
      setNewHoliday({ date: '', name: '', canton: 'CH', percentage: 100 });
      loadHolidays();
    } catch (error) {
      console.error('Error adding holiday:', error);
      alert('Fehler beim Hinzufügen des Feiertags');
    }
  };

  const deleteHoliday = async (id: string) => {
    if (!window.confirm('Feiertag wirklich löschen?')) return;

    try {
      await api.delete(`/compliance/holidays/${id}`);
      loadHolidays();
    } catch (error) {
      console.error('Error deleting holiday:', error);
      alert('Fehler beim Löschen des Feiertags');
    }
  };

  const groupedHolidays = holidays.reduce((acc: any, holiday: any) => {
    const month = new Date(holiday.date).toLocaleDateString('de-DE', { month: 'long' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(holiday);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>🗓️ Feiertage-Verwaltung</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            {[...Array(5)].map((_, i) => {
              const year = new Date().getFullYear() - 1 + i;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>

          <select
            value={selectedCanton}
            onChange={(e) => setSelectedCanton(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="ALL">Alle Kantone</option>
            {cantons.map(canton => (
              <option key={canton.code} value={canton.code}>{canton.name}</option>
            ))}
          </select>

          <button
            className="btn btn-primary"
            onClick={syncHolidays}
            disabled={loading}
          >
            🔄 Von API synchronisieren
          </button>

          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            ➕ Feiertag hinzufügen
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Lade Feiertage...</div>
      ) : holidays.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>Keine Feiertage gefunden für {selectedYear}</p>
          <button className="btn btn-primary" onClick={syncHolidays}>
            Jetzt von API synchronisieren
          </button>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <strong>{holidays.length} Feiertage</strong> für {selectedCanton === 'ALL' ? 'alle Kantone' : cantons.find(c => c.code === selectedCanton)?.name}
          </div>

          {Object.entries(groupedHolidays).map(([month, monthHolidays]: [string, any]) => (
            <div key={month} style={{ marginBottom: '30px' }}>
              <h3 style={{ 
                background: '#007bff', 
                color: 'white', 
                padding: '10px 15px', 
                borderRadius: '4px',
                marginBottom: '10px'
              }}>
                {month}
              </h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>Datum</th>
                    <th>Name</th>
                    <th style={{ width: '100px' }}>Kanton</th>
                    <th style={{ width: '80px' }}>%</th>
                    <th style={{ width: '100px' }}>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {monthHolidays.map((holiday: any) => (
                    <tr key={holiday.id}>
                      <td>{new Date(holiday.date).toLocaleDateString('de-DE', { 
                        weekday: 'short', 
                        day: '2-digit', 
                        month: '2-digit' 
                      })}</td>
                      <td>{holiday.name}</td>
                      <td>
                        <span style={{ 
                          background: holiday.canton === 'CH' ? '#28a745' : '#007bff',
                          color: 'white',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {holiday.canton}
                        </span>
                      </td>
                      <td>{holiday.percentage}%</td>
                      <td>
                        <button
                          className="btn btn-small btn-danger"
                          onClick={() => deleteHoliday(holiday.id)}
                          title="Löschen"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Add Holiday Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Neuer Feiertag</h2>
            <div className="form-group">
              <label>Datum</label>
              <input
                type="date"
                value={newHoliday.date}
                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={newHoliday.name}
                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                placeholder="z.B. Neujahr"
              />
            </div>
            <div className="form-group">
              <label>Kanton</label>
              <select
                value={newHoliday.canton}
                onChange={(e) => setNewHoliday({ ...newHoliday, canton: e.target.value })}
              >
                {cantons.map(canton => (
                  <option key={canton.code} value={canton.code}>{canton.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Prozentsatz (100 = ganzer Tag)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={newHoliday.percentage}
                onChange={(e) => setNewHoliday({ ...newHoliday, percentage: parseInt(e.target.value) })}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-primary" onClick={addHoliday}>
                Erstellen
              </button>
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
