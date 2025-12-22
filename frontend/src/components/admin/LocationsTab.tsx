import React, { useState } from 'react';
import { Location } from '../../types';
import { locationService } from '../../services/location.service';

interface LocationsTabProps {
  locations: Location[];
  onUpdate: () => void;
}

export const LocationsTab: React.FC<LocationsTabProps> = ({ locations, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Standortverwaltung</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingLocation(null);
            setShowModal(true);
          }}
        >
          Neuer Standort
        </button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Adresse</th>
            <th>Beschreibung</th>
            <th>Status</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((location) => (
            <tr key={location.id}>
              <td>{location.name}</td>
              <td>{location.address || '-'}</td>
              <td>{location.description || '-'}</td>
              <td>{location.isActive ? 'Aktiv' : 'Inaktiv'}</td>
              <td>
                <button
                  className="btn btn-primary"
                  style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                  onClick={() => {
                    setEditingLocation(location);
                    setShowModal(true);
                  }}
                >
                  Bearbeiten
                </button>
                <button
                  className="btn btn-danger"
                  style={{ padding: '5px 10px', fontSize: '12px' }}
                  onClick={async () => {
                    if (window.confirm('Standort wirklich löschen?')) {
                      try {
                        await locationService.deleteLocation(location.id);
                        onUpdate();
                      } catch (error: any) {
                        alert(error.response?.data?.error || 'Fehler beim Löschen');
                      }
                    }
                  }}
                >
                  Löschen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <LocationModal
          location={editingLocation}
          onClose={() => {
            setShowModal(false);
            setEditingLocation(null);
          }}
          onSave={async (data) => {
            if (editingLocation) {
              await locationService.updateLocation(editingLocation.id, data);
            } else {
              await locationService.createLocation(data);
            }
            setShowModal(false);
            setEditingLocation(null);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

const LocationModal: React.FC<{
  location: Location | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}> = ({ location, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: location?.name || '',
    address: location?.address || '',
    description: location?.description || '',
    isActive: location?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{location ? 'Standort bearbeiten' : 'Neuer Standort'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Adresse</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                style={{ width: 'auto', marginRight: '10px' }}
              />
              Aktiv
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="btn btn-primary">
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
