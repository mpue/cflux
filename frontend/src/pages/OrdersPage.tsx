import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import orderService, { Order, OrderStatistics } from '../services/order.service';
import { getAllSuppliers } from '../services/supplierService';
import { Supplier } from '../types';
import { useAuth } from '../contexts/AuthContext';
import './OrdersPage.css';

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [statistics, setStatistics] = useState<OrderStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
      setError(null);
      
      const [ordersData, suppliersData, statsData] = await Promise.all([
        orderService.getOrders({
          search: searchTerm || undefined,
          status: statusFilter || undefined,
          supplierId: supplierFilter || undefined,
          priority: priorityFilter || undefined,
          isActive: showActive,
        }),
        getAllSuppliers(undefined, true),
        orderService.getStatistics(),
      ]);

      setOrders(ordersData);
      setSuppliers(suppliersData);
      setStatistics(statsData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden der Bestellungen');
      console.error('Error loading orders:', err);
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

  if (loading && orders.length === 0) {
    return (
      <div className="orders-page">
        <div className="loading">Lade Bestellungen...</div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div>
          <h1>Bestellungen</h1>
          <p className="subtitle">Verwaltung von Bestellungen und Wareneingang</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/orders/new')}>
          + Neue Bestellung
        </button>
      </div>

      {statistics && (
        <div className="statistics-grid">
          <div className="stat-card">
            <div className="stat-label">Gesamt</div>
            <div className="stat-value">{statistics.totalOrders}</div>
          </div>
          <div className="stat-card status-requested">
            <div className="stat-label">Angefordert</div>
            <div className="stat-value">{statistics.byStatus.requested}</div>
          </div>
          <div className="stat-card status-approved">
            <div className="stat-label">Freigegeben</div>
            <div className="stat-value">{statistics.byStatus.approved}</div>
          </div>
          <div className="stat-card status-ordered">
            <div className="stat-label">Bestellt</div>
            <div className="stat-value">{statistics.byStatus.ordered}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Gesamtwert</div>
            <div className="stat-value">{formatCurrency(statistics.totalValue)}</div>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="filters">
        <input
          type="text"
          placeholder="Suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
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

        <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
          <option value="">Alle Lieferanten</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>

        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">Alle Prioritäten</option>
          <option value="LOW">Niedrig</option>
          <option value="MEDIUM">Normal</option>
          <option value="HIGH">Hoch</option>
          <option value="URGENT">Dringend</option>
        </select>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showActive}
            onChange={(e) => setShowActive(e.target.checked)}
          />
          Nur aktive
        </label>
      </div>

      <div className="orders-table-container">
        <table className="orders-table">
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
                <td colSpan={8} className="no-data">
                  Keine Bestellungen gefunden
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} onClick={() => navigate(`/orders/${order.id}`)} className="clickable-row">
                  <td>
                    <strong>{order.orderNumber}</strong>
                  </td>
                  <td>{order.title}</td>
                  <td>{order.supplier?.name || '-'}</td>
                  <td>{formatDate(order.orderDate)}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-badge priority-${order.priority.toLowerCase()}`}>
                      {getPriorityLabel(order.priority)}
                    </span>
                  </td>
                  <td>{formatCurrency(order.grandTotal)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="action-buttons">
                      {order.status === 'REQUESTED' && user?.role === 'ADMIN' && (
                        <>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleApprove(order.id)}
                            title="Freigeben"
                          >
                            ✓
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleReject(order.id)}
                            title="Ablehnen"
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
                        >
                          📦
                        </button>
                      )}
                      {['ORDERED', 'PARTIALLY_RECEIVED'].includes(order.status) && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => navigate(`/orders/${order.id}/delivery`)}
                          title="Wareneingang"
                        >
                          📥
                        </button>
                      )}
                      {!['RECEIVED', 'CANCELLED'].includes(order.status) && (
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => handleCancel(order.id)}
                          title="Stornieren"
                        >
                          🚫
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(order.id)}
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
      </div>
    </div>
  );
};

export default OrdersPage;
