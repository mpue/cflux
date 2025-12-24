import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { getAllCustomers, createCustomer, updateCustomer, deleteCustomer } from '../services/customerService';
import { CustomerModal } from '../components/CustomerModal';
import '../App.css';

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();

  useEffect(() => {
    document.title = 'CFlux - Kunden';
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [showInactive]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await getAllCustomers(undefined, showInactive ? undefined : true);
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      alert('Fehler beim Laden der Kunden');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadCustomers();
      return;
    }
    
    setLoading(true);
    try {
      const data = await getAllCustomers(searchTerm, showInactive ? undefined : true);
      setCustomers(data);
    } catch (error) {
      console.error('Error searching customers:', error);
      alert('Fehler bei der Suche');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomer = async (data: Partial<Customer>) => {
    try {
      if (selectedCustomer) {
        await updateCustomer(selectedCustomer.id, data);
      } else {
        await createCustomer(data);
      }
      setShowModal(false);
      setSelectedCustomer(undefined);
      loadCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Fehler beim Speichern des Kunden');
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!window.confirm('Möchten Sie diesen Kunden wirklich löschen?')) {
      return;
    }

    try {
      await deleteCustomer(id);
      loadCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Fehler beim Löschen des Kunden');
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const handleNewCustomer = () => {
    setSelectedCustomer(undefined);
    setShowModal(true);
  };

  const filteredCustomers = customers;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Kunden</h1>
      </div>

      <div className="tab-content">
        <div className="section-header">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Suche nach Name, Ansprechpartner, E-Mail oder Ort..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="button primary" onClick={handleSearch}>
              Suchen
            </button>
            <button className="button secondary" onClick={() => { setSearchTerm(''); loadCustomers(); }}>
              Zurücksetzen
            </button>
            <label style={{ marginLeft: '1rem' }}>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              {' '}Inaktive anzeigen
            </label>
          </div>
          <button className="button primary" onClick={handleNewCustomer}>
            + Neuer Kunde
          </button>
        </div>

        {loading ? (
          <div className="loading">Laden...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
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
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
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
                        {customer.email && <div>{customer.email}</div>}
                        {customer.phone && <div>{customer.phone}</div>}
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
                          <div>
                            {customer.projects.length} Projekt{customer.projects.length !== 1 ? 'e' : ''}
                          </div>
                        ) : (
                          '0 Projekte'
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${customer.isActive ? 'active' : 'inactive'}`}>
                          {customer.isActive ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="button small"
                            onClick={() => handleEditCustomer(customer)}
                          >
                            Bearbeiten
                          </button>
                          <button
                            className="button small danger"
                            onClick={() => handleDeleteCustomer(customer.id)}
                          >
                            Löschen
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <CustomerModal
          customer={selectedCustomer}
          onClose={() => {
            setShowModal(false);
            setSelectedCustomer(undefined);
          }}
          onSave={handleSaveCustomer}
        />
      )}
    </div>
  );
};

export default CustomersPage;
