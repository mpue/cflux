import React, { useState } from 'react';
import { Supplier } from '../../types';
import * as supplierService from '../../services/supplierService';
import { BaseModal } from '../common/BaseModal';

interface SuppliersTabProps {
  suppliers: Supplier[];
  onUpdate: () => void;
}

export const SuppliersTab: React.FC<SuppliersTabProps> = ({ suppliers, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = !searchTerm || 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActive = showInactive || supplier.isActive;
    
    return matchesSearch && matchesActive;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Lieferantenverwaltung</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingSupplier(null);
            setShowModal(true);
          }}
        >
          Neuer Lieferant
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Suche nach Name, Ansprechpartner, E-Mail oder Ort..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            style={{ width: 'auto', marginRight: '5px' }}
          />
          Inaktive anzeigen
        </label>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Ansprechpartner</th>
            <th>Kontakt</th>
            <th>Ort</th>
            <th>Status</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filteredSuppliers.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                Keine Lieferanten gefunden
              </td>
            </tr>
          ) : (
            filteredSuppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td>
                  <strong>{supplier.name}</strong>
                  {supplier.taxId && (
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                      UID: {supplier.taxId}
                    </div>
                  )}
                </td>
                <td>{supplier.contactPerson || '-'}</td>
                <td>
                  {supplier.email && <div style={{ fontSize: '0.9em' }}>{supplier.email}</div>}
                  {supplier.phone && <div style={{ fontSize: '0.9em', color: '#666' }}>{supplier.phone}</div>}
                  {!supplier.email && !supplier.phone && '-'}
                </td>
                <td>
                  {supplier.city && supplier.zipCode ? (
                    <div>
                      {supplier.zipCode} {supplier.city}
                      {supplier.country && supplier.country !== 'Schweiz' && (
                        <div style={{ fontSize: '0.85em', color: '#666' }}>
                          {supplier.country}
                        </div>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.85em',
                    backgroundColor: supplier.isActive ? '#d4edda' : '#f8d7da',
                    color: supplier.isActive ? '#155724' : '#721c24'
                  }}>
                    {supplier.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-primary"
                    style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                    onClick={() => {
                      setEditingSupplier(supplier);
                      setShowModal(true);
                    }}
                  >
                    Bearbeiten
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                    onClick={async () => {
                      if (window.confirm('Lieferant wirklich löschen?')) {
                        try {
                          await supplierService.deleteSupplier(supplier.id);
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
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <SupplierModal
          supplier={editingSupplier}
          onClose={() => {
            setShowModal(false);
            setEditingSupplier(null);
          }}
          onSave={async (data) => {
            if (editingSupplier) {
              await supplierService.updateSupplier(editingSupplier.id, data);
            } else {
              await supplierService.createSupplier(data);
            }
            setShowModal(false);
            setEditingSupplier(null);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

const SupplierModal: React.FC<{
  supplier: Supplier | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}> = ({ supplier, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    contactPerson: supplier?.contactPerson || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
    zipCode: supplier?.zipCode || '',
    city: supplier?.city || '',
    country: supplier?.country || 'Schweiz',
    taxId: supplier?.taxId || '',
    notes: supplier?.notes || '',
    isActive: supplier?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Bitte Lieferantenname eingeben');
      return;
    }
    await onSave(formData);
  };

  return (
    <BaseModal isOpen={true} onClose={onClose} maxWidth="600px">
      <h2>{supplier ? 'Lieferant bearbeiten' : 'Neuer Lieferant'}</h2>
      <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Lieferantenname *</label>
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

          <div className="form-group">
            <label>Straße</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
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
          </div>

          <div className="form-group">
            <label>Land</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Steuernummer / UID</label>
            <input
              type="text"
              value={formData.taxId}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Notizen</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
    </BaseModal>
  );
};
