import React, { useState, useEffect } from 'react';
import { TravelExpense, travelExpenseService } from '../../services/travelExpense.service';
import { User } from '../../types';
import { workflowService, WorkflowInstance } from '../../services/workflow.service';

interface TravelExpensesTabProps {
  expenses: TravelExpense[];
  users: User[];
  onUpdate: () => void;
}

export const TravelExpensesTab: React.FC<TravelExpensesTabProps> = ({ expenses, users, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [editingExpense, setEditingExpense] = useState<TravelExpense | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [workflowInstances, setWorkflowInstances] = useState<Record<string, WorkflowInstance[]>>({});
  const [selectedExpenseForWorkflow, setSelectedExpenseForWorkflow] = useState<TravelExpense | null>(null);

  // Load workflow instances for all expenses
  useEffect(() => {
    const loadWorkflowInstances = async () => {
      const instances: Record<string, WorkflowInstance[]> = {};
      
      for (const expense of expenses) {
        try {
          const expenseInstances = await workflowService.getWorkflowInstancesByEntity(expense.id, 'TRAVEL_EXPENSE');
          if (expenseInstances.length > 0) {
            instances[expense.id] = expenseInstances;
          }
        } catch (error) {
          console.error(`Error loading workflow for expense ${expense.id}:`, error);
        }
      }
      
      setWorkflowInstances(instances);
    };

    if (expenses.length > 0) {
      loadWorkflowInstances();
    }
  }, [expenses]);

  const expenseTypes = [
    { value: 'FLIGHT', label: '✈️ Flug' },
    { value: 'TRAIN', label: '🚆 Zug' },
    { value: 'CAR', label: '🚗 Auto' },
    { value: 'TAXI', label: '🚕 Taxi' },
    { value: 'ACCOMMODATION', label: '🏨 Unterkunft' },
    { value: 'MEALS', label: '🍽️ Verpflegung' },
    { value: 'OTHER', label: '📋 Sonstiges' }
  ];

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = !searchTerm ||
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.user?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.user?.lastName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !filterStatus || expense.status === filterStatus;
    const matchesType = !filterType || expense.type === filterType;
    const matchesUser = !filterUserId || expense.userId === filterUserId;

    return matchesSearch && matchesStatus && matchesType && matchesUser;
  });

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
    if (reason === null) return;

    try {
      await travelExpenseService.rejectTravelExpense(id, reason || undefined);
      onUpdate();
    } catch (error) {
      console.error('Error rejecting travel expense:', error);
      alert(error instanceof Error ? error.message : 'Fehler beim Ablehnen');
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

  const totalPending = expenses.filter(e => e.status === 'PENDING').length;
  const totalApproved = expenses.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0);
  const totalPendingAmount = expenses.filter(e => e.status === 'PENDING').reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>💰 Reisekosten-Verwaltung</h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{
          padding: '15px',
          backgroundColor: '#fef3c7',
          borderRadius: '8px',
          border: '1px solid #fbbf24'
        }}>
          <div style={{ fontSize: '0.9em', color: '#92400e', marginBottom: '5px' }}>
            Ausstehende Anträge
          </div>
          <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#92400e' }}>
            {totalPending}
          </div>
          <div style={{ fontSize: '0.85em', color: '#92400e', marginTop: '5px' }}>
            {totalPendingAmount.toFixed(2)} CHF
          </div>
        </div>

        <div style={{
          padding: '15px',
          backgroundColor: '#d1fae5',
          borderRadius: '8px',
          border: '1px solid #10b981'
        }}>
          <div style={{ fontSize: '0.9em', color: '#065f46', marginBottom: '5px' }}>
            Genehmigte Kosten
          </div>
          <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#065f46' }}>
            {totalApproved.toFixed(2)} CHF
          </div>
        </div>

        <div style={{
          padding: '15px',
          backgroundColor: '#e0f2fe',
          borderRadius: '8px',
          border: '1px solid #0ea5e9'
        }}>
          <div style={{ fontSize: '0.9em', color: '#075985', marginBottom: '5px' }}>
            Gesamt Anträge
          </div>
          <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#075985' }}>
            {expenses.length}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Suche nach Beschreibung, Ziel oder Benutzer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '300px' }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">Alle Status</option>
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
        <select
          value={filterUserId}
          onChange={(e) => setFilterUserId(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">Alle Benutzer</option>
          {users.filter(u => u.isActive).map(user => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName}
            </option>
          ))}
        </select>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Datum</th>
            <th>Benutzer</th>
            <th>Typ</th>
            <th>Beschreibung</th>
            <th>Ziel</th>
            <th>Betrag</th>
            <th>Status</th>
            <th>Genehmigt von</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filteredExpenses.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                Keine Reisekosten gefunden
              </td>
            </tr>
          ) : (
            filteredExpenses.map(expense => {
              const instances = workflowInstances[expense.id] || [];
              const hasWorkflow = instances.length > 0;
              const latestInstance = instances[0];
              
              return (
              <tr key={expense.id}>
                <td>
                  {new Date(expense.date).toLocaleDateString('de-CH')}
                  <div style={{ fontSize: '0.85em', color: '#666' }}>
                    {new Date(expense.createdAt).toLocaleDateString('de-CH')}
                  </div>
                </td>
                <td>
                  <strong>
                    {expense.user ? `${expense.user.firstName} ${expense.user.lastName}` : '-'}
                  </strong>
                  {expense.user?.email && (
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                      {expense.user.email}
                    </div>
                  )}
                </td>
                <td>{getTypeLabel(expense.type)}</td>
                <td>
                  <strong>{expense.description}</strong>
                  {expense.distance && (
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                      {expense.distance} km
                    </div>
                  )}
                  {expense.purpose && (
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                      {expense.purpose}
                    </div>
                  )}
                </td>
                <td>{expense.destination || '-'}</td>
                <td>
                  <strong style={{ fontSize: '1.1em' }}>
                    {expense.amount.toFixed(2)} {expense.currency}
                  </strong>
                </td>
                <td>
                  {getStatusBadge(expense.status)}
                  {hasWorkflow && latestInstance && (
                    <div style={{ marginTop: '5px' }}>
                      <span style={{
                        fontSize: '0.75em',
                        padding: '2px 8px',
                        borderRadius: '8px',
                        backgroundColor: latestInstance.status === 'COMPLETED' ? '#d1fae5' : 
                                       latestInstance.status === 'REJECTED' ? '#fee2e2' : '#e0e7ff',
                        color: latestInstance.status === 'COMPLETED' ? '#065f46' : 
                               latestInstance.status === 'REJECTED' ? '#991b1b' : '#3730a3'
                      }}>
                        🔄 Workflow: {latestInstance.workflow?.name || 'Workflow'}
                      </span>
                    </div>
                  )}
                </td>
                <td>
                  {expense.approver ? (
                    <div>
                      <div>{expense.approver.firstName} {expense.approver.lastName}</div>
                      {expense.approvedAt && (
                        <div style={{ fontSize: '0.85em', color: '#666' }}>
                          {new Date(expense.approvedAt).toLocaleDateString('de-CH')}
                        </div>
                      )}
                      {expense.rejectionReason && (
                        <div style={{
                          fontSize: '0.85em',
                          color: '#991b1b',
                          marginTop: '5px',
                          padding: '5px',
                          backgroundColor: '#fee2e2',
                          borderRadius: '4px'
                        }}>
                          {expense.rejectionReason}
                        </div>
                      )}
                    </div>
                  ) : '-'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {hasWorkflow && latestInstance ? (
                      <>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => setSelectedExpenseForWorkflow(expense)}
                          title="Workflow anzeigen"
                        >
                          🔄 Workflow
                        </button>
                      </>
                    ) : expense.status === 'PENDING' ? (
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
                    ) : null}
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(expense.id)}
                      title="Löschen"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Workflow Modal */}
      {selectedExpenseForWorkflow && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog" style={{ maxWidth: '800px' }}>
            <div className="modal-content">
              <div className="modal-header">
                <h3>Workflow: {selectedExpenseForWorkflow.description}</h3>
                <button className="close" onClick={() => setSelectedExpenseForWorkflow(null)}>×</button>
              </div>
              <div className="modal-body">
                {workflowInstances[selectedExpenseForWorkflow.id]?.map(instance => (
                  <div key={instance.id} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <h4>{instance.workflow?.name}</h4>
                    <p>Status: <strong>{instance.status}</strong></p>
                    
                    {instance.steps && instance.steps.length > 0 && (
                      <div style={{ marginTop: '15px' }}>
                        <h5>Workflow-Schritte:</h5>
                        {instance.steps.map(step => (
                          <div key={step.id} style={{
                            padding: '10px',
                            marginBottom: '10px',
                            backgroundColor: step.status === 'APPROVED' ? '#d1fae5' :
                                           step.status === 'REJECTED' ? '#fee2e2' :
                                           step.status === 'PENDING' ? '#fef3c7' : '#f3f4f6',
                            borderRadius: '4px'
                          }}>
                            <strong>{step.step?.name}</strong>
                            <span style={{ marginLeft: '10px', fontSize: '0.9em' }}>
                              ({step.status})
                            </span>
                            {step.approvedBy && (
                              <div style={{ fontSize: '0.85em', marginTop: '5px' }}>
                                von {step.approvedBy.firstName} {step.approvedBy.lastName}
                                {step.approvedAt && ` am ${new Date(step.approvedAt).toLocaleDateString('de-CH')}`}
                              </div>
                            )}
                            {step.comment && (
                              <div style={{ fontSize: '0.85em', marginTop: '5px', fontStyle: 'italic' }}>
                                "{step.comment}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelectedExpenseForWorkflow(null)}>
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
