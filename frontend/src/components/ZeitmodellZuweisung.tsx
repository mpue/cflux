import React, { useState, useEffect } from 'react';
import { zeitmodellService, Zeitmodell, MitarbeiterZeitmodell } from '../services/zeitmodell.service';
import api from '../services/api';
import './ZeitmodellZuweisung.css';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Props {
  userId?: string;
  onClose?: () => void;
}

const ZeitmodellZuweisung: React.FC<Props> = ({ userId, onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [zeitmodelle, setZeitmodelle] = useState<Zeitmodell[]>([]);
  const [assignments, setAssignments] = useState<MitarbeiterZeitmodell[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>(userId || '');
  const [selectedZeitmodellId, setSelectedZeitmodellId] = useState<string>('');
  const [gueltigVon, setGueltigVon] = useState<string>(new Date().toISOString().split('T')[0]);
  const [gueltigBis, setGueltigBis] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadAssignments(selectedUserId);
    }
  }, [selectedUserId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [usersData, zeitmodelleData] = await Promise.all([
        api.get('/users').then(res => res.data),
        zeitmodellService.getAllZeitmodelle()
      ]);
      setUsers(usersData);
      setZeitmodelle(zeitmodelleData);
    } catch (err: any) {
      setError('Fehler beim Laden der Daten: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssignments = async (uid: string) => {
    try {
      const data = await zeitmodellService.getMitarbeiterZeitmodelle(uid);
      setAssignments(data);
    } catch (err: any) {
      console.error('Fehler beim Laden der Zuweisungen:', err);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedUserId || !selectedZeitmodellId) {
      setError('Bitte wählen Sie einen Mitarbeiter und ein Zeitmodell aus.');
      return;
    }

    try {
      await zeitmodellService.assignToMitarbeiter({
        mitarbeiterId: selectedUserId,
        zeitmodellId: selectedZeitmodellId,
        gueltigVon,
        gueltigBis: gueltigBis || undefined
      });

      setSuccess('Zeitmodell erfolgreich zugewiesen');
      setSelectedZeitmodellId('');
      setGueltigVon(new Date().toISOString().split('T')[0]);
      setGueltigBis('');
      loadAssignments(selectedUserId);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleRemove = async (assignmentId: string) => {
    if (!window.confirm('Möchten Sie diese Zuweisung wirklich entfernen?')) {
      return;
    }

    try {
      await zeitmodellService.removeMitarbeiterZeitmodell(assignmentId);
      setSuccess('Zuweisung erfolgreich entfernt');
      if (selectedUserId) {
        loadAssignments(selectedUserId);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const getZeitmodellName = (zeitmodellId: string) => {
    const zm = zeitmodelle.find(z => z.id === zeitmodellId);
    return zm ? zm.name : 'Unbekannt';
  };

  const getUserName = (uid: string) => {
    const user = users.find(u => u.id === uid);
    return user ? `${user.firstName} ${user.lastName}` : 'Unbekannt';
  };

  if (isLoading) {
    return <div className="loading">Laden...</div>;
  }

  return (
    <div className="zeitmodell-zuweisung">
      <div className="zuweisung-header">
        <h2>Zeitmodell-Zuweisung</h2>
        {onClose && (
          <button onClick={onClose} className="btn-close">
            ×
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleAssign} className="zuweisung-form">
        <div className="form-section">
          <h3>Neue Zuweisung</h3>

          <div className="form-group">
            <label>Mitarbeiter *</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              disabled={!!userId}
            >
              <option value="">Bitte wählen...</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Zeitmodell *</label>
            <select
              value={selectedZeitmodellId}
              onChange={(e) => setSelectedZeitmodellId(e.target.value)}
              required
            >
              <option value="">Bitte wählen...</option>
              {zeitmodelle.map(zm => (
                <option key={zm.id} value={zm.id}>
                  {zm.name} (Version {zm.version})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Gültig von *</label>
              <input
                type="date"
                value={gueltigVon}
                onChange={(e) => setGueltigVon(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Gültig bis</label>
              <input
                type="date"
                value={gueltigBis}
                onChange={(e) => setGueltigBis(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary">
            Zuweisen
          </button>
        </div>
      </form>

      {selectedUserId && (
        <div className="assignments-section">
          <h3>Aktuelle Zuweisungen für {getUserName(selectedUserId)}</h3>

          {assignments.length === 0 ? (
            <p className="no-data">Keine Zuweisungen vorhanden.</p>
          ) : (
            <div className="assignments-list">
              {assignments.map(assignment => (
                <div key={assignment.id} className="assignment-card">
                  <div className="assignment-info">
                    <div className="assignment-name">
                      {getZeitmodellName(assignment.zeitmodellId)}
                    </div>
                    <div className="assignment-dates">
                      <span>Von: {new Date(assignment.gueltigVon).toLocaleDateString('de-CH')}</span>
                      {assignment.gueltigBis && (
                        <span>Bis: {new Date(assignment.gueltigBis).toLocaleDateString('de-CH')}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(assignment.id)}
                    className="btn-danger-small"
                  >
                    Entfernen
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ZeitmodellZuweisung;
