import React from 'react';
import { AbsenceRequest } from '../../types';
import { absenceService } from '../../services/absence.service';

interface AbsencesTabProps {
  absences: AbsenceRequest[];
  onUpdate: () => void;
}

export const AbsencesTab: React.FC<AbsencesTabProps> = ({
  absences,
  onUpdate,
}) => {
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
      <h2>Abwesenheitsanträge</h2>

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
