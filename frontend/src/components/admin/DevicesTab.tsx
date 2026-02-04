import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { Device, deviceService } from '../../services/device.service';
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

  const categories = ['Laptop', 'Handy', 'Tablet', 'Monitor', 'SIM-Karte', 'PSA', 'Werkzeug', 'Sonstiges'];

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      let yPosition = margin;

      // Titel
      doc.setFontSize(18);
      doc.text('Geräteliste', margin, yPosition);
      yPosition += 10;

      // Datum und Filter-Info
      doc.setFontSize(10);
      doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-CH')} ${new Date().toLocaleTimeString('de-CH')}`, margin, yPosition);
      yPosition += 5;
      
      if (searchTerm || categoryFilter || userFilter) {
        doc.text('Filter aktiv:', margin, yPosition);
        yPosition += 5;
        if (searchTerm) {
          doc.text(`  Suche: ${searchTerm}`, margin, yPosition);
          yPosition += 4;
        }
        if (categoryFilter) {
          doc.text(`  Kategorie: ${categoryFilter}`, margin, yPosition);
          yPosition += 4;
        }
        if (userFilter) {
          const user = users.find(u => u.id === userFilter);
          doc.text(`  Benutzer: ${user ? `${user.firstName} ${user.lastName}` : 'Nicht zugewiesen'}`, margin, yPosition);
          yPosition += 4;
        }
      }

      doc.text(`Anzahl Geräte: ${filteredDevices.length}`, margin, yPosition);
      yPosition += 10;

      // Tabellen-Header
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const colWidths = [50, 30, 40, 35, 35];
      const headers = ['Name', 'Kategorie', 'Seriennummer', 'Hersteller', 'Besitzer'];
      let xPos = margin;
      
      headers.forEach((header, i) => {
        doc.text(header, xPos, yPosition);
        xPos += colWidths[i];
      });
      
      yPosition += 2;
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      // Tabellen-Daten
      doc.setFont('helvetica', 'normal');
      filteredDevices.forEach((device) => {
        // Neue Seite wenn nötig
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = margin;
        }

        xPos = margin;
        const rowData = [
          device.name.substring(0, 25),
          device.category || '-',
          device.serialNumber?.substring(0, 20) || '-',
          device.manufacturer?.substring(0, 18) || '-',
          device.user ? `${device.user.firstName} ${device.user.lastName}`.substring(0, 18) : '-'
        ];

        rowData.forEach((data, i) => {
          doc.text(data, xPos, yPosition);
          xPos += colWidths[i];
        });

        yPosition += 6;
      });

      // Fußzeile
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Seite ${i} von ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
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
                    <strong>{device.name}</strong>
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
    </div>
  );
};
