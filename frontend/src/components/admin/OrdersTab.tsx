import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import orderService, { Order, OrderStatistics } from '../../services/order.service';
import { Supplier } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface OrdersTabProps {
  suppliers: Supplier[];
  onUpdate: () => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ suppliers, onUpdate }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statistics, setStatistics] = useState<OrderStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showActive, setShowActive] = useState(true);

  useEffect(() => {
    loadData();
  }, [searchTerm, statusFilter, supplierFilter, priorityFilter, showActive]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [ordersData, statsData] = await Promise.all([
        orderService.getOrders({
          search: searchTerm || undefined,
          status: statusFilter || undefined,
          supplierId: supplierFilter || undefined,
          priority: priorityFilter || undefined,
          isActive: showActive,
        }),
        orderService.getStatistics(),
      ]);

      setOrders(ordersData);
      setStatistics(statsData);
    } catch (err: any) {
      console.error('Error loading orders:', err);
      alert(err.response?.data?.error || 'Fehler beim Laden der Bestellungen');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!window.confirm('Möchten Sie diese Bestellung wirklich freigeben?')) {
      return;
    }

    try {
      await orderService.approveOrder(id);
      loadData();
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Fehler beim Freigeben der Bestellung');
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Grund für die Ablehnung:');
    if (reason === null) return;

    try {
      await orderService.rejectOrder(id, reason);
      loadData();
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Fehler beim Ablehnen der Bestellung');
    }
  };

  const handleMarkOrdered = async (id: string) => {
    if (!window.confirm('Bestellung als bestellt markieren?')) {
      return;
    }

    try {
      await orderService.markAsOrdered(id);
      loadData();
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Fehler beim Markieren der Bestellung');
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Möchten Sie diese Bestellung wirklich stornieren?')) {
      return;
    }

    try {
      await orderService.cancelOrder(id);
      loadData();
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Fehler beim Stornieren der Bestellung');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchten Sie diese Bestellung wirklich löschen?')) {
      return;
    }

    try {
      await orderService.deleteOrder(id);
      loadData();
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Fehler beim Löschen der Bestellung');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'status-draft';
      case 'REQUESTED': return 'status-requested';
      case 'APPROVED': return 'status-approved';
      case 'ORDERED': return 'status-ordered';
      case 'PARTIALLY_RECEIVED': return 'status-partial';
      case 'RECEIVED': return 'status-received';
      case 'CANCELLED': return 'status-cancelled';
      case 'REJECTED': return 'status-rejected';
      default: return '';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Entwurf';
      case 'REQUESTED': return 'Angefordert';
      case 'APPROVED': return 'Freigegeben';
      case 'ORDERED': return 'Bestellt';
      case 'PARTIALLY_RECEIVED': return 'Teilweise erhalten';
      case 'RECEIVED': return 'Erhalten';
      case 'CANCELLED': return 'Storniert';
      case 'REJECTED': return 'Abgelehnt';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'Niedrig';
      case 'MEDIUM': return 'Normal';
      case 'HIGH': return 'Hoch';
      case 'URGENT': return 'Dringend';
      default: return priority;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-CH');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>📦 Bestellungen</h2>
          <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '5px' }}>
            Verwaltung von Bestellungen und Wareneingang
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Neue Bestellung
        </button>
      </div>

      {statistics && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px', 
          marginBottom: '20px' 
        }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '8px', 
            padding: '20px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #3b82f6'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Gesamt</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{statistics.totalOrders}</div>
          </div>
          <div style={{ 
            background: 'white', 
            borderRadius: '8px', 
            padding: '20px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #f59e0b'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Angefordert</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{statistics.byStatus.requested}</div>
          </div>
          <div style={{ 
            background: 'white', 
            borderRadius: '8px', 
            padding: '20px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #10b981'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Freigegeben</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{statistics.byStatus.approved}</div>
          </div>
          <div style={{ 
            background: 'white', 
            borderRadius: '8px', 
            padding: '20px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #6366f1'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Bestellt</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{statistics.byStatus.ordered}</div>
          </div>
          <div style={{ 
            background: 'white', 
            borderRadius: '8px', 
            padding: '20px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #8b5cf6'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Gesamtwert</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{formatCurrency(statistics.totalValue)}</div>
          </div>
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px', 
        alignItems: 'center', 
        flexWrap: 'wrap' 
      }}>
        <input
          type="text"
          placeholder="Suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            padding: '8px 12px', 
            border: '1px solid #ddd', 
            borderRadius: '4px',
            minWidth: '200px' 
          }}
        />
        
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
        >
          <option value="">Alle Status</option>
          <option value="DRAFT">Entwurf</option>
          <option value="REQUESTED">Angefordert</option>
          <option value="APPROVED">Freigegeben</option>
          <option value="ORDERED">Bestellt</option>
          <option value="PARTIALLY_RECEIVED">Teilweise erhalten</option>
          <option value="RECEIVED">Erhalten</option>
          <option value="CANCELLED">Storniert</option>
          <option value="REJECTED">Abgelehnt</option>
        </select>

        <select 
          value={supplierFilter} 
          onChange={(e) => setSupplierFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
        >
          <option value="">Alle Lieferanten</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>

        <select 
          value={priorityFilter} 
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
        >
          <option value="">Alle Prioritäten</option>
          <option value="LOW">Niedrig</option>
          <option value="MEDIUM">Normal</option>
          <option value="HIGH">Hoch</option>
          <option value="URGENT">Dringend</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showActive}
            onChange={(e) => setShowActive(e.target.checked)}
          />
          Nur aktive
        </label>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Lade Bestellungen...</div>}

      <table className="table">
        <thead>
          <tr>
            <th>Bestellnummer</th>
            <th>Titel</th>
            <th>Lieferant</th>
            <th>Bestelldatum</th>
            <th>Status</th>
            <th>Priorität</th>
            <th>Betrag</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                {loading ? 'Lade Bestellungen...' : 'Keine Bestellungen gefunden'}
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr 
                key={order.id} 
                onClick={() => navigate(`/orders/${order.id}`)} 
                style={{ cursor: 'pointer' }}
              >
                <td><strong>{order.orderNumber}</strong></td>
                <td>{order.title}</td>
                <td>{order.supplier?.name || '-'}</td>
                <td>{formatDate(order.orderDate)}</td>
                <td>
                  <span 
                    className={`status-badge ${getStatusBadgeClass(order.status)}`}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </td>
                <td>
                  <span 
                    className={`priority-badge priority-${order.priority.toLowerCase()}`}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {getPriorityLabel(order.priority)}
                  </span>
                </td>
                <td><strong>{formatCurrency(order.grandTotal)}</strong></td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {order.status === 'REQUESTED' && user?.role === 'ADMIN' && (
                      <>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleApprove(order.id)}
                          title="Freigeben"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          ✓
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleReject(order.id)}
                          title="Ablehnen"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          ✗
                        </button>
                      </>
                    )}
                    {order.status === 'APPROVED' && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleMarkOrdered(order.id)}
                        title="Als bestellt markieren"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        📦
                      </button>
                    )}
                    {['ORDERED', 'PARTIALLY_RECEIVED'].includes(order.status) && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => navigate(`/orders/${order.id}/delivery`)}
                        title="Wareneingang"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        📥
                      </button>
                    )}
                    {!['RECEIVED', 'CANCELLED'].includes(order.status) && (
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleCancel(order.id)}
                        title="Stornieren"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        🚫
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(order.id)}
                      title="Löschen"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
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

      {showModal && (
        <OrderModal
          suppliers={suppliers}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadData();
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

const OrderModal: React.FC<{
  suppliers: Supplier[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ suppliers, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    priority: 'MEDIUM',
    description: '',
    deliveryAddress: '',
    deliveryContact: '',
    deliveryPhone: '',
    projectId: '',
    costCenter: '',
    notes: '',
    items: [{
      name: '',
      quantity: 1,
      unitPrice: 0,
      unit: 'Stück',
      notes: ''
    }]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Bitte Titel eingeben');
      return;
    }

    if (formData.items.length === 0 || !formData.items[0].name.trim()) {
      alert('Bitte mindestens eine Bestellposition hinzufügen');
      return;
    }

    try {
      await orderService.createOrder(formData as any);
      alert('Bestellung erfolgreich erstellt');
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Erstellen der Bestellung');
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', quantity: 1, unitPrice: 0, unit: 'Stück', notes: '' }]
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
        <h2>Neue Bestellung erstellen</h2>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>
          Oder erstellen Sie die Bestellung <button type="button" className="btn btn-link" onClick={() => { onClose(); navigate('/orders/new'); }} style={{ padding: 0, textDecoration: 'underline' }}>im Detailformular</button>
        </p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div className="form-group">
              <label>Titel *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Lieferant</label>
              <select
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
              >
                <option value="">Bitte wählen...</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Bestelldatum *</label>
              <input
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Gewünschtes Lieferdatum</label>
              <input
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Priorität</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="LOW">Niedrig</option>
                <option value="MEDIUM">Normal</option>
                <option value="HIGH">Hoch</option>
                <option value="URGENT">Dringend</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div style={{ marginTop: '30px', marginBottom: '15px' }}>
            <h3 style={{ display: 'inline', marginRight: '15px' }}>Bestellpositionen *</h3>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={addItem}
            >
              + Position hinzufügen
            </button>
          </div>

          <table className="table" style={{ marginBottom: '20px' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Artikel/Beschreibung *</th>
                <th style={{ width: '100px' }}>Menge</th>
                <th style={{ width: '120px' }}>Preis</th>
                <th style={{ width: '100px' }}>Einheit</th>
                <th style={{ width: '120px' }}>Gesamt</th>
                <th style={{ width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      required
                      style={{ width: '100%', padding: '5px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                      required
                      style={{ width: '100%', padding: '5px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                      required
                      style={{ width: '100%', padding: '5px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      style={{ width: '100%', padding: '5px' }}
                    />
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    {(item.quantity * item.unitPrice).toFixed(2)} CHF
                  </td>
                  <td>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => removeItem(index)}
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} style={{ textAlign: 'right', fontWeight: 'bold' }}>Gesamtsumme:</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.1em' }}>
                  {totalAmount.toFixed(2)} CHF
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="btn btn-primary">
              Bestellung erstellen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
