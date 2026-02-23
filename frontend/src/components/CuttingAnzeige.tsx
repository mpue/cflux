import React from 'react';
import { TimeEntry } from '../types';

interface CuttingAnzeigeProps {
  timeEntry: TimeEntry;
  compact?: boolean;
}

/**
 * Zeigt Projektsoll-Cutting-Ergebnisse für einen TimeEntry an.
 * Visualisiert abrechenbare vs. nicht-abrechenbare Zeit, 
 * vorSoll/nachSoll und Zuschlagsstunden.
 */
const CuttingAnzeige: React.FC<CuttingAnzeigeProps> = ({ timeEntry, compact = false }) => {
  const hasCuttingData = timeEntry.abrechenbareStunden !== undefined && timeEntry.abrechenbareStunden !== null;

  if (!hasCuttingData) {
    return null;
  }

  const abrechenbar = timeEntry.abrechenbareStunden || 0;
  const nichtAbrechenbar = timeEntry.nichtAbrechenbar || 0;
  const vorSoll = timeEntry.vorSoll || 0;
  const nachSoll = timeEntry.nachSoll || 0;
  const gesamt = abrechenbar + nichtAbrechenbar;
  const prozentAbrechenbar = gesamt > 0 ? (abrechenbar / gesamt) * 100 : 0;

  const formatHours = (h: number) => h.toFixed(2);
  const formatMinutes = (m: number) => `${m} Min.`;

  if (compact) {
    return (
      <div style={{ fontSize: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ color: '#22c55e', fontWeight: 600 }}>
          {formatHours(abrechenbar)}h abr.
        </span>
        {nichtAbrechenbar > 0 && (
          <span style={{ color: '#ef4444' }}>
            {formatHours(nichtAbrechenbar)}h n.a.
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '16px',
      backgroundColor: '#f8fafc',
      marginTop: '12px'
    }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#334155' }}>
        Projektsoll-Cutting
      </h4>

      {/* Fortschrittsbalken */}
      <div style={{
        height: '8px',
        backgroundColor: '#fee2e2',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '12px'
      }}>
        <div style={{
          height: '100%',
          width: `${prozentAbrechenbar}%`,
          backgroundColor: '#22c55e',
          borderRadius: '4px',
          transition: 'width 0.3s'
        }} />
      </div>

      {/* Zahlen */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '13px' }}>
        <div>
          <div style={{ color: '#64748b', marginBottom: '2px' }}>Abrechenbar</div>
          <div style={{ fontWeight: 600, color: '#22c55e', fontSize: '16px' }}>
            {formatHours(abrechenbar)}h
          </div>
        </div>
        <div>
          <div style={{ color: '#64748b', marginBottom: '2px' }}>Nicht abrechenbar</div>
          <div style={{ fontWeight: 600, color: '#ef4444', fontSize: '16px' }}>
            {formatHours(nichtAbrechenbar)}h
          </div>
        </div>
        <div>
          <div style={{ color: '#64748b', marginBottom: '2px' }}>Gesamt</div>
          <div style={{ fontWeight: 600, fontSize: '16px' }}>
            {formatHours(gesamt)}h
          </div>
        </div>
      </div>

      {/* VorSoll / NachSoll Details */}
      {(vorSoll > 0 || nachSoll > 0) && (
        <div style={{
          display: 'flex',
          gap: '16px',
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #e2e8f0',
          fontSize: '12px',
          color: '#64748b'
        }}>
          {vorSoll > 0 && (
            <span>Vor Soll: {formatMinutes(vorSoll)}</span>
          )}
          {nachSoll > 0 && (
            <span>Nach Soll: {formatMinutes(nachSoll)}</span>
          )}
        </div>
      )}

      {/* Soll-Zeiten */}
      {timeEntry.sollBeginn && timeEntry.sollEnde && (
        <div style={{
          marginTop: '8px',
          fontSize: '12px',
          color: '#94a3b8'
        }}>
          Projektsoll: {new Date(timeEntry.sollBeginn).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })} - {new Date(timeEntry.sollEnde).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
          {timeEntry.sollPause && ` (${timeEntry.sollPause} Min. Pause)`}
        </div>
      )}

      {/* Zuschlagsstunden */}
      {(
        (timeEntry.nachtStunden && timeEntry.nachtStunden > 0) ||
        (timeEntry.sonntagStunden && timeEntry.sonntagStunden > 0) ||
        (timeEntry.feiertagStunden && timeEntry.feiertagStunden > 0) ||
        (timeEntry.samstagStunden && timeEntry.samstagStunden > 0)
      ) && (
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Zuschlagsstunden</div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px' }}>
            {timeEntry.nachtStunden && timeEntry.nachtStunden > 0 && (
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: timeEntry.zuschlagNacht ? '#dbeafe' : '#f1f5f9',
                color: timeEntry.zuschlagNacht ? '#1e40af' : '#94a3b8',
                textDecoration: timeEntry.zuschlagNacht ? 'none' : 'line-through'
              }}>
                Nacht: {formatHours(timeEntry.nachtStunden)}h
              </span>
            )}
            {timeEntry.sonntagStunden && timeEntry.sonntagStunden > 0 && (
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: timeEntry.zuschlagSonntag ? '#fef3c7' : '#f1f5f9',
                color: timeEntry.zuschlagSonntag ? '#92400e' : '#94a3b8',
                textDecoration: timeEntry.zuschlagSonntag ? 'none' : 'line-through'
              }}>
                Sonntag: {formatHours(timeEntry.sonntagStunden)}h
              </span>
            )}
            {timeEntry.feiertagStunden && timeEntry.feiertagStunden > 0 && (
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: timeEntry.zuschlagFeiertag ? '#fce7f3' : '#f1f5f9',
                color: timeEntry.zuschlagFeiertag ? '#9d174d' : '#94a3b8',
                textDecoration: timeEntry.zuschlagFeiertag ? 'none' : 'line-through'
              }}>
                Feiertag: {formatHours(timeEntry.feiertagStunden)}h
              </span>
            )}
            {timeEntry.samstagStunden && timeEntry.samstagStunden > 0 && (
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: timeEntry.zuschlagSamstag ? '#e0e7ff' : '#f1f5f9',
                color: timeEntry.zuschlagSamstag ? '#3730a3' : '#94a3b8',
                textDecoration: timeEntry.zuschlagSamstag ? 'none' : 'line-through'
              }}>
                Samstag: {formatHours(timeEntry.samstagStunden)}h
              </span>
            )}
          </div>
          {timeEntry.zuschlagGrund && (
            <div style={{ marginTop: '6px', fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
              {timeEntry.zuschlagGrund}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CuttingAnzeige;
