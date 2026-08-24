import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import { deviceService, SoftwareReportRow, SoftwareInstallation } from '../../services/device.service';

export const SoftwareReportTab: React.FC = () => {
  const [rows, setRows] = useState<SoftwareReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');

  // Drill-down
  const [detailSoftware, setDetailSoftware] = useState<SoftwareReportRow | null>(null);
  const [installations, setInstallations] = useState<SoftwareInstallation[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await deviceService.getSoftwareReport());
    } catch (error) {
      console.error('Error loading software report:', error);
      alert('Fehler beim Laden des Software-Reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const types = useMemo(
    () => Array.from(new Set(rows.map(r => r.type).filter(Boolean))) as string[],
    [rows]
  );
  const vendors = useMemo(
    () => Array.from(new Set(rows.map(r => r.vendor).filter(Boolean))).sort() as string[],
    [rows]
  );

  const filtered = useMemo(() => rows.filter(r => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = !s
      || r.name.toLowerCase().includes(s)
      || (r.vendor || '').toLowerCase().includes(s)
      || r.versions.some(v => v.toLowerCase().includes(s));
    const matchesType = !typeFilter || r.type === typeFilter;
    const matchesVendor = !vendorFilter || r.vendor === vendorFilter;
    return matchesSearch && matchesType && matchesVendor;
  }), [rows, searchTerm, typeFilter, vendorFilter]);

  const totalInstallations = useMemo(
    () => filtered.reduce((a, r) => a + r.deviceCount, 0),
    [filtered]
  );

  const handleOpenDetail = async (row: SoftwareReportRow) => {
    setDetailSoftware(row);
    setInstallations([]);
    setDetailLoading(true);
    try {
      setInstallations(await deviceService.getSoftwareInstallations(row.name));
    } catch (error) {
      console.error('Error loading installations:', error);
      alert('Fehler beim Laden der Installationen');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExportCSV = () => {
    const header = ['Name', 'Hersteller', 'Typ', 'Anzahl Geräte', 'Versionen'];
    const lines = filtered.map(r => [
      r.name,
      r.vendor || '',
      r.type || '',
      String(r.deviceCount),
      r.versions.join(' | ')
    ].map(c => `"${c.replace(/"/g, '""')}"`).join(';'));
    const csv = [header.join(';'), ...lines].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `software-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleExportPDF = () => {
    try {
      // Querformat (Landscape) für breitere Tabelle
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;

      // Farbpalette (an App-Design angelehnt)
      const brand: [number, number, number] = [33, 150, 243];
      const brandDark: [number, number, number] = [21, 101, 192];
      const zebra: [number, number, number] = [244, 248, 252];
      const textDark: [number, number, number] = [33, 43, 54];
      const textMuted: [number, number, number] = [110, 120, 130];
      const lineColor: [number, number, number] = [224, 230, 236];

      const typeRGB = (type: string | null): [number, number, number] =>
        type === 'Betriebssystem' ? [142, 68, 173]
          : type === 'Lizenz' ? [22, 160, 133]
          : type === 'Abo' ? [211, 84, 0]
          : [41, 128, 185];

      const now = new Date();
      const dateStr = `${now.toLocaleDateString('de-CH')} ${now.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}`;

      // Spaltendefinition (Summe = Inhaltsbreite)
      const contentWidth = pageWidth - 2 * margin;
      const columns: { key: string; label: string; w: number; align?: 'left' | 'center' }[] = [
        { key: 'name', label: 'Software', w: 58 },
        { key: 'vendor', label: 'Hersteller', w: 50 },
        { key: 'type', label: 'Typ', w: 34, align: 'center' },
        { key: 'versions', label: 'Versionen', w: 66 },
        { key: 'count', label: 'Geräte', w: 24, align: 'center' },
      ];
      // Restbreite proportional auf 'name' und 'versions' verteilen
      const defined = columns.reduce((s, c) => s + c.w, 0);
      const extra = contentWidth - defined;
      if (extra > 0) {
        columns[0].w += extra * 0.5;
        columns[3].w += extra * 0.5;
      }

      const headerBandH = 26;
      const rowH = 8;
      const padX = 3;

      const truncate = (text: string, colW: number, fontSize: number) => {
        const maxWidth = colW - 2 * padX;
        if (doc.getStringUnitWidth(text) * fontSize * 0.3528 <= maxWidth) return text;
        let t = text;
        while (t.length > 1 && doc.getStringUnitWidth(t + '…') * fontSize * 0.3528 > maxWidth) {
          t = t.slice(0, -1);
        }
        return t + '…';
      };

      // ---- Kopfband ----
      const drawHeaderBand = () => {
        doc.setFillColor(...brand);
        doc.rect(0, 0, pageWidth, headerBandH, 'F');
        doc.setFillColor(...brandDark);
        doc.rect(0, headerBandH, pageWidth, 1.4, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('Software-Asset-Report', margin, 15);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const rightX = pageWidth - margin;
        doc.text(`Erstellt: ${dateStr}`, rightX, 11, { align: 'right' });
        doc.text(`Software-Titel: ${filtered.length} · Installationen: ${totalInstallations}`, rightX, 17, { align: 'right' });
      };

      // ---- Tabellenkopf ----
      const drawTableHeader = (y: number) => {
        doc.setFillColor(...brandDark);
        doc.rect(margin, y, contentWidth, rowH, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        let x = margin;
        columns.forEach((c) => {
          const tx = c.align === 'center' ? x + c.w / 2 : x + padX;
          doc.text(c.label, tx, y + rowH - 2.6, { align: c.align === 'center' ? 'center' : 'left' });
          x += c.w;
        });
        return y + rowH;
      };

      drawHeaderBand();

      // Aktive Filter als "Chips"
      let yPosition = headerBandH + 8;
      const activeFilters: string[] = [];
      if (searchTerm) activeFilters.push(`Suche: ${searchTerm}`);
      if (typeFilter) activeFilters.push(`Typ: ${typeFilter}`);
      if (vendorFilter) activeFilters.push(`Hersteller: ${vendorFilter}`);
      if (activeFilters.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...textMuted);
        doc.text('Aktive Filter:', margin, yPosition);
        let chipX = margin + doc.getStringUnitWidth('Aktive Filter:') * 8 * 0.3528 + 4;
        doc.setFont('helvetica', 'normal');
        activeFilters.forEach((f) => {
          const w = doc.getStringUnitWidth(f) * 8 * 0.3528 + 6;
          if (chipX + w > pageWidth - margin) {
            chipX = margin;
            yPosition += 7;
          }
          doc.setFillColor(232, 240, 250);
          doc.roundedRect(chipX, yPosition - 4, w, 6, 1.5, 1.5, 'F');
          doc.setTextColor(...brandDark);
          doc.text(f, chipX + 3, yPosition);
          chipX += w + 4;
        });
        yPosition += 8;
      }

      // ---- Tabelle ----
      yPosition = drawTableHeader(yPosition);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);

      filtered.forEach((row, idx) => {
        if (yPosition > pageHeight - 16) {
          doc.addPage();
          drawHeaderBand();
          yPosition = drawTableHeader(headerBandH + 8);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
        }

        if (idx % 2 === 1) {
          doc.setFillColor(...zebra);
          doc.rect(margin, yPosition, contentWidth, rowH, 'F');
        }

        const values: Record<string, string> = {
          name: row.name || '-',
          vendor: row.vendor || '-',
          versions: row.versions.length ? row.versions.join(', ') : '-',
        };

        let x = margin;
        const textY = yPosition + rowH - 2.8;
        columns.forEach((c) => {
          if (c.key === 'type') {
            const label = row.type || '-';
            doc.setFontSize(7.5);
            const tw = doc.getStringUnitWidth(label) * 7.5 * 0.3528;
            const bw = Math.min(c.w - 4, tw + 6);
            const bx = x + (c.w - bw) / 2;
            const by = yPosition + (rowH - 5) / 2;
            doc.setFillColor(...typeRGB(row.type));
            doc.roundedRect(bx, by, bw, 5, 2.5, 2.5, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text(truncate(label, bw, 7.5), x + c.w / 2, by + 3.5, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
          } else if (c.key === 'count') {
            const label = String(row.deviceCount);
            doc.setFontSize(8);
            const bw = 13;
            const bx = x + (c.w - bw) / 2;
            const by = yPosition + (rowH - 5) / 2;
            doc.setFillColor(...brand);
            doc.roundedRect(bx, by, bw, 5, 2.5, 2.5, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text(label, x + c.w / 2, by + 3.5, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
          } else {
            const isName = c.key === 'name';
            doc.setTextColor(...(isName ? textDark : textMuted));
            if (isName) doc.setFont('helvetica', 'bold');
            doc.text(truncate(values[c.key], c.w, 8.5), x + padX, textY);
            if (isName) doc.setFont('helvetica', 'normal');
          }
          x += c.w;
        });

        doc.setDrawColor(...lineColor);
        doc.setLineWidth(0.1);
        doc.line(margin, yPosition + rowH, margin + contentWidth, yPosition + rowH);

        yPosition += rowH;
      });

      // ---- Fußzeile auf allen Seiten ----
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(...lineColor);
        doc.setLineWidth(0.2);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textMuted);
        doc.text('cflux · Software-Asset-Report', margin, pageHeight - 7);
        doc.text(`Seite ${i} von ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
        doc.text(dateStr, pageWidth / 2, pageHeight - 7, { align: 'center' });
      }

      doc.save(`software-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Fehler beim Erstellen des PDFs');
    }
  };

  const typeColor = (type: string | null) =>
    type === 'Betriebssystem' ? '#8e44ad' : type === 'Lizenz' ? '#16a085' : type === 'Abo' ? '#d35400' : '#2980b9';

  const connDot = (status: string | null) => {
    if (!status) return null;
    const connected = status.toLowerCase() === 'connected';
    return (
      <span
        title={connected ? 'Verbunden' : 'Getrennt'}
        style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', marginRight: '6px', background: connected ? '#27ae60' : '#bbb' }}
      />
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📦 Software-Asset-Report</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handleExportPDF} title="Gefilterte Liste als PDF">📄 PDF</button>
          <button className="btn btn-secondary" onClick={handleExportCSV} title="Gefilterte Liste als CSV">📥 CSV</button>
          <button className="btn btn-secondary" onClick={load} title="Neu laden">🔄 Aktualisieren</button>
        </div>
      </div>

      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--card-bg, #f8f9fa)', padding: '15px', borderRadius: '8px', marginBottom: '20px',
        border: '1px solid var(--border-color, #dee2e6)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <div style={{ marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}>🔍 Filter</div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Suche nach Software, Hersteller oder Version…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '280px', fontSize: '14px' }}
          />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', minWidth: '150px' }}>
            <option value="">Alle Typen</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={vendorFilter} onChange={e => setVendorFilter(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', minWidth: '180px', maxWidth: '220px' }}>
            <option value="">Alle Hersteller</option>
            {vendors.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          {(searchTerm || typeFilter || vendorFilter) && (
            <button className="btn btn-sm btn-secondary" onClick={() => { setSearchTerm(''); setTypeFilter(''); setVendorFilter(''); }} style={{ padding: '8px 12px' }}>
              ✖ Filter zurücksetzen
            </button>
          )}
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary, #666)' }}>
          {filtered.length} von {rows.length} Software-Titeln · {totalInstallations} Installationen
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Software</th>
            <th>Hersteller</th>
            <th>Typ</th>
            <th>Versionen</th>
            <th style={{ textAlign: 'right' }}>Geräte</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Lädt…</td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Keine Software gefunden</td></tr>
          ) : (
            filtered.map(r => (
              <tr key={r.name} style={{ cursor: 'pointer' }} onClick={() => handleOpenDetail(r)} title="Geräte anzeigen">
                <td><strong>{r.name}</strong></td>
                <td>{r.vendor || '-'}</td>
                <td>
                  {r.type ? (
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', color: '#fff', background: typeColor(r.type), whiteSpace: 'nowrap' }}>
                      {r.type}
                    </span>
                  ) : '-'}
                </td>
                <td style={{ fontSize: '12px', color: '#555' }}>
                  {r.versions.length === 0 ? '-' : r.versions.slice(0, 4).join(', ') + (r.versions.length > 4 ? ` (+${r.versions.length - 4})` : '')}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span style={{ display: 'inline-block', minWidth: '28px', padding: '2px 8px', borderRadius: '10px', background: '#3498db', color: '#fff', fontWeight: 700, fontSize: '12px' }}>
                    {r.deviceCount}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {detailSoftware && (
        <div className="modal-overlay" onClick={() => setDetailSoftware(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '92%', padding: '0' }}>
            <div className="modal-header">
              <h3>📦 {detailSoftware.name}</h3>
              <button className="modal-close" onClick={() => setDetailSoftware(null)}>×</button>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                {detailSoftware.vendor && <span><strong>Hersteller:</strong> {detailSoftware.vendor} · </span>}
                <strong>Installiert auf {detailSoftware.deviceCount} Gerät(en)</strong>
              </p>
              <table className="table">
                <thead>
                  <tr><th>Gerät</th><th>Kategorie</th><th>Version</th></tr>
                </thead>
                <tbody>
                  {detailLoading ? (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '1.5rem', color: '#999' }}>Lädt…</td></tr>
                  ) : installations.length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '1.5rem', color: '#999' }}>Keine Geräte</td></tr>
                  ) : (
                    installations.map((inst, i) => (
                      <tr key={inst.deviceId + i}>
                        <td>{connDot(inst.status)}{inst.deviceName}</td>
                        <td>{inst.category || '-'}</td>
                        <td>{inst.version || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
