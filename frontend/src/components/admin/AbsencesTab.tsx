import React, { useState, useEffect } from 'react';
import { AbsenceRequest, User } from '../../types';
import { absenceService } from '../../services/absence.service';
import { userService } from '../../services/user.service';
import { BaseModal } from '../common/BaseModal';

interface AbsencesTabProps {
  absences: AbsenceRequest[];
  onUpdate: () => void;
}

const ABSENCE_TYPE_LABELS: Record<string, string> = {
  VACATION: 'Urlaub',
  SICK_LEAVE: 'Krankheit',
  PERSONAL_LEAVE: 'Persönlich',
  UNPAID_LEAVE: 'Unbezahlt',
  OTHER: 'Sonstiges',
};

const ManualAbsenceModal: React.FC<{ onClose: () => void; onSave: () => void }> = ({ onClose, onSave }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    userId: '',
    type: 'VACATION',
    startDate: '',
    endDate: '',
    days: 1,
    reason: '',
    status: 'APPROVED',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    userService.getAllUsers().then(setUsers).catch(console.error);
  }, []);

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end >= start) {
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setFormData(prev => ({ ...prev, days: diffDays }));
      }
    }
  }, [formData.startDate, formData.endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.userId) {
      setError('Bitte einen Benutzer auswählen');
      return;
    }
    try {
      await absenceService.createManualAbsence(formData);
      onSave();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Fehler beim Speichern');
    }
  };

  return (
    <BaseModal isOpen={true} onClose={onClose}>
      <h2>Manueller Abwesenheitseintrag</h2>
      {error && <div style={{ color: '#dc3545', marginBottom: '10px' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Benutzer</label>
          <select
            value={formData.userId}
            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
            required
          >
            <option value="">-- Benutzer wählen --</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName} ({u.email})
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Typ</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            {Object.entries(ABSENCE_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Von</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Bis</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Tage</label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            value={formData.days}
            onChange={(e) => setFormData({ ...formData, days: parseFloat(e.target.value) })}
            required
          />
        </div>
        <div className="form-group">
          <label>Grund</label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            rows={2}
          />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="APPROVED">Genehmigt</option>
            <option value="PENDING">Ausstehend</option>
            <option value="REJECTED">Abgelehnt</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button type="submit" className="btn btn-primary">Speichern</button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Abbrechen</button>
        </div>
      </form>
    </BaseModal>
  );
};

export const AbsencesTab: React.FC<AbsencesTabProps> = ({
  absences,
  onUpdate,
}) => {
  const [showManualModal, setShowManualModal] = useState(false);
  const pending = absences.filter((a) => a.status === 'PENDING');
  const processed = absences.filter((a) => a.status !== 'PENDING');

  const handleApprove = async (id: string) => {
    await absenceService.approveAbsenceRequest(id);
    onUpdate();
  };

  const handleReject = async (id: string) => {
    await absenceService.rejectAbsenceRequest(id);
    onUpdate();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Abwesenheitsanträge</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowManualModal(true)}
        >
          + Manueller Eintrag
        </button>
      </div>

      {showManualModal && (
        <ManualAbsenceModal
          onClose={() => setShowManualModal(false)}
          onSave={() => {
            setShowManualModal(false);
            onUpdate();
          }}
        />
      )}

      <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Ausstehend</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Benutzer</th>
            <th>Typ</th>
            <th>Von</th>
            <th>Bis</th>
            <th>Tage</th>
            <th>Grund</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {pending.map((request) => (
            <tr key={request.id}>
              <td>{request.user?.firstName} {request.user?.lastName}</td>
              <td>{request.type}</td>
              <td>{new Date(request.startDate).toLocaleDateString('de-DE')}</td>
              <td>{new Date(request.endDate).toLocaleDateString('de-DE')}</td>
              <td>{request.days}</td>
              <td>{request.reason || '-'}</td>
              <td>
                <button
                  className="btn btn-success"
                  style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                  onClick={() => handleApprove(request.id)}
                >
                  Genehmigen
                </button>
                <button
                  className="btn btn-danger"
                  style={{ padding: '5px 10px', fontSize: '12px' }}
                  onClick={() => handleReject(request.id)}
                >
                  Ablehnen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: '30px', marginBottom: '10px' }}>Bearbeitet</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Benutzer</th>
            <th>Typ</th>
            <th>Von</th>
            <th>Bis</th>
            <th>Tage</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {processed.slice(0, 20).map((request) => (
            <tr key={request.id}>
              <td>{request.user?.firstName} {request.user?.lastName}</td>
              <td>{request.type}</td>
              <td>{new Date(request.startDate).toLocaleDateString('de-DE')}</td>
              <td>{new Date(request.endDate).toLocaleDateString('de-DE')}</td>
              <td>{request.days}</td>
              <td>
                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: request.status === 'APPROVED' ? '#d4edda' : '#f8d7da',
                    color: request.status === 'APPROVED' ? '#155724' : '#721c24',
                  }}
                >
                  {request.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
