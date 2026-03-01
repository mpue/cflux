import React, { useState, useEffect } from 'react';
import { invoiceService } from '../../services/invoiceService';
import { workflowService } from '../../services/workflow.service';
import { Invoice } from '../../types';
import './WorkflowTestDialog.css';
import { useCurrency } from '../../contexts/CurrencyContext';

interface WorkflowTestDialogProps {
  workflowId: string;
  workflowName: string;
  onClose: () => void;
}

interface TestResult {
  success: boolean;
  message: string;
  steps?: Array<{
    name: string;
    type: string;
    status: string;
    result?: boolean;
  }>;
  error?: string;
}

const WorkflowTestDialog: React.FC<WorkflowTestDialogProps> = ({
  workflowId,
  workflowName,
  onClose,
}) => {
  const { currency } = useCurrency();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await invoiceService.getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Fehler beim Laden der Rechnungen:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!selectedInvoiceId) {
      alert('Bitte wählen Sie eine Rechnung aus.');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const result = await workflowService.testWorkflow(workflowId, selectedInvoiceId);
      setTestResult(result);
    } catch (error: any) {
      setTestResult({
        success: false,
        message: 'Test fehlgeschlagen',
        error: error.message || 'Unbekannter Fehler',
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return '✅';
      case 'PENDING':
        return '⏳';
      case 'SKIPPED':
        return '⏭️';
      case 'REJECTED':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return '#28a745';
      case 'PENDING':
        return '#ffc107';
      case 'SKIPPED':
        return '#6c757d';
      case 'REJECTED':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content workflow-test-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🧪 Workflow testen</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="test-info">
            <p><strong>Workflow:</strong> {workflowName}</p>
            <p className="test-description">
              Wählen Sie eine Rechnung aus, um zu testen, wie dieser Workflow
              mit den Rechnungsdaten ausgeführt würde.
            </p>
          </div>

          <div className="form-group">
            <label>Testrechnung auswählen</label>
            {loading ? (
              <p>Lade Rechnungen...</p>
            ) : (
              <select
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
                className="form-control"
              >
                <option value="">-- Rechnung auswählen --</option>
                {invoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber} - {invoice.customer?.name || 'N/A'} - {currency} {invoice.totalAmount}
                    {' '}({new Date(invoice.invoiceDate).toLocaleDateString('de-CH')})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedInvoiceId && (
            <div className="test-actions">
              <button
                className="btn btn-primary"
                onClick={handleTest}
                disabled={testing}
              >
                {testing ? '🔄 Teste...' : '▶️ Workflow testen'}
              </button>
            </div>
          )}

          {testResult && (
            <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
              <h3>{testResult.success ? '✅ Test erfolgreich' : '❌ Test fehlgeschlagen'}</h3>
              <p>{testResult.message}</p>

              {testResult.error && (
                <div className="error-details">
                  <strong>Fehler:</strong> {testResult.error}
                </div>
              )}

              {testResult.steps && testResult.steps.length > 0 && (
                <div className="test-steps">
                  <h4>Workflow-Schritte:</h4>
                  <div className="steps-list">
                    {testResult.steps.map((step, index) => (
                      <div
                        key={index}
                        className="step-item"
                        style={{ borderLeft: `4px solid ${getStatusColor(step.status)}` }}
                      >
                        <div className="step-header">
                          <span className="step-icon">{getStatusIcon(step.status)}</span>
                          <span className="step-name">{step.name}</span>
                          <span className="step-type">{step.type}</span>
                        </div>
                        <div className="step-status">
                          Status: <strong>{step.status}</strong>
                          {step.result !== undefined && (
                            <span className="step-result">
                              {' '}→ {step.result ? 'true (Ausgang A)' : 'false (Ausgang B)'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowTestDialog;
