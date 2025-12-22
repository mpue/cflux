import React, { useState } from 'react';
import { Customer } from '../../types';
import * as customerService from '../../services/customerService';

interface CustomersTabProps {
  customers: Customer[];
  onUpdate: () => void;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({ customers, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !searchTerm || 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActive = showInactive || customer.isActive;
    
    return matchesSearch && matchesActive;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Kundenverwaltung</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingCustomer(null);
            setShowModal(true);
          }}
        >
          Neuer Kunde
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
            <th>Projekte</th>
            <th>Status</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filteredCustomers.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                Keine Kunden gefunden
              </td>
            </tr>
          ) : (
            filteredCustomers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  <strong>{customer.name}</strong>
                  {customer.taxId && (
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                      UID: {customer.taxId}
                    </div>
                  )}
                </td>
                <td>{customer.contactPerson || '-'}</td>
                <td>
                  {customer.email && <div style={{ fontSize: '0.9em' }}>{customer.email}</div>}
                  {customer.phone && <div style={{ fontSize: '0.9em', color: '#666' }}>{customer.phone}</div>}
                  {!customer.email && !customer.phone && '-'}
                </td>
                <td>
                  {customer.city && customer.zipCode ? (
                    <div>
                      {customer.zipCode} {customer.city}
                      {customer.country && customer.country !== 'Schweiz' && (
                        <div style={{ fontSize: '0.85em', color: '#666' }}>
                          {customer.country}
                        </div>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  {customer.projects && customer.projects.length > 0 ? (
                    <span>{customer.projects.length} Projekt{customer.projects.length !== 1 ? 'e' : ''}</span>
                  ) : (
                    <span style={{ color: '#999' }}>0 Projekte</span>
                  )}
                </td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.85em',
                    backgroundColor: customer.isActive ? '#d4edda' : '#f8d7da',
                    color: customer.isActive ? '#155724' : '#721c24'
                  }}>
                    {customer.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-primary"
                    style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                    onClick={() => {
                      setEditingCustomer(customer);
                      setShowModal(true);
                    }}
                  >
                    Bearbeiten
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                    onClick={async () => {
                      if (window.confirm('Kunde wirklich löschen?')) {
                        try {
                          await customerService.deleteCustomer(customer.id);
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
        <CustomerModal
          customer={editingCustomer}
          onClose={() => {
            setShowModal(false);
            setEditingCustomer(null);
          }}
          onSave={async (data) => {
            if (editingCustomer) {
              await customerService.updateCustomer(editingCustomer.id, data);
            } else {
              await customerService.createCustomer(data);
            }
            setShowModal(false);
            setEditingCustomer(null);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

const CustomerModal: React.FC<{
  customer: Customer | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}> = ({ customer, onClose, onSave }) => {
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
    isActive: customer?.isActive ?? true,
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
        <h2>{customer ? 'Kunde bearbeiten' : 'Neuer Kunde'}</h2>
        <form onSubmit={handleSubmit}>
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
    </div>
  );
};
