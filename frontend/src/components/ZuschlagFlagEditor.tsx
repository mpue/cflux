import React, { useState } from 'react';
import { TimeEntry } from '../types';
import { timeService } from '../services/time.service';

interface ZuschlagFlagEditorProps {
  timeEntry: TimeEntry;
  onUpdate?: (updated: TimeEntry) => void;
}

/**
 * Editor zum Setzen/Entfernen von Zuschlagsberechtigungen auf einem TimeEntry.
 * Ermöglicht es, einzelne Zuschläge (Nacht, Sonntag, Feiertag, Samstag) zu aktivieren/deaktivieren
 * und optional einen Grund anzugeben.
 */
const ZuschlagFlagEditor: React.FC<ZuschlagFlagEditorProps> = ({ timeEntry, onUpdate }) => {
  const [flags, setFlags] = useState({
    zuschlagNacht: timeEntry.zuschlagNacht ?? true,
    zuschlagSonntag: timeEntry.zuschlagSonntag ?? true,
    zuschlagFeiertag: timeEntry.zuschlagFeiertag ?? true,
    zuschlagSamstag: timeEntry.zuschlagSamstag ?? true,
    zuschlagGrund: timeEntry.zuschlagGrund || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const updated = await timeService.updateZuschlagFlags(timeEntry.id, flags);
      onUpdate?.(updated);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = 
    flags.zuschlagNacht !== (timeEntry.zuschlagNacht ?? true) ||
    flags.zuschlagSonntag !== (timeEntry.zuschlagSonntag ?? true) ||
    flags.zuschlagFeiertag !== (timeEntry.zuschlagFeiertag ?? true) ||
    flags.zuschlagSamstag !== (timeEntry.zuschlagSamstag ?? true) ||
    flags.zuschlagGrund !== (timeEntry.zuschlagGrund || '');

  return (
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '16px',
      backgroundColor: '#ffffff',
      marginTop: '12px'
    }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#334155' }}>
        Zuschlagsberechtigungen
      </h4>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={flags.zuschlagNacht}
            onChange={(e) => setFlags({ ...flags, zuschlagNacht: e.target.checked })}
          />
          Nachtzuschlag
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={flags.zuschlagSonntag}
            onChange={(e) => setFlags({ ...flags, zuschlagSonntag: e.target.checked })}
          />
          Sonntagszuschlag
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={flags.zuschlagFeiertag}
            onChange={(e) => setFlags({ ...flags, zuschlagFeiertag: e.target.checked })}
          />
          Feiertagszuschlag
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={flags.zuschlagSamstag}
            onChange={(e) => setFlags({ ...flags, zuschlagSamstag: e.target.checked })}
          />
          Samstagszuschlag
        </label>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#64748b' }}>
          Grund (falls nicht berechtigt)
        </label>
        <input
          type="text"
          value={flags.zuschlagGrund}
          onChange={(e) => setFlags({ ...flags, zuschlagGrund: e.target.value })}
          placeholder="z.B. Freiwillige Mehrarbeit"
          style={{
            width: '100%',
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '13px'
          }}
        />
      </div>

      {error && (
        <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '8px' }}>{error}</div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !hasChanges}
        style={{
          padding: '6px 16px',
          borderRadius: '4px',
          border: 'none',
          backgroundColor: hasChanges ? '#3b82f6' : '#e2e8f0',
          color: hasChanges ? '#ffffff' : '#94a3b8',
          fontSize: '13px',
          cursor: hasChanges ? 'pointer' : 'default',
          opacity: saving ? 0.6 : 1
        }}
      >
        {saving ? 'Speichern...' : 'Zuschläge speichern'}
      </button>
    </div>
  );
};

export default ZuschlagFlagEditor;
