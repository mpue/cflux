import React, { useState, useEffect } from 'react';
import { invoiceTemplateService } from '../services/invoiceTemplateService';
import { InvoiceTemplate } from '../types/invoiceTemplate';
import InvoiceTemplateEditor from '../components/InvoiceTemplateEditor';
import '../styles/InvoiceTemplatesPage.css';

const InvoiceTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | undefined>();

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
      setError(err.response?.data?.error || 'Fehler beim Laden der Vorlagen');
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
      alert(err.response?.data?.error || 'Fehler beim Löschen der Vorlage');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await invoiceTemplateService.setDefault(id);
      loadTemplates();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Fehler beim Setzen der Standardvorlage');
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

  if (showEditor) {
    return (
      <InvoiceTemplateEditor
        templateId={editingTemplateId}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="invoice-templates-page">
      <div className="page-header">
        <h1>Rechnungsvorlagen</h1>
        <button className="btn btn-primary" onClick={handleCreateNew}>
          + Neue Vorlage
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Lade Vorlagen...</div>
      ) : (
        <div className="templates-grid">
          {templates.length === 0 ? (
            <div className="empty-state">
              <p>Noch keine Vorlagen vorhanden.</p>
              <button className="btn btn-primary" onClick={handleCreateNew}>
                Erste Vorlage erstellen
              </button>
            </div>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="template-card">
                <div className="template-header">
                  <h3>{template.name}</h3>
                  {template.isDefault && <span className="badge-default">Standard</span>}
                </div>
                <div className="template-info">
                  <div className="info-item">
                    <strong>Firma:</strong> {template.companyName}
                  </div>
                  <div className="info-item">
                    <strong>E-Mail:</strong> {template.companyEmail || '-'}
                  </div>
                  <div className="info-item">
                    <strong>Telefon:</strong> {template.companyPhone || '-'}
                  </div>
                  {template.companyTaxId && (
                    <div className="info-item">
                      <strong>UID:</strong> {template.companyTaxId}
                    </div>
                  )}
                </div>
                <div className="template-actions">
                  <button
                    className="btn btn-small btn-secondary"
                    onClick={() => handleEdit(template.id)}
                  >
                    Bearbeiten
                  </button>
                  {!template.isDefault && (
                    <>
                      <button
                        className="btn btn-small btn-outline"
                        onClick={() => handleSetDefault(template.id)}
                      >
                        Als Standard
                      </button>
                      <button
                        className="btn btn-small btn-danger"
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

export default InvoiceTemplatesPage;
