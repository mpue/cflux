import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { Device, DeviceSoftware, DeviceUpdate, DeviceVulnerability, deviceService } from '../../services/device.service';
import { User } from '../../types';

interface DevicesTabProps {
  devices: Device[];
  users: User[];
  onUpdate: () => void;
}

export const DevicesTab: React.FC<DevicesTabProps> = ({ devices, users, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningDevice, setAssigningDevice] = useState<Device | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [editingCell, setEditingCell] = useState<{ deviceId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    manufacturer: '',
    model: '',
    category: '',
    purchaseDate: '',
    warrantyUntil: '',
    notes: '',
    userId: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  // Software / Lizenzen (Assetkatalog pro Gerät)
  const [softwareModalDevice, setSoftwareModalDevice] = useState<Device | null>(null);
  const [assetTab, setAssetTab] = useState<'software' | 'updates' | 'vulnerabilities'>('software');
  const [softwareList, setSoftwareList] = useState<DeviceSoftware[]>([]);
  const [softwareLoading, setSoftwareLoading] = useState(false);
  const [deviceUpdates, setDeviceUpdates] = useState<DeviceUpdate[]>([]);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [deviceVulns, setDeviceVulns] = useState<DeviceVulnerability[]>([]);
  const [vulnsLoading, setVulnsLoading] = useState(false);
  const [editingSoftware, setEditingSoftware] = useState<DeviceSoftware | null>(null);
  const [showSoftwareForm, setShowSoftwareForm] = useState(false);
  const emptySoftwareForm = {
    name: '',
    type: '',
    vendor: '',
    version: '',
    licenseKey: '',
    licenseType: '',
    seats: '',
    purchaseDate: '',
    expiryDate: '',
    cost: '',
    notes: ''
  };
  const [softwareForm, setSoftwareForm] = useState(emptySoftwareForm);

  // Action1-Synchronisation
  const [action1Syncing, setAction1Syncing] = useState(false);
  const [deploying, setDeploying] = useState(false);

  const categories = ['Laptop', 'Handy', 'Tablet', 'Monitor', 'SIM-Karte', 'PSA', 'Werkzeug', 'Sonstiges'];
  const softwareTypes = ['Software', 'Betriebssystem', 'Lizenz', 'Abo'];

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

      const now = new Date();
      const dateStr = `${now.toLocaleDateString('de-CH')} ${now.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}`;

      // Spaltendefinition (Summe = Inhaltsbreite)
      const contentWidth = pageWidth - 2 * margin;
      const columns: { key: string; label: string; w: number; align?: 'left' | 'center' }[] = [
        { key: 'name', label: 'Name', w: 52 },
        { key: 'category', label: 'Kategorie', w: 32 },
        { key: 'manufacturer', label: 'Hersteller', w: 38 },
        { key: 'model', label: 'Modell', w: 40 },
        { key: 'serialNumber', label: 'Seriennummer', w: 45 },
        { key: 'owner', label: 'Besitzer', w: 40 },
        { key: 'status', label: 'Status', w: 22, align: 'center' },
      ];
      // Restbreite proportional auf 'name' und 'model' verteilen
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
        // Akzentstreifen
        doc.setFillColor(...brandDark);
        doc.rect(0, headerBandH, pageWidth, 1.4, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('Geräteliste', margin, 15);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        // Meta rechtsbündig
        const rightX = pageWidth - margin;
        doc.text(`Erstellt: ${dateStr}`, rightX, 11, { align: 'right' });
        doc.text(`Anzahl Geräte: ${filteredDevices.length}`, rightX, 17, { align: 'right' });
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
      if (categoryFilter) activeFilters.push(`Kategorie: ${categoryFilter}`);
      if (userFilter) {
        const user = users.find((u) => u.id === userFilter);
        activeFilters.push(`Benutzer: ${user ? `${user.firstName} ${user.lastName}` : 'Nicht zugewiesen'}`);
      }
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

      filteredDevices.forEach((device, idx) => {
        // Seitenumbruch
        if (yPosition > pageHeight - 16) {
          doc.addPage();
          drawHeaderBand();
          yPosition = drawTableHeader(headerBandH + 8);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
        }

        // Zebra-Hintergrund
        if (idx % 2 === 1) {
          doc.setFillColor(...zebra);
          doc.rect(margin, yPosition, contentWidth, rowH, 'F');
        }

        const values: Record<string, string> = {
          name: device.name || '-',
          category: device.category || '-',
          manufacturer: device.manufacturer || '-',
          model: device.model || '-',
          serialNumber: device.serialNumber || '-',
          owner: device.user ? `${device.user.firstName} ${device.user.lastName}` : '–',
        };

        let x = margin;
        const textY = yPosition + rowH - 2.8;
        columns.forEach((c) => {
          if (c.key === 'status') {
            // Status-Badge
            const active = device.isActive;
            const label = active ? 'Aktiv' : 'Inaktiv';
            doc.setFontSize(7.5);
            const bw = 16;
            const bx = x + (c.w - bw) / 2;
            const by = yPosition + (rowH - 5) / 2;
            if (active) doc.setFillColor(46, 160, 67);
            else doc.setFillColor(180, 186, 193);
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

        // dünne Trennlinie unter der Zeile
        doc.setDrawColor(...lineColor);
        doc.setLineWidth(0.1);
        doc.line(margin, yPosition + rowH, margin + contentWidth, yPosition + rowH);

        yPosition += rowH;
      });

      // Rahmen um die gesamte Tabelle (optisch sauberer Abschluss)
      doc.setDrawColor(...lineColor);
      doc.setLineWidth(0.2);

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
        doc.text('cflux · Geräteverwaltung', margin, pageHeight - 7);
        doc.text(`Seite ${i} von ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
        doc.text(dateStr, pageWidth / 2, pageHeight - 7, { align: 'center' });
      }

      // Speichern
      doc.save(`geraete-liste-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Fehler beim Erstellen des PDFs');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await deviceService.exportDevices();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `geraete-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Export');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const devices = JSON.parse(text);

        if (!Array.isArray(devices)) {
          alert('Ungültiges JSON-Format. Es wird ein Array von Geräten erwartet.');
          return;
        }

        const result = await deviceService.importDevices(devices);
        alert(
          `Import abgeschlossen:\n` +
          `Erfolgreich: ${result.results.success}\n` +
          `Fehlgeschlagen: ${result.results.failed}` +
          (result.results.errors.length > 0 ? `\n\nFehler:\n${result.results.errors.join('\n')}` : '')
        );
        onUpdate();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Fehler beim Import');
      }
    };
    input.click();
  };

  const handleOpenModal = (device?: Device) => {
    if (device) {
      setEditingDevice(device);
      setFormData({
        name: device.name,
        serialNumber: device.serialNumber || '',
        manufacturer: device.manufacturer || '',
        model: device.model || '',
        category: device.category || '',
        purchaseDate: device.purchaseDate ? device.purchaseDate.split('T')[0] : '',
        warrantyUntil: device.warrantyUntil ? device.warrantyUntil.split('T')[0] : '',
        notes: device.notes || '',
        userId: device.userId || ''
      });
    } else {
      setEditingDevice(null);
      setFormData({
        name: '',
        serialNumber: '',
        manufacturer: '',
        model: '',
        category: '',
        purchaseDate: '',
        warrantyUntil: '',
        notes: '',
        userId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDevice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const deviceData = {
        ...formData,
        serialNumber: formData.serialNumber || undefined,
        manufacturer: formData.manufacturer || undefined,
        model: formData.model || undefined,
        category: formData.category || undefined,
        purchaseDate: formData.purchaseDate || undefined,
        warrantyUntil: formData.warrantyUntil || undefined,
        notes: formData.notes || undefined,
        userId: formData.userId || undefined
      };

      if (editingDevice) {
        await deviceService.updateDevice(editingDevice.id, deviceData);
      } else {
        await deviceService.createDevice(deviceData);
      }

      handleCloseModal();
      onUpdate();
    } catch (error) {
      console.error('Error saving device:', error);
      alert(error instanceof Error ? error.message : 'Fehler beim Speichern');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchten Sie dieses Gerät wirklich löschen?')) {
      return;
    }

    try {
      await deviceService.deleteDevice(id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting device:', error);
      alert('Fehler beim Löschen des Geräts');
    }
  };

  const handleAssign = async (device: Device) => {
    setAssigningDevice(device);
    setSelectedUserId('');
    setIsAssignModalOpen(true);
  };

  const handleConfirmAssign = async () => {
    if (!assigningDevice || !selectedUserId) {
      alert('Bitte wählen Sie einen Benutzer aus');
      return;
    }

    try {
      await deviceService.assignDevice(assigningDevice.id, selectedUserId);
      setIsAssignModalOpen(false);
      setAssigningDevice(null);
      setSelectedUserId('');
      onUpdate();
    } catch (error) {
      console.error('Error assigning device:', error);
      alert('Fehler beim Zuweisen des Geräts');
    }
  };

  const handleCancelAssign = () => {
    setIsAssignModalOpen(false);
    setAssigningDevice(null);
    setSelectedUserId('');
  };

  const handleDuplicate = (device: Device) => {
    setEditingDevice(null);
    setFormData({
      name: `${device.name} (Kopie)`,
      serialNumber: '', // Seriennummer muss eindeutig sein
      manufacturer: device.manufacturer || '',
      model: device.model || '',
      category: device.category || '',
      purchaseDate: device.purchaseDate ? device.purchaseDate.split('T')[0] : '',
      warrantyUntil: device.warrantyUntil ? device.warrantyUntil.split('T')[0] : '',
      notes: device.notes || '',
      userId: '' // Besitzer wird nicht kopiert
    });
    setIsModalOpen(true);
  };

  const handleCellDoubleClick = (device: Device, field: string) => {
    setEditingCell({ deviceId: device.id, field });
    const value = (device as any)[field];
    setEditValue(value || '');
  };

  const handleCellBlur = async () => {
    if (!editingCell) return;

    const device = devices.find(d => d.id === editingCell.deviceId);
    if (!device) return;

    const currentValue = (device as any)[editingCell.field];
    if (currentValue === editValue || (!currentValue && !editValue)) {
      setEditingCell(null);
      return;
    }

    try {
      await deviceService.updateDevice(device.id, {
        [editingCell.field]: editValue || undefined
      });
      setEditingCell(null);
      onUpdate();
    } catch (error) {
      console.error('Error updating device:', error);
      alert('Fehler beim Speichern');
      setEditingCell(null);
    }
  };

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleReturn = async (deviceId: string) => {
    if (!window.confirm('Möchten Sie dieses Gerät zurückgeben?')) {
      return;
    }

    try {
      await deviceService.returnDevice(deviceId);
      onUpdate();
    } catch (error) {
      console.error('Error returning device:', error);
      alert('Fehler beim Zurückgeben des Geräts');
    }
  };

  // ── Software / Lizenzen ──────────────────────────────────
  const loadSoftware = async (deviceId: string) => {
    setSoftwareLoading(true);
    try {
      const list = await deviceService.getDeviceSoftware(deviceId);
      setSoftwareList(list);
    } catch (error) {
      console.error('Error loading software:', error);
      alert('Fehler beim Laden der Software/Lizenzen');
    } finally {
      setSoftwareLoading(false);
    }
  };

  const handleDeployUpdates = async (device: Device) => {
    const count = deviceUpdates.length;
    const list = deviceUpdates.slice(0, 15).map(u => `• ${u.title}`).join('\n');
    const confirmMsg =
      `${count} fehlende Update(s) auf „${device.name}" über Action1 ausrollen?\n\n` +
      `${list}${count > 15 ? `\n… und ${count - 15} weitere` : ''}\n\n` +
      `⚠️ Die Updates werden real auf dem Gerät installiert.\n` +
      `Kein automatischer Neustart (auto_reboot = no).`;
    if (!window.confirm(confirmMsg)) return;

    setDeploying(true);
    try {
      const result = await deviceService.deployDeviceUpdates(device.id, false);
      alert(
        `Deployment angelegt: „${result.policyName}"\n` +
        `${result.packages.length} Paket(e) werden auf „${device.name}" installiert.\n\n` +
        `Der Rollout läuft in Action1; der Status ist dort einsehbar. Kein automatischer Neustart.`
      );
    } catch (error: any) {
      console.error('Deploy error:', error);
      alert(error.response?.data?.error || 'Fehler beim Ausrollen der Updates');
    } finally {
      setDeploying(false);
    }
  };

  const loadUpdates = async (deviceId: string) => {
    setUpdatesLoading(true);
    try {
      setDeviceUpdates(await deviceService.getDeviceUpdates(deviceId));
    } catch (error) {
      console.error('Error loading updates:', error);
      alert('Fehler beim Laden der Updates');
    } finally {
      setUpdatesLoading(false);
    }
  };

  const loadVulns = async (deviceId: string) => {
    setVulnsLoading(true);
    try {
      setDeviceVulns(await deviceService.getDeviceVulnerabilities(deviceId));
    } catch (error) {
      console.error('Error loading vulnerabilities:', error);
      alert('Fehler beim Laden der Schwachstellen');
    } finally {
      setVulnsLoading(false);
    }
  };

  const handleOpenSoftware = async (device: Device, tab: 'software' | 'updates' | 'vulnerabilities' = 'software') => {
    setSoftwareModalDevice(device);
    setAssetTab(tab);
    setShowSoftwareForm(false);
    setEditingSoftware(null);
    setSoftwareForm(emptySoftwareForm);
    setDeviceUpdates([]);
    setDeviceVulns([]);
    if (tab === 'software') await loadSoftware(device.id);
    else if (tab === 'updates') await loadUpdates(device.id);
    else await loadVulns(device.id);
  };

  const handleSelectAssetTab = async (tab: 'software' | 'updates' | 'vulnerabilities') => {
    setAssetTab(tab);
    setShowSoftwareForm(false);
    if (!softwareModalDevice) return;
    if (tab === 'software' && softwareList.length === 0) await loadSoftware(softwareModalDevice.id);
    else if (tab === 'updates' && deviceUpdates.length === 0) await loadUpdates(softwareModalDevice.id);
    else if (tab === 'vulnerabilities' && deviceVulns.length === 0) await loadVulns(softwareModalDevice.id);
  };

  const handleCloseSoftware = () => {
    setSoftwareModalDevice(null);
    setSoftwareList([]);
    setDeviceUpdates([]);
    setDeviceVulns([]);
    setAssetTab('software');
    setShowSoftwareForm(false);
    setEditingSoftware(null);
    // Geräteliste aktualisieren, damit Badge-Zähler stimmt
    onUpdate();
  };

  const handleNewSoftware = () => {
    setEditingSoftware(null);
    setSoftwareForm(emptySoftwareForm);
    setShowSoftwareForm(true);
  };

  const handleEditSoftware = (sw: DeviceSoftware) => {
    setEditingSoftware(sw);
    setSoftwareForm({
      name: sw.name || '',
      type: sw.type || '',
      vendor: sw.vendor || '',
      version: sw.version || '',
      licenseKey: sw.licenseKey || '',
      licenseType: sw.licenseType || '',
      seats: sw.seats != null ? String(sw.seats) : '',
      purchaseDate: sw.purchaseDate ? sw.purchaseDate.split('T')[0] : '',
      expiryDate: sw.expiryDate ? sw.expiryDate.split('T')[0] : '',
      cost: sw.cost != null ? String(sw.cost) : '',
      notes: sw.notes || ''
    });
    setShowSoftwareForm(true);
  };

  const handleSubmitSoftware = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!softwareModalDevice) return;

    const payload = {
      name: softwareForm.name,
      type: softwareForm.type || undefined,
      vendor: softwareForm.vendor || undefined,
      version: softwareForm.version || undefined,
      licenseKey: softwareForm.licenseKey || undefined,
      licenseType: softwareForm.licenseType || undefined,
      seats: softwareForm.seats !== '' ? Number(softwareForm.seats) : undefined,
      purchaseDate: softwareForm.purchaseDate || undefined,
      expiryDate: softwareForm.expiryDate || undefined,
      cost: softwareForm.cost !== '' ? Number(softwareForm.cost) : undefined,
      notes: softwareForm.notes || undefined
    };

    try {
      if (editingSoftware) {
        await deviceService.updateDeviceSoftware(softwareModalDevice.id, editingSoftware.id, payload);
      } else {
        await deviceService.createDeviceSoftware(softwareModalDevice.id, payload);
      }
      setShowSoftwareForm(false);
      setEditingSoftware(null);
      setSoftwareForm(emptySoftwareForm);
      await loadSoftware(softwareModalDevice.id);
    } catch (error: any) {
      console.error('Error saving software:', error);
      alert(error.response?.data?.error || 'Fehler beim Speichern');
    }
  };

  const handleDeleteSoftware = async (sw: DeviceSoftware) => {
    if (!softwareModalDevice) return;
    if (!window.confirm(`"${sw.name}" wirklich löschen?`)) return;

    try {
      await deviceService.deleteDeviceSoftware(softwareModalDevice.id, sw.id);
      await loadSoftware(softwareModalDevice.id);
    } catch (error) {
      console.error('Error deleting software:', error);
      alert('Fehler beim Löschen');
    }
  };

  // ── Action1-Synchronisation ──────────────────────────────
  const describeSyncError = (error: any): string => {
    if (error?.response) {
      // Backend hat geantwortet
      return error.response.data?.error
        || `Server-Fehler (HTTP ${error.response.status} ${error.response.statusText || ''})`;
    }
    if (error?.request) {
      // Anfrage gesendet, aber keine Antwort erhalten
      return 'Keine Antwort vom Server – möglicher Timeout oder Backend-Absturz während des Syncs. ' +
        'Bitte die Backend-Konsole prüfen (dort steht der genaue Fehler).';
    }
    return error?.message || 'Fehler bei der Action1-Synchronisation';
  };

  const handleAction1SyncAll = async () => {
    if (!window.confirm('Software aller Geräte jetzt aus Action1 synchronisieren?\n\nDer Sync läuft im Hintergrund; das Ergebnis wird angezeigt, sobald er fertig ist.')) return;
    setAction1Syncing(true);
    try {
      const start = await deviceService.startAction1Sync();
      if (start.alreadyRunning) {
        // Läuft bereits – wir hängen uns einfach an den laufenden Job an
        console.log('Action1-Sync läuft bereits, warte auf Ergebnis…');
      }

      // Status pollen, bis der Hintergrund-Job fertig ist (max. ~20 Min)
      const maxAttempts = 400; // 400 × 3s
      let status = start.status;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        status = await deviceService.getAction1SyncStatus();
        if (!status.running) break;
      }

      if (status.running) {
        alert('Der Sync läuft noch. Bitte später erneut prüfen (er läuft im Hintergrund weiter).');
      } else if (status.error) {
        alert('Action1-Synchronisation fehlgeschlagen:\n\n' + status.error);
      } else if (status.summary) {
        const summary = status.summary;
        const skippedNames = summary.results.filter(r => !r.matched).map(r => r.deviceName);
        alert(
          `Action1-Synchronisation abgeschlossen:\n\n` +
          `Geräte zugeordnet: ${summary.devicesMatched}/${summary.devicesTotal}\n` +
          (summary.devicesCreated > 0 ? `Neu angelegte Geräte: ${summary.devicesCreated}\n` : '') +
          (summary.serialsUpdated > 0 ? `Seriennummern übernommen: ${summary.serialsUpdated}\n` : '') +
          `Software hinzugefügt: ${summary.added}\n` +
          `Aktualisiert: ${summary.updated}\n` +
          `Entfernt: ${summary.removed}\n` +
          `Fehlende Updates: ${summary.updatesTotal}\n` +
          `Schwachstellen (CVEs): ${summary.vulnsTotal}` +
          (skippedNames.length > 0
            ? `\n\nNicht zugeordnet (${skippedNames.length}):\n${skippedNames.slice(0, 20).join(', ')}${skippedNames.length > 20 ? '…' : ''}`
            : '')
        );
      }
      onUpdate();
    } catch (error: any) {
      console.error('Action1 sync error:', error);
      alert(describeSyncError(error));
    } finally {
      setAction1Syncing(false);
    }
  };

  const handleAction1SyncDevice = async (device: Device) => {
    setAction1Syncing(true);
    try {
      const result = await deviceService.syncDeviceFromAction1(device.id);
      if (!result.matched) {
        alert(result.error || 'Kein passender Action1-Endpoint gefunden');
      } else {
        alert(
          `Synchronisation für "${result.deviceName}":\n` +
          `Hinzugefügt: ${result.added}, Aktualisiert: ${result.updated}, Entfernt: ${result.removed}`
        );
      }
      if (softwareModalDevice && softwareModalDevice.id === device.id) {
        await loadSoftware(device.id);
      }
      onUpdate();
    } catch (error: any) {
      console.error('Action1 device sync error:', error);
      alert(describeSyncError(error));
    } finally {
      setAction1Syncing(false);
    }
  };

  // Ablauf-Status: 'expired' (rot) | 'soon' (gelb, < 30 Tage) | 'ok' | null
  const getExpiryStatus = (expiryDate?: string): 'expired' | 'soon' | 'ok' | null => {
    if (!expiryDate) return null;
    const now = new Date();
    const exp = new Date(expiryDate);
    const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'expired';
    if (days <= 30) return 'soon';
    return 'ok';
  };

  const expiryColor = (status: ReturnType<typeof getExpiryStatus>) =>
    status === 'expired' ? '#e74c3c' : status === 'soon' ? '#f39c12' : '#27ae60';

  // Aggregierter Status der Software eines Geräts (für Badge am Button)
  const deviceSoftwareBadge = (device: Device): { count: number; worst: 'expired' | 'soon' | null } => {
    const list = device.software || [];
    let worst: 'expired' | 'soon' | null = null;
    for (const sw of list) {
      const s = getExpiryStatus(sw.expiryDate);
      if (s === 'expired') { worst = 'expired'; break; }
      if (s === 'soon' && worst !== 'expired') worst = 'soon';
    }
    return { count: list.length, worst };
  };

  // CVE-Schweregrad → Farbe / Rang
  const scoreColor = (score?: string | null): string => {
    const s = (score || '').toLowerCase();
    if (s === 'critical') return '#e74c3c';
    if (s === 'high') return '#e67e22';
    if (s === 'medium') return '#f39c12';
    if (s === 'low') return '#3498db';
    return '#7f8c8d';
  };
  const scoreLabel = (score?: string | null): string => {
    const s = (score || '').toLowerCase();
    if (s === 'critical') return 'Kritisch';
    if (s === 'high') return 'Hoch';
    if (s === 'medium') return 'Mittel';
    if (s === 'low') return 'Niedrig';
    return score || '-';
  };

  // Verbindungsanzeige (Action1): 🟢 verbunden, ⚪ getrennt
  const connectionDot = (device: Device) => {
    if (!device.action1Status) return null;
    const connected = device.action1Status.toLowerCase() === 'connected';
    const seen = device.action1LastSeen ? new Date(device.action1LastSeen).toLocaleString('de-CH') : '–';
    const title =
      `Action1: ${connected ? 'Verbunden' : 'Getrennt'}` +
      `\nZuletzt gesehen: ${seen}` +
      (device.action1IpAddress ? `\nIP: ${device.action1IpAddress}` : '') +
      `\n(Stand: letzter Sync)`;
    return (
      <span
        title={title}
        style={{
          display: 'inline-block', width: '9px', height: '9px', borderRadius: '50%',
          marginRight: '6px', verticalAlign: 'middle',
          background: connected ? '#27ae60' : '#bbb',
          boxShadow: connected ? '0 0 0 2px rgba(39,174,96,0.2)' : 'none'
        }}
      />
    );
  };

  // Badge: Anzahl offener Updates
  const deviceUpdatesBadge = (device: Device): number => (device.updates || []).length;

  // Badge: CVE-Anzahl + schlimmster Schweregrad
  const deviceVulnsBadge = (device: Device): { count: number; worst: string | null } => {
    const list = device.vulnerabilities || [];
    const rank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    let worst: string | null = null;
    let worstRank = 0;
    for (const v of list) {
      const r = rank[(v.score || '').toLowerCase()] || 0;
      if (r > worstRank) { worstRank = r; worst = v.score || null; }
    }
    return { count: list.length, worst };
  };

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.user && `${device.user.firstName} ${device.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = !categoryFilter || device.category === categoryFilter;
    const matchesUser = !userFilter || device.userId === userFilter;

    return matchesSearch && matchesCategory && matchesUser;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📱 Geräteverwaltung</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={handleExportPDF}
            title="Gefilterte Liste als PDF exportieren"
          >
            📄 PDF
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleExport}
            title="Alle Geräte als JSON exportieren"
          >
            📥 Export
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleImport}
            title="Geräte aus JSON importieren"
          >
            📤 Import
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleAction1SyncAll}
            disabled={action1Syncing}
            title="Installierte Software aller Geräte aus Action1 synchronisieren"
          >
            {action1Syncing ? '⏳ Sync…' : '🔄 Action1-Sync'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => handleOpenModal()}
          >
            Neues Gerät
          </button>
        </div>
      </div>

      <div style={{ 
        position: 'sticky',
        top: '0',
        zIndex: 100,
        background: 'var(--card-bg, #f8f9fa)', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid var(--border-color, #dee2e6)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <div style={{ marginBottom: '8px', fontWeight: '600', color: 'var(--text-primary, #333)', fontSize: '13px' }}>
          🔍 Filter
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Suche nach Name, Seriennummer, Hersteller oder Modell..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              flex: 1, 
              padding: '10px', 
              borderRadius: '4px', 
              border: '1px solid #ccc', 
              minWidth: '300px',
              fontSize: '14px'
            }}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ 
              padding: '10px', 
              borderRadius: '4px', 
              border: '1px solid #ccc',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            <option value="">Alle Kategorien</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            style={{ 
              padding: '10px', 
              borderRadius: '4px', 
              border: '1px solid #ccc',
              fontSize: '14px',
              minWidth: '180px'
            }}
          >
            <option value="">Alle Benutzer</option>
            <option value="">Nicht zugewiesen</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName}
              </option>
            ))}
          </select>
          {(searchTerm || categoryFilter || userFilter) && (
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setUserFilter('');
              }}
              title="Alle Filter zurücksetzen"
              style={{ padding: '8px 12px' }}
            >
              ✖ Filter zurücksetzen
            </button>
          )}
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary, #666)' }}>
          {filteredDevices.length} von {devices.length} Geräten angezeigt
        </div>
      </div>

      <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Kategorie</th>
              <th>Seriennummer</th>
              <th>Hersteller</th>
              <th>Modell</th>
              <th>Besitzer</th>
              <th>Garantie</th>
              <th>Status</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                  Keine Geräte gefunden
                </td>
              </tr>
            ) : (
              filteredDevices.map(device => (
              <tr key={device.id}>
                <td onDoubleClick={() => handleCellDoubleClick(device, 'name')}>
                  {editingCell?.deviceId === device.id && editingCell?.field === 'name' ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleCellBlur}
                      onKeyDown={handleCellKeyDown}
                      autoFocus
                      style={{ width: '100%', padding: '4px', border: '1px solid #3498db' }}
                    />
                  ) : (
                    <span>{connectionDot(device)}<strong>{device.name}</strong></span>
                  )}
                </td>
                <td onDoubleClick={() => handleCellDoubleClick(device, 'category')}>
                  {editingCell?.deviceId === device.id && editingCell?.field === 'category' ? (
                    <select
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleCellBlur}
                      onKeyDown={handleCellKeyDown}
                      autoFocus
                      style={{ width: '100%', padding: '4px', border: '1px solid #3498db' }}
                    >
                      <option value="">-</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    device.category || '-'
                  )}
                </td>
                <td onDoubleClick={() => handleCellDoubleClick(device, 'serialNumber')}>
                  {editingCell?.deviceId === device.id && editingCell?.field === 'serialNumber' ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleCellBlur}
                      onKeyDown={handleCellKeyDown}
                      autoFocus
                      style={{ width: '100%', padding: '4px', border: '1px solid #3498db' }}
                    />
                  ) : (
                    device.serialNumber || '-'
                  )}
                </td>
                <td onDoubleClick={() => handleCellDoubleClick(device, 'manufacturer')}>
                  {editingCell?.deviceId === device.id && editingCell?.field === 'manufacturer' ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleCellBlur}
                      onKeyDown={handleCellKeyDown}
                      autoFocus
                      style={{ width: '100%', padding: '4px', border: '1px solid #3498db' }}
                    />
                  ) : (
                    device.manufacturer || '-'
                  )}
                </td>
                <td onDoubleClick={() => handleCellDoubleClick(device, 'model')}>
                  {editingCell?.deviceId === device.id && editingCell?.field === 'model' ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleCellBlur}
                      onKeyDown={handleCellKeyDown}
                      autoFocus
                      style={{ width: '100%', padding: '4px', border: '1px solid #3498db' }}
                    />
                  ) : (
                    device.model || '-'
                  )}
                </td>
                <td>
                  {device.user ? (
                    <span>
                      {device.user.firstName} {device.user.lastName}
                    </span>
                  ) : (
                    <span style={{ color: '#999' }}>Nicht zugewiesen</span>
                  )}
                </td>
                <td>
                  {device.warrantyUntil ? (
                    <span style={{
                      color: new Date(device.warrantyUntil) < new Date() ? '#e74c3c' : '#27ae60'
                    }}>
                      {new Date(device.warrantyUntil).toLocaleDateString('de-CH')}
                    </span>
                  ) : '-'}
                </td>
                <td>
                  <span className={`status-badge ${device.isActive ? 'status-active' : 'status-inactive'}`}>
                    {device.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleOpenSoftware(device)}
                      title="Software & Lizenzen"
                      style={{ position: 'relative' }}
                    >
                      💿
                      {(() => {
                        const badge = deviceSoftwareBadge(device);
                        if (badge.count === 0) return null;
                        return (
                          <span
                            style={{
                              position: 'absolute',
                              top: '-6px',
                              right: '-6px',
                              minWidth: '16px',
                              height: '16px',
                              padding: '0 4px',
                              borderRadius: '8px',
                              fontSize: '10px',
                              lineHeight: '16px',
                              fontWeight: 700,
                              color: '#fff',
                              background: badge.worst === 'expired' ? '#e74c3c' : badge.worst === 'soon' ? '#f39c12' : '#3498db'
                            }}
                          >
                            {badge.count}
                          </span>
                        );
                      })()}
                    </button>
                    {(() => {
                      const upd = deviceUpdatesBadge(device);
                      if (upd === 0) return null;
                      return (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleOpenSoftware(device, 'updates')}
                          title={`${upd} fehlende Updates`}
                          style={{ position: 'relative' }}
                        >
                          🩹
                          <span style={{
                            position: 'absolute', top: '-6px', right: '-6px', minWidth: '16px', height: '16px',
                            padding: '0 4px', borderRadius: '8px', fontSize: '10px', lineHeight: '16px',
                            fontWeight: 700, color: '#fff', background: '#e67e22'
                          }}>{upd}</span>
                        </button>
                      );
                    })()}
                    {(() => {
                      const vuln = deviceVulnsBadge(device);
                      if (vuln.count === 0) return null;
                      return (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleOpenSoftware(device, 'vulnerabilities')}
                          title={`${vuln.count} Schwachstellen (CVEs)`}
                          style={{ position: 'relative' }}
                        >
                          🛡️
                          <span style={{
                            position: 'absolute', top: '-6px', right: '-6px', minWidth: '16px', height: '16px',
                            padding: '0 4px', borderRadius: '8px', fontSize: '10px', lineHeight: '16px',
                            fontWeight: 700, color: '#fff', background: scoreColor(vuln.worst)
                          }}>{vuln.count}</span>
                        </button>
                      );
                    })()}
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleOpenModal(device)}
                      title="Bearbeiten"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => handleDuplicate(device)}
                      title="Duplizieren"
                    >
                      📋
                    </button>
                    {device.userId ? (
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleReturn(device.id)}
                        title="Zurückgeben"
                      >
                        ↩️
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleAssign(device)}
                        title="Zuweisen"
                      >
                        👤
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(device.id)}
                      title="Löschen"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%', padding: '0' }}>
            <div className="modal-header">
              <h3>{editingDevice ? 'Gerät bearbeiten' : 'Neues Gerät'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '30px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
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
                  <label>Kategorie</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Bitte wählen</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Seriennummer</label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Hersteller</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Modell</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Besitzer</label>
                  <select
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  >
                    <option value="">Nicht zugewiesen</option>
                    {users.filter(u => u.isActive).map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Kaufdatum</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Garantie bis</label>
                  <input
                    type="date"
                    value={formData.warrantyUntil}
                    onChange={(e) => setFormData({ ...formData, warrantyUntil: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Notizen</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Abbrechen
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDevice ? 'Aktualisieren' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAssignModalOpen && assigningDevice && (
        <div className="modal-overlay" onClick={handleCancelAssign}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%', padding: '0' }}>
            <div className="modal-header">
              <h3>Gerät zuweisen</h3>
              <button className="modal-close" onClick={handleCancelAssign}>×</button>
            </div>

            <div style={{ padding: '30px' }}>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ marginBottom: '10px' }}>
                  <strong>Gerät:</strong> {assigningDevice.name}
                  {assigningDevice.serialNumber && ` (SN: ${assigningDevice.serialNumber})`}
                </p>
                {assigningDevice.category && (
                  <p style={{ marginBottom: '10px', color: '#666' }}>
                    <strong>Kategorie:</strong> {assigningDevice.category}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>Benutzer auswählen *</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                  autoFocus
                >
                  <option value="">Bitte wählen...</option>
                  {users
                    .filter(u => u.isActive)
                    .sort((a, b) => {
                      const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
                      const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
                      return nameA.localeCompare(nameB);
                    })
                    .map(user => (
                      <option key={user.id} value={user.id}>
                        {user.lastName} {user.firstName} ({user.email})
                      </option>
                    ))}
                </select>
              </div>

              <div className="modal-actions" style={{ marginTop: '30px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCancelAssign}>
                  Abbrechen
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmAssign}
                  disabled={!selectedUserId}
                >
                  Zuweisen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {softwareModalDevice && (
        <div className="modal-overlay" onClick={handleCloseSoftware}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '95%', padding: '0' }}>
            <div className="modal-header">
              <h3>🖥️ Assetkatalog – {softwareModalDevice.name}</h3>
              <button className="modal-close" onClick={handleCloseSoftware}>×</button>
            </div>

            <div style={{ display: 'flex', gap: '4px', padding: '0 24px', borderBottom: '1px solid var(--border-color, #dee2e6)' }}>
              {([
                { key: 'software', label: `💿 Software (${softwareModalDevice.software?.length ?? 0})` },
                { key: 'updates', label: `🩹 Updates (${softwareModalDevice.updates?.length ?? 0})` },
                { key: 'vulnerabilities', label: `🛡️ CVEs (${softwareModalDevice.vulnerabilities?.length ?? 0})` }
              ] as const).map(t => (
                <button
                  key={t.key}
                  onClick={() => handleSelectAssetTab(t.key)}
                  style={{
                    padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px',
                    borderBottom: assetTab === t.key ? '2px solid #3498db' : '2px solid transparent',
                    fontWeight: assetTab === t.key ? 700 : 400,
                    color: assetTab === t.key ? '#3498db' : 'var(--text-primary, #333)'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ padding: '24px' }}>
              {assetTab === 'software' && (
              <>
              {!showSoftwareForm && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ color: '#666', fontSize: '14px' }}>
                    {softwareLoading ? 'Lädt…' : `${softwareList.length} Eintrag/Einträge`}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleAction1SyncDevice(softwareModalDevice)}
                      disabled={action1Syncing}
                      title="Installierte Software dieses Geräts aus Action1 synchronisieren"
                    >
                      {action1Syncing ? '⏳ Sync…' : '🔄 Action1-Sync'}
                    </button>
                    <button className="btn btn-sm btn-primary" onClick={handleNewSoftware}>
                      + Eintrag hinzufügen
                    </button>
                  </div>
                </div>
              )}

              {showSoftwareForm ? (
                <form onSubmit={handleSubmitSoftware}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group">
                      <label>Name *</label>
                      <input
                        type="text"
                        value={softwareForm.name}
                        onChange={(e) => setSoftwareForm({ ...softwareForm, name: e.target.value })}
                        required
                        autoFocus
                      />
                    </div>
                    <div className="form-group">
                      <label>Typ</label>
                      <select
                        value={softwareForm.type}
                        onChange={(e) => setSoftwareForm({ ...softwareForm, type: e.target.value })}
                      >
                        <option value="">Bitte wählen</option>
                        {softwareTypes.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Hersteller / Anbieter</label>
                      <input
                        type="text"
                        value={softwareForm.vendor}
                        onChange={(e) => setSoftwareForm({ ...softwareForm, vendor: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Version</label>
                      <input
                        type="text"
                        value={softwareForm.version}
                        onChange={(e) => setSoftwareForm({ ...softwareForm, version: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Lizenzschlüssel</label>
                      <input
                        type="text"
                        value={softwareForm.licenseKey}
                        onChange={(e) => setSoftwareForm({ ...softwareForm, licenseKey: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Lizenztyp</label>
                      <input
                        type="text"
                        placeholder="z.B. Einzelplatz, Volumen, OEM, Abo"
                        value={softwareForm.licenseType}
                        onChange={(e) => setSoftwareForm({ ...softwareForm, licenseType: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Anzahl Plätze (Seats)</label>
                      <input
                        type="number"
                        min="0"
                        value={softwareForm.seats}
                        onChange={(e) => setSoftwareForm({ ...softwareForm, seats: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Kosten (CHF)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={softwareForm.cost}
                        onChange={(e) => setSoftwareForm({ ...softwareForm, cost: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Kaufdatum</label>
                      <input
                        type="date"
                        value={softwareForm.purchaseDate}
                        onChange={(e) => setSoftwareForm({ ...softwareForm, purchaseDate: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Ablauf / Gültig bis</label>
                      <input
                        type="date"
                        value={softwareForm.expiryDate}
                        onChange={(e) => setSoftwareForm({ ...softwareForm, expiryDate: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Notizen</label>
                      <textarea
                        value={softwareForm.notes}
                        onChange={(e) => setSoftwareForm({ ...softwareForm, notes: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => { setShowSoftwareForm(false); setEditingSoftware(null); }}
                    >
                      Abbrechen
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingSoftware ? 'Aktualisieren' : 'Hinzufügen'}
                    </button>
                  </div>
                </form>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Quelle</th>
                      <th>Typ</th>
                      <th>Hersteller</th>
                      <th>Version</th>
                      <th>Lizenzschlüssel</th>
                      <th>Plätze</th>
                      <th>Gültig bis</th>
                      <th>Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {softwareList.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '1.5rem', color: '#999' }}>
                          {softwareLoading ? 'Lädt…' : 'Keine Software oder Lizenzen erfasst'}
                        </td>
                      </tr>
                    ) : (
                      softwareList.map(sw => {
                        const status = getExpiryStatus(sw.expiryDate);
                        return (
                          <tr key={sw.id}>
                            <td><strong>{sw.name}</strong></td>
                            <td>
                              {sw.source === 'action1' ? (
                                <span
                                  title={sw.lastSyncedAt ? `Zuletzt synchronisiert: ${new Date(sw.lastSyncedAt).toLocaleString('de-CH')}` : 'Aus Action1 synchronisiert'}
                                  style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: '#e8f4fd', color: '#2980b9', whiteSpace: 'nowrap' }}
                                >
                                  🔄 Action1
                                </span>
                              ) : (
                                <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: '#eee', color: '#666', whiteSpace: 'nowrap' }}>
                                  ✋ manuell
                                </span>
                              )}
                            </td>
                            <td>{sw.type || '-'}</td>
                            <td>{sw.vendor || '-'}</td>
                            <td>{sw.version || '-'}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{sw.licenseKey || '-'}</td>
                            <td>{sw.seats != null ? sw.seats : '-'}</td>
                            <td>
                              {sw.expiryDate ? (
                                <span style={{ color: expiryColor(status), fontWeight: status === 'ok' ? 400 : 600 }}>
                                  {new Date(sw.expiryDate).toLocaleDateString('de-CH')}
                                  {status === 'expired' && ' ⚠'}
                                  {status === 'soon' && ' ⏳'}
                                </span>
                              ) : '-'}
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => handleEditSoftware(sw)}
                                  title="Bearbeiten"
                                >
                                  ✏️
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDeleteSoftware(sw)}
                                  title="Löschen"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
              </>
              )}

              {assetTab === 'updates' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ color: '#666', fontSize: '14px' }}>
                      {updatesLoading ? 'Lädt…' : `${deviceUpdates.length} fehlende Updates`}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {deviceUpdates.length > 0 && (
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => handleDeployUpdates(softwareModalDevice)}
                          disabled={deploying}
                          title="Diese Updates über Action1 auf dem Gerät installieren (kein Auto-Reboot)"
                        >
                          {deploying ? '⏳ Rollout…' : '🚀 Updates ausrollen'}
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleAction1SyncDevice(softwareModalDevice)}
                        disabled={action1Syncing}
                        title="Gerät aus Action1 synchronisieren (Updates werden beim Gesamt-Sync aktualisiert)"
                      >
                        {action1Syncing ? '⏳ Sync…' : '🔄 Action1-Sync'}
                      </button>
                    </div>
                  </div>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Titel</th>
                        <th>KB</th>
                        <th>Schweregrad</th>
                        <th>Kategorie</th>
                        <th>Veröffentlicht</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deviceUpdates.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: '#999' }}>
                            {updatesLoading ? 'Lädt…' : 'Keine fehlenden Updates (oder Update-Sync nicht aktiviert)'}
                          </td>
                        </tr>
                      ) : (
                        deviceUpdates.map(u => (
                          <tr key={u.id}>
                            <td><strong>{u.title}</strong></td>
                            <td>{u.kb || '-'}</td>
                            <td>{u.severity || '-'}</td>
                            <td>{u.category || '-'}</td>
                            <td>{u.releaseDate ? new Date(u.releaseDate).toLocaleDateString('de-CH') : '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </>
              )}

              {assetTab === 'vulnerabilities' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ color: '#666', fontSize: '14px' }}>
                      {vulnsLoading ? 'Lädt…' : `${deviceVulns.length} Schwachstellen`}
                    </span>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleAction1SyncDevice(softwareModalDevice)}
                      disabled={action1Syncing}
                      title="Gerät aus Action1 synchronisieren (CVEs werden beim Gesamt-Sync aktualisiert)"
                    >
                      {action1Syncing ? '⏳ Sync…' : '🔄 Action1-Sync'}
                    </button>
                  </div>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>CVE</th>
                        <th>Bezeichnung</th>
                        <th>Schweregrad</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deviceVulns.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem', color: '#999' }}>
                            {vulnsLoading ? 'Lädt…' : 'Keine Schwachstellen (oder CVE-Sync nicht aktiviert)'}
                          </td>
                        </tr>
                      ) : (
                        deviceVulns.map(v => (
                          <tr key={v.id}>
                            <td>
                              <a
                                href={`https://nvd.nist.gov/vuln/detail/${v.cveId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontFamily: 'monospace' }}
                              >
                                {v.cveId}
                              </a>
                            </td>
                            <td>{v.name || '-'}</td>
                            <td>
                              <span style={{
                                fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                                color: '#fff', background: scoreColor(v.score), whiteSpace: 'nowrap'
                              }}>
                                {scoreLabel(v.score)}
                              </span>
                            </td>
                            <td>{v.remediationStatus || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
