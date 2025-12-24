import React, { useState } from 'react';
import {
  Reminder,
  OverdueInvoice,
  ReminderStats,
  ReminderStatus,
  ReminderLevel,
  ReminderLevelLabels,
  ReminderStatusLabels
} from '../../types/reminder.types';
import { reminderService } from '../../services/reminder.service';

interface RemindersTabProps {
  reminders: Reminder[];
  overdueInvoices: OverdueInvoice[];
  stats: ReminderStats | null;
  onUpdate: () => void;
}

export const RemindersTab: React.FC<RemindersTabProps> = ({
  reminders,
  overdueInvoices,
  stats,
  onUpdate
}) => {
  const [view, setView] = useState<'overview' | 'reminders' | 'overdue'>('overview');
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-CH');
  };

  const getStatusColor = (status: ReminderStatus) => {
    const colors = {
      PENDING: '#f59e0b',
      SENT: '#3b82f6',
      PAID: '#10b981',
      ESCALATED: '#ef4444',
      CANCELLED: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getLevelColor = (level: ReminderLevel) => {
    const colors = {
      FIRST_REMINDER: '#3b82f6',
      SECOND_REMINDER: '#f59e0b',
      FINAL_REMINDER: '#ef4444'
    };
    return colors[level] || '#6b7280';
  };

  const handleSendReminder = async (id: string) => {
    if (!window.confirm('Mahnung wirklich versenden?')) return;
    
    try {
      setLoading(true);
      await reminderService.sendReminder(id, 'admin');
      await onUpdate();
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Fehler beim Versenden der Mahnung');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    if (!window.confirm('Mahnung als bezahlt markieren?')) return;
    
    try {
      setLoading(true);
      await reminderService.markReminderAsPaid(id);
      await onUpdate();
    } catch (error) {
      console.error('Error marking as paid:', error);
      alert('Fehler beim Markieren als bezahlt');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (!window.confirm('Mahnung wirklich löschen?')) return;
    
    try {
      setLoading(true);
      await reminderService.deleteReminder(id);
      await onUpdate();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      alert('Fehler beim Löschen der Mahnung');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReminders = async () => {
    if (selectedInvoices.size === 0) {
      alert('Bitte wählen Sie mindestens eine Rechnung aus');
      return;
    }

    if (!window.confirm(`${selectedInvoices.size} Mahnungen erstellen?`)) return;

    try {
      setLoading(true);
      const settings = await reminderService.getReminderSettings();
      
      for (const invoiceId of selectedInvoices) {
        const invoice = overdueInvoices.find(inv => inv.id === invoiceId);
        if (!invoice) continue;

        const dueDate = new Date();
        let paymentDays = settings.firstReminderPaymentDays;
        
        if (invoice.suggestedLevel === ReminderLevel.SECOND_REMINDER) {
          paymentDays = settings.secondReminderPaymentDays;
        } else if (invoice.suggestedLevel === ReminderLevel.FINAL_REMINDER) {
          paymentDays = settings.finalReminderPaymentDays;
        }
        
        dueDate.setDate(dueDate.getDate() + paymentDays);

        await reminderService.createReminder({
          invoiceId: invoice.id,
          level: invoice.suggestedLevel,
          dueDate: dueDate.toISOString(),
          reminderFee: invoice.suggestedFee,
          interestAmount: 0,
          interestRate: settings.defaultInterestRate
        });
      }

      alert('Mahnungen erfolgreich erstellt');
      setSelectedInvoices(new Set());
      await onUpdate();
      setView('reminders');
    } catch (error) {
      console.error('Error creating reminders:', error);
      alert('Fehler beim Erstellen der Mahnungen');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInvoice = (invoiceId: string) => {
    const newSelected = new Set(selectedInvoices);
    if (newSelected.has(invoiceId)) {
      newSelected.delete(invoiceId);
    } else {
      newSelected.add(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedInvoices.size === overdueInvoices.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(overdueInvoices.map(inv => inv.id)));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          className={`btn ${view === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setView('overview')}
        >
          Übersicht
        </button>
        <button
          className={`btn ${view === 'reminders' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setView('reminders')}
        >
          Mahnungen ({reminders.length})
        </button>
        <button
          className={`btn ${view === 'overdue' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setView('overdue')}
        >
          Überfällige Rechnungen ({overdueInvoices.length})
        </button>
      </div>

      {view === 'overview' && stats && (
        <div>
          <h2>Mahnwesen Statistiken</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
            <div style={{ padding: '20px', background: '#f7fafc', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6b7280' }}>Gesamt Mahnungen</h3>
              <p style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>{stats.totalReminders}</p>
            </div>
            <div style={{ padding: '20px', background: '#f7fafc', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6b7280' }}>Gesamte Mahngebühren</h3>
              <p style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>{formatCurrency(stats.totalFees)}</p>
            </div>
            <div style={{ padding: '20px', background: '#f7fafc', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6b7280' }}>Gesamte Zinsen</h3>
              <p style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>{formatCurrency(stats.totalInterest)}</p>
            </div>
            <div style={{ padding: '20px', background: '#f7fafc', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6b7280' }}>Überfällige Rechnungen</h3>
              <p style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>{overdueInvoices.length}</p>
            </div>
          </div>

          <h3 style={{ marginTop: '30px' }}>Status-Verteilung</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginTop: '15px' }}>
            {stats.byStatus.map(item => (
              <div key={item.status} style={{ padding: '15px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>{ReminderStatusLabels[item.status]}</div>
                <div style={{ fontSize: '20px', fontWeight: '600' }}>{item._count}</div>
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: '30px' }}>Mahnstufen-Verteilung</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginTop: '15px' }}>
            {stats.byLevel.map(item => (
              <div key={item.level} style={{ padding: '15px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>{ReminderLevelLabels[item.level]}</div>
                <div style={{ fontSize: '20px', fontWeight: '600' }}>{item._count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'reminders' && (
        <div>
          <h2 style={{ marginBottom: '20px' }}>Alle Mahnungen</h2>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mahnnummer</th>
                  <th>Rechnungsnr.</th>
                  <th>Kunde</th>
                  <th>Mahnstufe</th>
                  <th>Status</th>
                  <th>Mahndatum</th>
                  <th>Fällig bis</th>
                  <th style={{ textAlign: 'right' }}>Betrag</th>
                  <th style={{ textAlign: 'right' }}>Gebühr</th>
                  <th style={{ textAlign: 'right' }}>Gesamt</th>
                  <th style={{ textAlign: 'center' }}>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {reminders.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                      Keine Mahnungen vorhanden
                    </td>
                  </tr>
                ) : (
                  reminders.map(reminder => (
                    <tr key={reminder.id}>
                      <td style={{ fontFamily: 'monospace' }}>{reminder.reminderNumber}</td>
                      <td style={{ fontFamily: 'monospace' }}>{reminder.invoice?.invoiceNumber || '-'}</td>
                      <td style={{ maxWidth: '200px' }}>{reminder.invoice?.customer?.name || '-'}</td>
                      <td>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: `${getLevelColor(reminder.level)}20`,
                          color: getLevelColor(reminder.level)
                        }}>
                          {ReminderLevelLabels[reminder.level]}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: `${getStatusColor(reminder.status)}20`,
                          color: getStatusColor(reminder.status)
                        }}>
                          {ReminderStatusLabels[reminder.status]}
                        </span>
                      </td>
                      <td>{formatDate(reminder.reminderDate)}</td>
                      <td>{formatDate(reminder.dueDate)}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(reminder.originalAmount)}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(reminder.reminderFee)}</td>
                      <td style={{ fontWeight: '600', textAlign: 'right' }}>{formatCurrency(reminder.totalAmount)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {reminder.status === ReminderStatus.PENDING && (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleSendReminder(reminder.id)}
                              disabled={loading}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              📤 Senden
                            </button>
                          )}
                          {reminder.status === ReminderStatus.SENT && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleMarkAsPaid(reminder.id)}
                              disabled={loading}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              ✅ Bezahlt
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteReminder(reminder.id)}
                            disabled={loading}
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
      )}

      {view === 'overdue' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ margin: 0 }}>Überfällige Rechnungen</h2>
            <button
              className="btn btn-primary"
              onClick={handleCreateReminders}
              disabled={selectedInvoices.size === 0 || loading}
            >
              Mahnungen erstellen ({selectedInvoices.size})
            </button>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedInvoices.size === overdueInvoices.length && overdueInvoices.length > 0}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th>Rechnungsnr.</th>
                  <th>Kunde</th>
                  <th>Fällig seit</th>
                  <th style={{ textAlign: 'center' }}>Tage überfällig</th>
                  <th style={{ textAlign: 'right' }}>Betrag</th>
                  <th style={{ textAlign: 'center' }}>Mahnungen</th>
                  <th style={{ textAlign: 'center' }}>Vorgeschlagen</th>
                  <th style={{ textAlign: 'right' }}>Gebühr</th>
                  <th style={{ textAlign: 'center' }}>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {overdueInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                      Keine überfälligen Rechnungen
                    </td>
                  </tr>
                ) : (
                  overdueInvoices.map(invoice => (
                    <tr key={invoice.id}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedInvoices.has(invoice.id)}
                          onChange={() => handleSelectInvoice(invoice.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ fontFamily: 'monospace' }}>{invoice.invoiceNumber}</td>
                      <td style={{ maxWidth: '200px' }}>{invoice.customer.name}</td>
                      <td>{formatDate(invoice.dueDate)}</td>
                      <td style={{ color: '#ef4444', fontWeight: '600', textAlign: 'center' }}>
                        {invoice.daysPastDue} Tage
                      </td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(invoice.totalAmount)}</td>
                      <td style={{ textAlign: 'center' }}>{invoice.reminderCount}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: `${getLevelColor(invoice.suggestedLevel)}20`,
                          color: getLevelColor(invoice.suggestedLevel)
                        }}>
                          {ReminderLevelLabels[invoice.suggestedLevel]}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(invoice.suggestedFee)}</td>
                      <td style={{ textAlign: 'center' }}>
                        {invoice.shouldSendReminder ? (
                          <span style={{ color: '#10b981', fontWeight: '600' }}>✓ Ja</span>
                        ) : (
                          <span style={{ color: '#6b7280' }}>- Nein</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
