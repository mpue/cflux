import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CONDITION_LABELS,
  HandoverProtocol,
  HandoverProtocolStatus,
  HandoverProtocolType,
  KIND_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
  handoverProtocolService,
} from '../../services/handoverProtocol.service';
import { Device } from '../../services/device.service';
import { User } from '../../types';
import { HandoverProtocolModal } from './HandoverProtocolModal';

interface HandoverProtocolsTabProps {
  users: User[];
  devices?: Device[];
  /** Nur Protokolle zu diesem Gerät zeigen (Einsatz im Geräte-Dialog) */
  deviceId?: string;
  /** Kompakte Darstellung ohne Filterleiste, z.B. eingebettet im Geräte-Dialog */
  embedded?: boolean;
  /** Vorgang, mit dem der Dialog für ein neues Protokoll startet */
  defaultType?: HandoverProtocolType;
  /** Empfänger, der im Dialog für ein neues Protokoll vorgewählt ist */
  defaultUserId?: string;
}

const STATUS_COLORS: Record<HandoverProtocolStatus, string> = {
  DRAFT: '#f39c12',
  SIGNED: '#27ae60',
  CANCELLED: '#95a5a6',
};

export const HandoverProtocolsTab: React.FC<HandoverProtocolsTabProps> = ({
  users,
  devices,
  deviceId,
  embedded = false,
  defaultType = 'HANDOVER',
  defaultUserId = '',
}) => {
  const [protocols, setProtocols] = useState<HandoverProtocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | HandoverProtocolType>('');
  const [statusFilter, setStatusFilter] = useState<'' | HandoverProtocolStatus>('');
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [signingId, setSigningId] = useState<string | null>(null);
  const signFileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await handoverProtocolService.getAll(deviceId ? { deviceId } : undefined);
      setProtocols(data);
    } catch (err: any) {
      console.error('Fehler beim Laden der Übergabeprotokolle:', err);
      setError(err?.response?.data?.error || 'Übergabeprotokolle konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return protocols.filter((protocol) => {
      if (typeFilter && protocol.type !== typeFilter) return false;
      if (statusFilter && protocol.status !== statusFilter) return false;
      if (!term) return true;
      const recipient = protocol.employee || protocol.user;
      const haystack = [
        protocol.protocolNumber,
        recipient ? `${recipient.firstName} ${recipient.lastName}` : '',
        protocol.location || '',
        protocol.notes || '',
        ...protocol.items.map((item) => `${item.name} ${item.serialNumber || ''} ${item.inventoryNumber || ''}`),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [protocols, searchTerm, typeFilter, statusFilter]);

  const openPdf = async (protocol: HandoverProtocol, download: boolean) => {
    try {
      const blob = await handoverProtocolService.getPdf(protocol.id);
      const url = window.URL.createObjectURL(blob);
      if (download) {
        const link = document.createElement('a');
        link.href = url;
        link.download = `${protocol.protocolNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(url, '_blank');
      }
      // Object-URL erst nach dem Öffnen freigeben, sonst bleibt der Tab leer
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error('Fehler beim Erzeugen des PDFs:', err);
      alert('PDF konnte nicht erzeugt werden');
    }
  };

  const openSignedDocument = async (protocol: HandoverProtocol) => {
    try {
      const blob = await handoverProtocolService.getSignedDocument(protocol.id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error('Fehler beim Laden des unterschriebenen Protokolls:', err);
      alert('Unterschriebenes Protokoll konnte nicht geladen werden');
    }
  };

  const handleSignClick = (protocol: HandoverProtocol) => {
    setSigningId(protocol.id);
    signFileInput.current?.click();
  };

  const handleSignFileChosen = async (file: File | null) => {
    if (!signingId) return;
    try {
      await handoverProtocolService.sign(signingId, file);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Unterschrift konnte nicht erfasst werden');
    } finally {
      setSigningId(null);
      if (signFileInput.current) signFileInput.current.value = '';
    }
  };

  const handleMarkSignedWithoutScan = async (protocol: HandoverProtocol) => {
    if (!window.confirm(`${protocol.protocolNumber} als unterschrieben markieren (ohne Scan)?`)) return;
    try {
      await handoverProtocolService.sign(protocol.id, null);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Unterschrift konnte nicht erfasst werden');
    }
  };

  const handleCancel = async (protocol: HandoverProtocol) => {
    const reason = window.prompt(`${protocol.protocolNumber} stornieren. Grund (optional):`);
    if (reason === null) return;
    try {
      await handoverProtocolService.cancel(protocol.id, reason || undefined);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Protokoll konnte nicht storniert werden');
    }
  };

  const handleDelete = async (protocol: HandoverProtocol) => {
    if (!window.confirm(`${protocol.protocolNumber} endgültig löschen?`)) return;
    try {
      await handoverProtocolService.remove(protocol.id);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Protokoll konnte nicht gelöscht werden');
    }
  };

  const recipientName = (protocol: HandoverProtocol) => {
    const recipient = protocol.employee || protocol.user;
    return recipient ? `${recipient.lastName} ${recipient.firstName}` : '–';
  };

  return (
    <div>
      {/* Verstecktes Feld für den Upload des eingescannten Protokolls */}
      <input
        ref={signFileInput}
        type="file"
        accept="application/pdf,image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleSignFileChosen(e.target.files?.[0] || null)}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: embedded ? '12px' : '20px',
        }}
      >
        {!embedded && <h2 style={{ margin: 0 }}>📄 Übergabeprotokolle</h2>}
        {embedded && (
          <span style={{ color: '#666', fontSize: '14px' }}>
            {loading ? 'Lädt…' : `${filtered.length} Protokolle zu diesem Gerät`}
          </span>
        )}
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Neues Protokoll
        </button>
      </div>

      {!embedded && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="🔍 Nummer, Mitarbeiter, Gerät, Seriennummer…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', minWidth: '280px', flex: 1 }}
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as '' | HandoverProtocolType)}
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', minWidth: '160px' }}
            >
              <option value="">Alle Vorgänge</option>
              <option value="HANDOVER">Übergabe</option>
              <option value="RETURN">Rücknahme</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as '' | HandoverProtocolStatus)}
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', minWidth: '160px' }}
            >
              <option value="">Alle Status</option>
              <option value="DRAFT">Entwurf</option>
              <option value="SIGNED">Unterschrieben</option>
              <option value="CANCELLED">Storniert</option>
            </select>
            {(searchTerm || typeFilter || statusFilter) && (
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('');
                  setStatusFilter('');
                }}
                style={{ padding: '8px 12px' }}
              >
                ✖ Filter zurücksetzen
              </button>
            )}
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary, #666)' }}>
            {filtered.length} von {protocols.length} Protokollen angezeigt
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: '#fdecea', color: '#b3261e', padding: '10px 12px', borderRadius: '4px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Nummer</th>
            <th>Vorgang</th>
            <th>Datum</th>
            <th>Empfänger</th>
            <th>Positionen</th>
            <th>Status</th>
            <th>Erstellt von</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                {loading ? 'Lädt…' : 'Keine Übergabeprotokolle gefunden'}
              </td>
            </tr>
          ) : (
            filtered.map((protocol) => (
              <React.Fragment key={protocol.id}>
                <tr>
                  <td>
                    <button
                      onClick={() => setExpandedId(expandedId === protocol.id ? null : protocol.id)}
                      style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        fontWeight: 700,
                        color: '#3498db',
                        fontFamily: 'monospace',
                      }}
                      title="Positionen ein-/ausblenden"
                    >
                      {expandedId === protocol.id ? '▾' : '▸'} {protocol.protocolNumber}
                    </button>
                  </td>
                  <td>{TYPE_LABELS[protocol.type]}</td>
                  <td>{new Date(protocol.handoverDate).toLocaleDateString('de-CH')}</td>
                  <td>{recipientName(protocol)}</td>
                  <td>{protocol.items.length}</td>
                  <td>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '10px',
                        background: STATUS_COLORS[protocol.status],
                        color: '#fff',
                        whiteSpace: 'nowrap',
                      }}
                      title={protocol.signedAt ? `Unterschrieben am ${new Date(protocol.signedAt).toLocaleString('de-CH')}` : undefined}
                    >
                      {STATUS_LABELS[protocol.status]}
                    </span>
                  </td>
                  <td>{protocol.issuedBy ? `${protocol.issuedBy.lastName} ${protocol.issuedBy.firstName}` : '–'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-sm btn-secondary" onClick={() => openPdf(protocol, false)} title="PDF öffnen">
                        📄
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => openPdf(protocol, true)} title="PDF herunterladen">
                        ⬇️
                      </button>
                      {protocol.status === 'DRAFT' && (
                        <>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleSignClick(protocol)}
                            title="Unterschriebenes Protokoll hochladen"
                          >
                            📎
                          </button>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleMarkSignedWithoutScan(protocol)}
                            title="Als unterschrieben markieren"
                          >
                            ✔
                          </button>
                        </>
                      )}
                      {protocol.signedDocumentPath && (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => openSignedDocument(protocol)}
                          title="Unterschriebenes Original anzeigen"
                        >
                          🖊️
                        </button>
                      )}
                      {protocol.status !== 'CANCELLED' && (
                        <button className="btn btn-sm btn-warning" onClick={() => handleCancel(protocol)} title="Stornieren">
                          🚫
                        </button>
                      )}
                      {protocol.status !== 'SIGNED' && (
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(protocol)} title="Löschen">
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedId === protocol.id && (
                  <tr>
                    <td colSpan={8} style={{ background: 'var(--bg-secondary, #f8f9fa)' }}>
                      <div style={{ padding: '8px 4px' }}>
                        {(protocol.location || protocol.notes) && (
                          <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--text-secondary, #666)' }}>
                            {protocol.location && <>Ort: {protocol.location}</>}
                            {protocol.location && protocol.notes && ' · '}
                            {protocol.notes}
                          </p>
                        )}
                        <table className="table" style={{ marginBottom: 0 }}>
                          <thead>
                            <tr>
                              <th>Bezeichnung</th>
                              <th>Art</th>
                              <th>Serien-/Inv.-Nr.</th>
                              <th>Zustand</th>
                              <th>Zubehör</th>
                              <th>Anmerkung</th>
                            </tr>
                          </thead>
                          <tbody>
                            {protocol.items.map((item) => (
                              <tr key={item.id}>
                                <td><strong>{item.name}</strong></td>
                                <td>{KIND_LABELS[item.kind]}</td>
                                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                                  {[item.serialNumber, item.inventoryNumber].filter(Boolean).join(' / ') || '–'}
                                </td>
                                <td>{CONDITION_LABELS[item.condition]}</td>
                                <td>{item.accessories || '–'}</td>
                                <td>{item.notes || '–'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <HandoverProtocolModal
          users={users}
          devices={devices}
          initialDeviceIds={deviceId ? [deviceId] : []}
          initialType={defaultType}
          initialUserId={defaultUserId}
          onClose={() => setShowModal(false)}
          onSaved={async (protocol) => {
            setShowModal(false);
            await load();
            if (window.confirm(`Protokoll ${protocol.protocolNumber} erstellt. PDF jetzt öffnen?`)) {
              openPdf(protocol, false);
            }
          }}
        />
      )}
    </div>
  );
};
