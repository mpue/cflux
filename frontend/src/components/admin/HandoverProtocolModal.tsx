import React, { useEffect, useMemo, useState } from 'react';
import {
  CONDITION_LABELS,
  CreateProtocolInput,
  EquipmentCondition,
  HandoverItemInput,
  HandoverItemKind,
  HandoverProtocol,
  HandoverProtocolType,
  KIND_LABELS,
  handoverProtocolService,
} from '../../services/handoverProtocol.service';
import { Device, deviceService } from '../../services/device.service';
import { Tool, werkzeugeService } from '../../services/werkzeuge.service';
import { equipmentService } from '../../services/onboardingService';
import { Equipment } from '../../types/onboarding';
import { User } from '../../types';

interface HandoverProtocolModalProps {
  users: User[];
  /** Geräte, die beim Öffnen bereits als Position eingetragen werden */
  initialDeviceIds?: string[];
  initialUserId?: string;
  initialType?: HandoverProtocolType;
  /** Bereits geladene Geräte; fehlen sie, werden sie nachgeladen */
  devices?: Device[];
  onClose: () => void;
  onSaved: (protocol: HandoverProtocol) => void;
}

/** Position im Formular – vor dem Speichern noch ohne ID. */
interface DraftItem extends HandoverItemInput {
  key: string;
  kind: HandoverItemKind;
  label: string;
}

const CONDITIONS: EquipmentCondition[] = ['NEW', 'GOOD', 'FAIR', 'DAMAGED'];

let keyCounter = 0;
const nextKey = () => `item-${++keyCounter}`;

export const HandoverProtocolModal: React.FC<HandoverProtocolModalProps> = ({
  users,
  initialDeviceIds = [],
  initialUserId = '',
  initialType = 'HANDOVER',
  devices: devicesProp,
  onClose,
  onSaved,
}) => {
  const [type, setType] = useState<HandoverProtocolType>(initialType);
  const [userId, setUserId] = useState(initialUserId);
  const [handoverDate, setHandoverDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [devices, setDevices] = useState<Device[]>(devicesProp ?? []);
  const [tools, setTools] = useState<Tool[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  // Auswahl für "Position hinzufügen"
  const [addKind, setAddKind] = useState<HandoverItemKind>('DEVICE');
  const [addAssetId, setAddAssetId] = useState('');
  const [freeName, setFreeName] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [loadedDevices, loadedTools, loadedEquipment] = await Promise.all([
          devicesProp ? Promise.resolve(devicesProp) : deviceService.getAllDevices(),
          werkzeugeService.getAllTools(),
          equipmentService.getAll({ isActive: true }),
        ]);
        setDevices(loadedDevices);
        setTools(loadedTools);
        setEquipment(loadedEquipment);
      } catch (err) {
        console.error('Fehler beim Laden der Betriebsmittel:', err);
        setError('Betriebsmittel konnten nicht geladen werden');
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Vorbelegte Geräte als Positionen übernehmen, sobald die Geräteliste da ist
  useEffect(() => {
    if (initialDeviceIds.length === 0 || devices.length === 0) return;
    setItems((current) => {
      if (current.length > 0) return current;
      return initialDeviceIds
        .map((id) => devices.find((d) => d.id === id))
        .filter((d): d is Device => !!d)
        .map((device) => ({
          key: nextKey(),
          kind: 'DEVICE' as HandoverItemKind,
          deviceId: device.id,
          label: `${device.name}${device.serialNumber ? ` (SN: ${device.serialNumber})` : ''}`,
          condition: 'GOOD' as EquipmentCondition,
          accessories: '',
          notes: '',
        }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices]);

  const usedAssetIds = useMemo(
    () => new Set(items.map((i) => i.deviceId || i.toolId || i.equipmentId).filter(Boolean) as string[]),
    [items]
  );

  const activeUsers = useMemo(
    () =>
      users
        .filter((u) => u.isActive)
        .sort((a, b) =>
          `${a.lastName} ${a.firstName}`.toLowerCase().localeCompare(`${b.lastName} ${b.firstName}`.toLowerCase())
        ),
    [users]
  );

  /**
   * Bei einer Rücknahme sind nur Betriebsmittel sinnvoll, die dem Empfänger
   * aktuell zugewiesen sind – bei einer Übergabe nur freie.
   */
  const selectableDevices = useMemo(
    () =>
      devices
        .filter((d) => !usedAssetIds.has(d.id))
        .filter((d) => (type === 'RETURN' ? d.userId === userId : true))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [devices, usedAssetIds, type, userId]
  );

  const selectableTools = useMemo(
    () =>
      tools
        .filter((t) => !usedAssetIds.has(t.id))
        .filter((t) => (type === 'RETURN' ? t.assignedToId === userId : true))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [tools, usedAssetIds, type, userId]
  );

  const selectableEquipment = useMemo(
    () => equipment.filter((e) => !usedAssetIds.has(e.id)).sort((a, b) => a.name.localeCompare(b.name)),
    [equipment, usedAssetIds]
  );

  const handleAddItem = () => {
    setError('');
    if (addKind === 'OTHER') {
      if (!freeName.trim()) {
        setError('Bitte eine Bezeichnung für die freie Position angeben');
        return;
      }
      setItems([
        ...items,
        { key: nextKey(), kind: 'OTHER', name: freeName.trim(), label: freeName.trim(), condition: 'GOOD', accessories: '', notes: '' },
      ]);
      setFreeName('');
      return;
    }

    if (!addAssetId) {
      setError('Bitte ein Betriebsmittel auswählen');
      return;
    }

    if (addKind === 'DEVICE') {
      const device = devices.find((d) => d.id === addAssetId);
      if (!device) return;
      setItems([
        ...items,
        {
          key: nextKey(),
          kind: 'DEVICE',
          deviceId: device.id,
          label: `${device.name}${device.serialNumber ? ` (SN: ${device.serialNumber})` : ''}`,
          condition: 'GOOD',
          accessories: '',
          notes: '',
        },
      ]);
    } else if (addKind === 'TOOL') {
      const tool = tools.find((t) => t.id === addAssetId);
      if (!tool) return;
      setItems([
        ...items,
        {
          key: nextKey(),
          kind: 'TOOL',
          toolId: tool.id,
          label: `${tool.name}${tool.inventoryNumber ? ` (${tool.inventoryNumber})` : ''}`,
          condition: 'GOOD',
          accessories: '',
          notes: '',
        },
      ]);
    } else {
      const eq = selectableEquipment.find((e) => e.id === addAssetId);
      if (!eq) return;
      setItems([
        ...items,
        {
          key: nextKey(),
          kind: 'EQUIPMENT',
          equipmentId: eq.id,
          label: `${eq.name}${eq.inventoryNumber ? ` (${eq.inventoryNumber})` : ''}`,
          condition: 'GOOD',
          accessories: '',
          notes: '',
        },
      ]);
    }
    setAddAssetId('');
  };

  const updateItem = (key: string, patch: Partial<DraftItem>) => {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  const removeItem = (key: string) => {
    setItems((current) => current.filter((item) => item.key !== key));
  };

  const handleSave = async () => {
    setError('');
    if (!userId) {
      setError('Bitte einen Empfänger auswählen');
      return;
    }
    if (items.length === 0) {
      setError('Bitte mindestens eine Position erfassen');
      return;
    }

    const payload: CreateProtocolInput = {
      type,
      userId,
      handoverDate,
      location: location.trim() || null,
      notes: notes.trim() || null,
      items: items.map((item) => ({
        kind: item.kind,
        deviceId: item.deviceId ?? null,
        toolId: item.toolId ?? null,
        equipmentId: item.equipmentId ?? null,
        name: item.name,
        condition: item.condition,
        accessories: item.accessories || null,
        notes: item.notes || null,
      })),
    };

    try {
      setSaving(true);
      const protocol = await handoverProtocolService.create(payload);
      onSaved(protocol);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Protokoll konnte nicht gespeichert werden');
    } finally {
      setSaving(false);
    }
  };

  const assetOptions =
    addKind === 'DEVICE'
      ? selectableDevices.map((d) => ({
          id: d.id,
          label: `${d.name}${d.serialNumber ? ` · SN ${d.serialNumber}` : ''}${
            d.user ? ` · ${d.user.lastName} ${d.user.firstName}` : ''
          }`,
        }))
      : addKind === 'TOOL'
      ? selectableTools.map((t) => ({
          id: t.id,
          label: `${t.name}${t.inventoryNumber ? ` · ${t.inventoryNumber}` : ''}`,
        }))
      : selectableEquipment.map((e) => ({
          id: e.id,
          label: `${e.name}${e.inventoryNumber ? ` · ${e.inventoryNumber}` : ''}`,
        }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '960px', width: '96%', padding: '0', maxHeight: '92vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <h3>📄 {type === 'RETURN' ? 'Rücknahmeprotokoll' : 'Übergabeprotokoll'} erstellen</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{ padding: '24px' }}>
          {error && (
            <div
              style={{
                background: '#fdecea',
                color: '#b3261e',
                padding: '10px 12px',
                borderRadius: '4px',
                marginBottom: '16px',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          {/* Kopfdaten */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label>Vorgang *</label>
              <select value={type} onChange={(e) => setType(e.target.value as HandoverProtocolType)}>
                <option value="HANDOVER">Übergabe an Mitarbeiter</option>
                <option value="RETURN">Rücknahme vom Mitarbeiter</option>
              </select>
            </div>
            <div className="form-group">
              <label>Empfänger *</label>
              <select value={userId} onChange={(e) => setUserId(e.target.value)}>
                <option value="">Bitte wählen…</option>
                {activeUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.lastName} {user.firstName} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>{type === 'RETURN' ? 'Rücknahmedatum' : 'Übergabedatum'} *</label>
              <input type="date" value={handoverDate} onChange={(e) => setHandoverDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Ort</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="z.B. Zürich, IT-Lager"
              />
            </div>
          </div>

          {/* Positionen */}
          <h4 style={{ margin: '20px 0 10px' }}>Positionen ({items.length})</h4>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              background: 'var(--bg-secondary, #f8f9fa)',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '12px',
            }}
          >
            <div className="form-group" style={{ margin: 0, minWidth: '140px' }}>
              <label>Art</label>
              <select
                value={addKind}
                onChange={(e) => {
                  setAddKind(e.target.value as HandoverItemKind);
                  setAddAssetId('');
                }}
              >
                {(['DEVICE', 'TOOL', 'EQUIPMENT', 'OTHER'] as HandoverItemKind[]).map((kind) => (
                  <option key={kind} value={kind}>
                    {KIND_LABELS[kind]}
                  </option>
                ))}
              </select>
            </div>

            {addKind === 'OTHER' ? (
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '240px' }}>
                <label>Bezeichnung</label>
                <input
                  type="text"
                  value={freeName}
                  onChange={(e) => setFreeName(e.target.value)}
                  placeholder="z.B. Schlüssel Büro 2.14"
                />
              </div>
            ) : (
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '260px' }}>
                <label>Betriebsmittel</label>
                <select value={addAssetId} onChange={(e) => setAddAssetId(e.target.value)}>
                  <option value="">
                    {assetOptions.length === 0
                      ? type === 'RETURN'
                        ? 'Nichts zugewiesen'
                        : 'Keine Auswahl verfügbar'
                      : 'Bitte wählen…'}
                  </option>
                  {assetOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button type="button" className="btn btn-secondary" onClick={handleAddItem}>
              + Hinzufügen
            </button>
          </div>

          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#999', fontSize: '14px' }}>
              Noch keine Positionen erfasst
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '30px' }}>Nr.</th>
                  <th>Bezeichnung</th>
                  <th style={{ width: '100px' }}>Art</th>
                  <th style={{ width: '130px' }}>Zustand</th>
                  <th>Zubehör</th>
                  <th>Anmerkung</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.key}>
                    <td>{index + 1}</td>
                    <td><strong>{item.label}</strong></td>
                    <td>{KIND_LABELS[item.kind]}</td>
                    <td>
                      <select
                        value={item.condition}
                        onChange={(e) => updateItem(item.key, { condition: e.target.value as EquipmentCondition })}
                        style={{ width: '100%', padding: '4px' }}
                      >
                        {CONDITIONS.map((condition) => (
                          <option key={condition} value={condition}>
                            {CONDITION_LABELS[condition]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.accessories || ''}
                        onChange={(e) => updateItem(item.key, { accessories: e.target.value })}
                        placeholder="Netzteil, Tasche, Dock…"
                        style={{ width: '100%', padding: '4px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => updateItem(item.key, { notes: e.target.value })}
                        style={{ width: '100%', padding: '4px' }}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => removeItem(item.key)}
                        title="Position entfernen"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>Bemerkungen</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary, #666)', marginTop: '8px' }}>
            {type === 'RETURN'
              ? 'Beim Speichern werden die offenen Zuweisungen der Positionen geschlossen.'
              : 'Beim Speichern werden die Positionen dem Empfänger zugewiesen; bestehende Zuweisungen werden geschlossen.'}
          </p>

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Abbrechen
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Speichert…' : 'Protokoll erstellen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
