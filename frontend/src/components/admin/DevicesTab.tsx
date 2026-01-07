import React, { useState, useEffect } from 'react';
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

  const categories = ['Laptop', 'Handy', 'Tablet', 'Monitor', 'PSA', 'Werkzeug', 'Sonstiges'];

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

  const handleAssign = async (deviceId: string) => {
    const userId = prompt('Benutzer-ID für Zuweisung:');
    if (!userId) return;

    try {
      await deviceService.assignDevice(deviceId, userId);
      onUpdate();
    } catch (error) {
      console.error('Error assigning device:', error);
      alert('Fehler beim Zuweisen des Geräts');
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
        <button
          className="btn btn-primary"
          onClick={() => handleOpenModal()}
        >
          Neues Gerät
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Suche nach Name, Seriennummer, Hersteller oder Modell..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '300px' }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">Alle Kategorien</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">Alle Benutzer</option>
          <option value="">Nicht zugewiesen</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName}
            </option>
          ))}
        </select>
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
                <td><strong>{device.name}</strong></td>
                <td>{device.category || '-'}</td>
                <td>{device.serialNumber || '-'}</td>
                <td>{device.manufacturer || '-'}</td>
                <td>{device.model || '-'}</td>
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
                        onClick={() => handleAssign(device.id)}
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
    </div>
  );
};
