import React, { useState, useEffect } from 'react';
import { Location } from '../../types';
import { locationService } from '../../services/location.service';
import { systemSettingsService } from '../../services/systemSettings.service';
import { BaseModal } from '../common/BaseModal';

interface LocationsTabProps {
  locations: Location[];
  onUpdate: () => void;
}

export const LocationsTab: React.FC<LocationsTabProps> = ({ locations, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>('');

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const settings = await systemSettingsService.getSettings();
      setGoogleMapsApiKey(settings.googleMapsApiKey || '');
    } catch (error) {
      console.error('Fehler beim Laden des API Keys:', error);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Standortverwaltung</h2>
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

      {!googleMapsApiKey && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px',
          color: '#856404',
        }}>
          💡 Tipp: Hinterlegen Sie einen Google Maps API Key unter <strong>Einstellungen → Karten</strong>, um Kartenausschnitte in den Standort-Karten anzuzeigen.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
        {locations.map((location) => (
          <div
            key={location.id}
            className="card"
            style={{
              borderTop: `4px solid ${location.isActive ? '#4CAF50' : '#dc3545'}`,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Google Maps Embed */}
            {googleMapsApiKey && location.address && (
              <div style={{ margin: '-20px -20px 16px -20px', height: '180px', overflow: 'hidden' }}>
                <iframe
                  title={`Karte: ${location.name}`}
                  width="100%"
                  height="180"
                  style={{ border: 'none', display: 'block' }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${encodeURIComponent(location.address)}&zoom=15`}
                />
              </div>
            )}

            {/* Card Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0' }}>📍 {location.name}</h3>
                {location.address && (
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {location.address}
                  </p>
                )}
                {location.description && (
                  <p style={{ margin: '0', fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    {location.description}
                  </p>
                )}
              </div>
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                backgroundColor: location.isActive ? '#d4edda' : '#f8d7da',
                color: location.isActive ? '#155724' : '#721c24',
                flexShrink: 0,
              }}>
                {location.isActive ? 'Aktiv' : 'Inaktiv'}
              </span>
            </div>

            {/* Actions */}
            <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-small"
                onClick={() => {
                  setEditingLocation(location);
                  setShowModal(true);
                }}
              >
                Bearbeiten
              </button>
              <button
                className="btn btn-small btn-danger"
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
            </div>
          </div>
        ))}
      </div>

      {locations.length === 0 && (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: '48px', marginBottom: '10px' }}>📍</p>
          <p>Keine Standorte vorhanden</p>
        </div>
      )}

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
    <BaseModal isOpen={true} onClose={onClose}>
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
      </BaseModal>
  );
};
