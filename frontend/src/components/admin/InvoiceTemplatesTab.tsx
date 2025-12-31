import React, { useState, useEffect } from 'react';
import InvoiceTemplateEditor from '../InvoiceTemplateEditor';
import TemplateWorkflowManager from './TemplateWorkflowManager';
import { invoiceTemplateService } from '../../services/invoiceTemplateService';

const InvoiceTemplatesTab: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | undefined>();
  const [workflowTemplateId, setWorkflowTemplateId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invoiceTemplateService.getAll();
      setTemplates(data);
    } catch (err: any) {
      setError(err?.message || 'Fehler beim Laden der Vorlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingTemplateId(undefined);
    setShowEditor(true);
  };

  const handleEdit = (id: string) => {
    setEditingTemplateId(id);
    setShowEditor(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Möchten Sie die Vorlage "${name}" wirklich löschen?`)) {
      return;
    }

    try {
      await invoiceTemplateService.delete(id);
      loadTemplates();
    } catch (err: any) {
      alert(err?.message || 'Fehler beim Löschen der Vorlage');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await invoiceTemplateService.setDefault(id);
      loadTemplates();
    } catch (err: any) {
      alert(err?.message || 'Fehler beim Setzen der Standardvorlage');
    }
  };

  const handleSave = () => {
    setShowEditor(false);
    loadTemplates();
  };

  const handleCancel = () => {
    setShowEditor(false);
    setEditingTemplateId(undefined);
  };

  return (
    <div>
      {workflowTemplateId && (
        <TemplateWorkflowManager
          templateId={workflowTemplateId}
          onClose={() => setWorkflowTemplateId(null)}
        />
      )}

      {showEditor && (
        <InvoiceTemplateEditor
          templateId={editingTemplateId}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Rechnungsvorlagen</h2>
        <button className="btn btn-primary" onClick={handleCreateNew}>
          + Neue Vorlage
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Lade Vorlagen...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {templates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', gridColumn: '1 / -1' }}>
              <p>Noch keine Vorlagen vorhanden.</p>
              <button className="btn btn-primary" onClick={handleCreateNew}>
                Erste Vorlage erstellen
              </button>
            </div>
          ) : (
            templates.map((template) => (
              <div key={template.id} style={{
                background: 'white',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>{template.name}</h3>
                  {template.isDefault && (
                    <span style={{
                      background: '#dbeafe',
                      color: '#1e40af',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}>Standard</span>
                  )}
                </div>
                <div style={{ marginBottom: '16px', fontSize: '14px', color: '#6b7280' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Firma:</strong> {template.companyName}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>E-Mail:</strong> {template.companyEmail || '-'}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Telefon:</strong> {template.companyPhone || '-'}
                  </div>
                  {template.companyTaxId && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>UID:</strong> {template.companyTaxId}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: '13px' }}
                    onClick={() => handleEdit(template.id)}
                  >
                    Bearbeiten
                  </button>
                  <button
                    className="btn"
                    style={{ padding: '6px 12px', fontSize: '13px', background: '#f59e0b', color: 'white' }}
                    onClick={() => setWorkflowTemplateId(template.id)}
                  >
                    🔄 Workflows
                  </button>
                  {!template.isDefault && (
                    <>
                      <button
                        className="btn"
                        style={{ padding: '6px 12px', fontSize: '13px', background: '#f3f4f6', color: '#374151' }}
                        onClick={() => handleSetDefault(template.id)}
                      >
                        Als Standard
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                        onClick={() => handleDelete(template.id, template.name)}
                      >
                        Löschen
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default InvoiceTemplatesTab;
