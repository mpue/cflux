import React, { useState } from 'react';
import { TravelExpense, TravelExpenseType, travelExpenseService } from '../services/travelExpense.service';

interface TravelExpensesPageProps {
  expenses: TravelExpense[];
  isAdmin: boolean;
  onUpdate: () => void;
}

export const TravelExpensesPage: React.FC<TravelExpensesPageProps> = ({ expenses, isAdmin, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<TravelExpense | null>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('');
  const [formData, setFormData] = useState({
    type: 'CAR' as TravelExpenseType,
    date: new Date().toISOString().split('T')[0],
    description: '',
    destination: '',
    purpose: '',
    distance: '',
    vehicleType: '',
    amount: '',
    currency: 'CHF',
    notes: ''
  });

  const expenseTypes = [
    { value: 'FLIGHT', label: '✈️ Flug' },
    { value: 'TRAIN', label: '🚆 Zug' },
    { value: 'CAR', label: '🚗 Auto' },
    { value: 'TAXI', label: '🚕 Taxi' },
    { value: 'ACCOMMODATION', label: '🏨 Unterkunft' },
    { value: 'MEALS', label: '🍽️ Verpflegung' },
    { value: 'OTHER', label: '📋 Sonstiges' }
  ];

  const handleOpenModal = (expense?: TravelExpense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        type: expense.type,
        date: expense.date.split('T')[0],
        description: expense.description,
        destination: expense.destination || '',
        purpose: expense.purpose || '',
        distance: expense.distance?.toString() || '',
        vehicleType: expense.vehicleType || '',
        amount: expense.amount.toString(),
        currency: expense.currency,
        notes: expense.notes || ''
      });
    } else {
      setEditingExpense(null);
      setFormData({
        type: 'CAR',
        date: new Date().toISOString().split('T')[0],
        description: '',
        destination: '',
        purpose: '',
        distance: '',
        vehicleType: '',
        amount: '',
        currency: 'CHF',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        ...formData,
        distance: formData.distance ? parseFloat(formData.distance) : undefined,
        amount: parseFloat(formData.amount)
      };

      if (editingExpense) {
        await travelExpenseService.updateTravelExpense(editingExpense.id, data);
      } else {
        await travelExpenseService.createTravelExpense(data);
      }

      handleCloseModal();
      onUpdate();
    } catch (error) {
      console.error('Error saving travel expense:', error);
      alert(error instanceof Error ? error.message : 'Fehler beim Speichern');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchten Sie diese Reisekosten wirklich löschen?')) {
      return;
    }

    try {
      await travelExpenseService.deleteTravelExpense(id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting travel expense:', error);
      alert(error instanceof Error ? error.message : 'Fehler beim Löschen');
    }
  };

  const handleApprove = async (id: string) => {
    if (!window.confirm('Möchten Sie diese Reisekosten genehmigen?')) {
      return;
    }

    try {
      await travelExpenseService.approveTravelExpense(id);
      onUpdate();
    } catch (error) {
      console.error('Error approving travel expense:', error);
      alert(error instanceof Error ? error.message : 'Fehler beim Genehmigen');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Ablehnungsgrund (optional):');
    if (reason === null) return; // User cancelled

    try {
      await travelExpenseService.rejectTravelExpense(id, reason || undefined);
      onUpdate();
    } catch (error) {
      console.error('Error rejecting travel expense:', error);
      alert(error instanceof Error ? error.message : 'Fehler beim Ablehnen');
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesStatus = filterStatus === 'ALL' || expense.status === filterStatus;
    const matchesType = !filterType || expense.type === filterType;
    return matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: { bg: '#fef3c7', color: '#92400e', text: 'Ausstehend' },
      APPROVED: { bg: '#d1fae5', color: '#065f46', text: 'Genehmigt' },
      REJECTED: { bg: '#fee2e2', color: '#991b1b', text: 'Abgelehnt' }
    };
    const style = styles[status as keyof typeof styles] || styles.PENDING;
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '0.85em',
        fontWeight: '500',
        backgroundColor: style.bg,
        color: style.color
      }}>
        {style.text}
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    const found = expenseTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  const totalAmount = filteredExpenses
    .filter(e => e.status === 'APPROVED')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>💰 Reisekosten</h2>
        <button
          className="btn btn-primary"
          onClick={() => handleOpenModal()}
        >
          Neue Reisekosten
        </button>
      </div>

      {isAdmin && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          gap: '30px'
        }}>
          <div>
            <div style={{ fontSize: '0.9em', color: '#666' }}>Genehmigte Kosten</div>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#0369a1' }}>
              {totalAmount.toFixed(2)} CHF
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.9em', color: '#666' }}>Ausstehend</div>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#d97706' }}>
              {expenses.filter(e => e.status === 'PENDING').length}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="ALL">Alle Status</option>
          <option value="PENDING">Ausstehend</option>
          <option value="APPROVED">Genehmigt</option>
          <option value="REJECTED">Abgelehnt</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">Alle Typen</option>
          {expenseTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Datum</th>
            <th>Typ</th>
            <th>Beschreibung</th>
            <th>Ziel</th>
            <th>Betrag</th>
            {isAdmin && <th>Benutzer</th>}
            <th>Status</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filteredExpenses.length === 0 ? (
            <tr>
              <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                Keine Reisekosten gefunden
              </td>
            </tr>
          ) : (
            filteredExpenses.map(expense => (
              <tr key={expense.id}>
                <td>{new Date(expense.date).toLocaleDateString('de-CH')}</td>
                <td>{getTypeLabel(expense.type)}</td>
                <td>
                  <strong>{expense.description}</strong>
                  {expense.distance && (
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                      {expense.distance} km
                    </div>
                  )}
                </td>
                <td>{expense.destination || '-'}</td>
                <td>
                  <strong>{expense.amount.toFixed(2)} {expense.currency}</strong>
                </td>
                {isAdmin && (
                  <td>
                    {expense.user ? `${expense.user.firstName} ${expense.user.lastName}` : '-'}
                  </td>
                )}
                <td>{getStatusBadge(expense.status)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {expense.status === 'PENDING' && (
                      <>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleOpenModal(expense)}
                          title="Bearbeiten"
                        >
                          ✏️
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleApprove(expense.id)}
                              title="Genehmigen"
                            >
                              ✅
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleReject(expense.id)}
                              title="Ablehnen"
                            >
                              ❌
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(expense.id)}
                          title="Löschen"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                    {expense.status !== 'PENDING' && expense.approver && (
                      <div style={{ fontSize: '0.85em', color: '#666' }}>
                        von {expense.approver.firstName} {expense.approver.lastName}
                        {expense.approvedAt && (
                          <div>{new Date(expense.approvedAt).toLocaleDateString('de-CH')}</div>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', width: '90%', padding: '0' }}>
            <div className="modal-header">
              <h3>{editingExpense ? 'Reisekosten bearbeiten' : 'Neue Reisekosten'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '30px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Typ *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as TravelExpenseType })}
                    required
                  >
                    {expenseTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Datum *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Beschreibung *</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    placeholder="z.B. Kundenbesuch, Geschäftsreise, etc."
                  />
                </div>

                <div className="form-group">
                  <label>Ziel</label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="z.B. Zürich, Berlin"
                  />
                </div>

                <div className="form-group">
                  <label>Zweck</label>
                  <input
                    type="text"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="z.B. Meeting, Schulung"
                  />
                </div>

                {formData.type === 'CAR' && (
                  <>
                    <div className="form-group">
                      <label>Kilometer</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.distance}
                        onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                        placeholder="0.0"
                      />
                    </div>

                    <div className="form-group">
                      <label>Fahrzeugtyp</label>
                      <input
                        type="text"
                        value={formData.vehicleType}
                        onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                        placeholder="z.B. PKW, Firmenwagen"
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label>Betrag *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>Währung</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  >
                    <option value="CHF">CHF</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Notizen</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Zusätzliche Informationen..."
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Abbrechen
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingExpense ? 'Aktualisieren' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
