import React, { useState } from 'react';
import { Customer } from '../types';
import { BaseModal } from './common/BaseModal';

interface CustomerModalProps {
  customer?: Customer;
  onClose: () => void;
  onSave: (data: Partial<Customer>) => Promise<void>;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({ customer, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    contactPerson: customer?.contactPerson || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    zipCode: customer?.zipCode || '',
    city: customer?.city || '',
    country: customer?.country || 'Schweiz',
    taxId: customer?.taxId || '',
    notes: customer?.notes || '',
    isActive: customer?.isActive ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Bitte Kundenname eingeben');
      return;
    }
    
    await onSave(formData);
  };

  return (
    <BaseModal isOpen={true} onClose={onClose} maxWidth="700px">
      <div className="modal-header">
        <h2>{customer ? 'Kunde bearbeiten' : 'Neuer Kunde'}</h2>
        <button className="close-button" onClick={onClose}>&times;</button>
      </div>
      
      <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-section">
              <h3>Grunddaten</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Kundenname *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Ansprechpartner</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Kontaktdaten</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>E-Mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Telefon</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Adresse</h3>
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Straße</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>PLZ</label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Ort</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Land</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Weitere Informationen</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Steuernummer / UID</label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Notizen</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    {' '}Aktiv
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="button secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="button primary">
              Speichern
            </button>
          </div>
        </form>
      </BaseModal>
  );
};
