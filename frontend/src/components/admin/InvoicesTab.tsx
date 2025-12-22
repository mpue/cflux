import React, { useState, useEffect } from 'react';
import { Invoice, Customer, Article } from '../../types';
import * as invoiceService from '../../services/invoiceService';
import InvoicePreviewModal from '../InvoicePreviewModal';

interface InvoicesTabProps {
  invoices: Invoice[];
  customers: Customer[];
  articles: Article[];
  onUpdate: () => void;
}

const InvoicesTab: React.FC<InvoicesTabProps> = ({ invoices, customers, articles, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCustomerId, setFilterCustomerId] = useState<string>('');

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !searchTerm || 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filterStatus || invoice.status === filterStatus;
    const matchesCustomer = !filterCustomerId || invoice.customerId === filterCustomerId;
    
    return matchesSearch && matchesStatus && matchesCustomer;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return { bg: '#e3f2fd', color: '#1565c0' };
      case 'SENT': return { bg: '#fff3e0', color: '#e65100' };
      case 'PAID': return { bg: '#d4edda', color: '#155724' };
      case 'OVERDUE': return { bg: '#f8d7da', color: '#721c24' };
      case 'CANCELLED': return { bg: '#f5f5f5', color: '#616161' };
      default: return { bg: '#f5f5f5', color: '#000' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Entwurf';
      case 'SENT': return 'Versendet';
      case 'PAID': return 'Bezahlt';
      case 'OVERDUE': return 'Überfällig';
      case 'CANCELLED': return 'Storniert';
      default: return status;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Rechnungsverwaltung</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingInvoice(null);
            setShowModal(true);
          }}
        >
          Neue Rechnung
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Suche nach Rechnungsnummer, Kunde oder Notizen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <select
          value={filterCustomerId}
          onChange={(e) => setFilterCustomerId(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">Alle Kunden</option>
          {customers.filter(c => c.isActive).map(customer => (
            <option key={customer.id} value={customer.id}>{customer.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">Alle Status</option>
          <option value="DRAFT">Entwurf</option>
          <option value="SENT">Versendet</option>
          <option value="PAID">Bezahlt</option>
          <option value="OVERDUE">Überfällig</option>
          <option value="CANCELLED">Storniert</option>
        </select>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Rechnungsnr.</th>
            <th>Kunde</th>
            <th>Datum</th>
            <th>Fällig</th>
            <th>Betrag</th>
            <th>Status</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filteredInvoices.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                Keine Rechnungen gefunden
              </td>
            </tr>
          ) : (
            filteredInvoices.map((invoice) => {
              const statusStyle = getStatusColor(invoice.status);
              return (
                <tr key={invoice.id}>
                  <td><strong>{invoice.invoiceNumber}</strong></td>
                  <td>{invoice.customer?.name || '-'}</td>
                  <td>{new Date(invoice.invoiceDate).toLocaleDateString('de-CH')}</td>
                  <td>{new Date(invoice.dueDate).toLocaleDateString('de-CH')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <strong>CHF {invoice.totalAmount.toFixed(2)}</strong>
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                      Netto: CHF {invoice.subtotal.toFixed(2)}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.85em',
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color
                    }}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn"
                      style={{ 
                        marginRight: '5px', 
                        padding: '5px 10px', 
                        fontSize: '12px',
                        backgroundColor: '#6366f1',
                        color: 'white',
                        border: 'none'
                      }}
                      onClick={() => {
                        setPreviewInvoice(invoice);
                        setShowPreview(true);
                      }}
                    >
                      👁️ Vorschau
                    </button>
                    <button
                      className="btn"
                      style={{ 
                        marginRight: '5px', 
                        padding: '5px 10px', 
                        fontSize: '12px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none'
                      }}
                      onClick={() => {
                        const API_URL = process.env.REACT_APP_API_URL || '';
                        const token = localStorage.getItem('token');
                        const url = `${API_URL}/api/invoices/${invoice.id}/pdf`;
                        
                        fetch(url, {
                          headers: { Authorization: `Bearer ${token}` }
                        })
                        .then(response => response.blob())
                        .then(blob => {
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `Rechnung_${invoice.invoiceNumber}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(url);
                        })
                        .catch(error => {
                          console.error('Error downloading PDF:', error);
                          alert('Fehler beim Download der PDF');
                        });
                      }}
                    >
                      📄 PDF
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                      onClick={() => {
                        setEditingInvoice(invoice);
                        setShowModal(true);
                      }}
                    >
                      Bearbeiten
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                      onClick={async () => {
                        if (window.confirm('Rechnung wirklich löschen?')) {
                          try {
                            await invoiceService.deleteInvoice(invoice.id);
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
              );
            })
          )}
        </tbody>
      </table>

      {showPreview && previewInvoice && (
        <InvoicePreviewModal
          invoice={previewInvoice}
          onClose={() => {
            setShowPreview(false);
            setPreviewInvoice(null);
          }}
        />
      )}

      {showModal && (
        <InvoiceModal
          invoice={editingInvoice}
          customers={customers}
          articles={articles}
          onClose={() => {
            setShowModal(false);
            setEditingInvoice(null);
          }}
          onSave={async (data) => {
            if (editingInvoice) {
              await invoiceService.updateInvoice(editingInvoice.id, data);
            } else {
              await invoiceService.createInvoice(data);
            }
            setShowModal(false);
            setEditingInvoice(null);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

const InvoiceModal: React.FC<{
  invoice: Invoice | null;
  customers: Customer[];
  articles: Article[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}> = ({ invoice, customers, articles, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    invoiceNumber: invoice?.invoiceNumber || '',
    invoiceDate: invoice?.invoiceDate ? invoice.invoiceDate.split('T')[0] : new Date().toISOString().split('T')[0],
    dueDate: invoice?.dueDate ? invoice.dueDate.split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    customerId: invoice?.customerId || '',
    status: invoice?.status || 'DRAFT',
    notes: invoice?.notes || '',
    items: invoice?.items || [],
    templateId: invoice?.templateId || '',
  });

  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    // Load templates
    const loadTemplates = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/invoice-templates`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        setTemplates(data);
        
        // Set default template if creating new invoice
        if (!invoice && data.length > 0) {
          const defaultTemplate = data.find((t: any) => t.isDefault) || data[0];
          setFormData(prev => ({ ...prev, templateId: defaultTemplate.id }));
        }
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    };
    
    loadTemplates();
    
    // Generate invoice number for new invoices
    if (!invoice) {
      invoiceService.getNextInvoiceNumber().then(num => {
        setFormData(prev => ({ ...prev, invoiceNumber: num }));
      });
    }
  }, [invoice]);

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        id: '',
        invoiceId: '',
        position: prev.items.length + 1,
        description: '',
        quantity: 1,
        unitPrice: 0,
        unit: 'Stück',
        vatRate: 7.7,
        totalPrice: 0,
        createdAt: '',
        updatedAt: '',
      } as any],
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item;
        
        const updated = { ...item, [field]: value };
        
        // If article is selected, populate fields
        if (field === 'articleId' && value) {
          const article = articles.find(a => a.id === value);
          if (article) {
            updated.description = article.name;
            updated.unitPrice = article.price;
            updated.unit = article.unit;
            updated.vatRate = article.vatRate;
          }
        }
        
        // Recalculate total
        updated.totalPrice = updated.quantity * updated.unitPrice;
        
        return updated;
      }),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.invoiceNumber.trim()) {
      alert('Bitte Rechnungsnummer eingeben');
      return;
    }
    if (!formData.customerId) {
      alert('Bitte Kunde auswählen');
      return;
    }
    if (formData.items.length === 0) {
      alert('Bitte mindestens eine Position hinzufügen');
      return;
    }

    setLoading(true);
    try {
      // Clean items data - remove metadata fields that shouldn't be sent
      const cleanedData = {
        ...formData,
        items: formData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unit: item.unit,
          vatRate: item.vatRate,
          totalPrice: item.totalPrice,
          position: item.position,
          articleId: item.articleId || undefined
        }))
      };
      
      await onSave(cleanedData);
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Fehler beim Speichern der Rechnung');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const vatAmount = formData.items.reduce((sum, item) => sum + ((item.quantity * item.unitPrice * item.vatRate) / 100), 0);
  const totalAmount = subtotal + vatAmount;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
        <h2>{invoice ? 'Rechnung bearbeiten' : 'Neue Rechnung'}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div className="form-group">
              <label>Rechnungsnummer *</label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Kunde *</label>
              {invoice ? (
                <input
                  type="text"
                  value={invoice.customer?.name || 'Unbekannt'}
                  disabled
                  style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                />
              ) : (
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  required
                >
                  <option value="">Bitte wählen...</option>
                  {customers && customers.length > 0 ? (
                    customers.filter(c => c.isActive).map(customer => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))
                  ) : (
                    <option value="" disabled>Keine aktiven Kunden verfügbar</option>
                  )}
                </select>
              )}
            </div>

            <div className="form-group">
              <label>Rechnungsdatum *</label>
              <input
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Fälligkeitsdatum *</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="DRAFT">Entwurf</option>
                <option value="SENT">Versendet</option>
                <option value="PAID">Bezahlt</option>
                <option value="OVERDUE">Überfällig</option>
                <option value="CANCELLED">Storniert</option>
              </select>
            </div>

            <div className="form-group">
              <label>Rechnungsvorlage</label>
              <select
                value={formData.templateId}
                onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
              >
                <option value="">Standard</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} {template.isDefault ? '(Standard)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Notizen</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div style={{ marginTop: '20px', marginBottom: '10px' }}>
            <h3 style={{ display: 'inline', marginRight: '15px' }}>Positionen</h3>
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '5px 15px', fontSize: '14px' }}
              onClick={addItem}
            >
              + Position hinzufügen
            </button>
          </div>

          <table className="table" style={{ marginBottom: '20px' }}>
            <thead>
              <tr>
                <th style={{ width: '30px' }}>#</th>
                <th style={{ width: '150px' }}>Artikel</th>
                <th>Beschreibung</th>
                <th style={{ width: '80px' }}>Menge</th>
                <th style={{ width: '100px' }}>Preis</th>
                <th style={{ width: '80px' }}>Einheit</th>
                <th style={{ width: '80px' }}>MwSt %</th>
                <th style={{ width: '100px' }}>Total</th>
                <th style={{ width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {formData.items.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '1rem', color: '#999' }}>
                    Keine Positionen vorhanden
                  </td>
                </tr>
              ) : (
                formData.items.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <select
                        value={item.articleId || ''}
                        onChange={(e) => updateItem(index, 'articleId', e.target.value)}
                        style={{ width: '100%', padding: '5px', fontSize: '12px' }}
                      >
                        <option value="">Manuell</option>
                        {articles && articles.length > 0 ? (
                          articles.filter(a => a.isActive).map(article => (
                            <option key={article.id} value={article.id}>{article.articleNumber}</option>
                          ))
                        ) : (
                          <option value="" disabled>Keine Artikel verfügbar</option>
                        )}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        style={{ width: '100%', padding: '5px', fontSize: '12px' }}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', padding: '5px', fontSize: '12px' }}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', padding: '5px', fontSize: '12px' }}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        style={{ width: '100%', padding: '5px', fontSize: '12px' }}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={item.vatRate}
                        onChange={(e) => updateItem(index, 'vatRate', parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', padding: '5px', fontSize: '12px' }}
                        required
                      />
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '12px' }}>
                      CHF {item.totalPrice.toFixed(2)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                        onClick={() => removeItem(index)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div style={{ textAlign: 'right', marginBottom: '20px', paddingRight: '20px' }}>
            <div style={{ marginBottom: '5px' }}>
              <strong>Zwischensumme:</strong> <span style={{ display: 'inline-block', width: '120px', textAlign: 'right' }}>CHF {subtotal.toFixed(2)}</span>
            </div>
            <div style={{ marginBottom: '5px' }}>
              <strong>MwSt:</strong> <span style={{ display: 'inline-block', width: '120px', textAlign: 'right' }}>CHF {vatAmount.toFixed(2)}</span>
            </div>
            <div style={{ fontSize: '1.2em', marginTop: '10px', paddingTop: '10px', borderTop: '2px solid #333' }}>
              <strong>Gesamtbetrag:</strong> <span style={{ display: 'inline-block', width: '140px', textAlign: 'right' }}>CHF {totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="button-group">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Speichern...' : 'Speichern'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoicesTab;
