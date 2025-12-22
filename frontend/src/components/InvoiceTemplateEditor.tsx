import React, { useState, useEffect } from 'react';
import { invoiceTemplateService } from '../services/invoiceTemplateService';
import { InvoiceTemplate, InvoiceTemplateFormData } from '../types/invoiceTemplate';
import '../styles/InvoiceTemplateEditor.css';

interface InvoiceTemplateEditorProps {
  templateId?: string;
  onSave?: (template: InvoiceTemplate) => void;
  onCancel?: () => void;
}

const InvoiceTemplateEditor: React.FC<InvoiceTemplateEditorProps> = ({
  templateId,
  onSave,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'company' | 'text' | 'style' | 'settings'>('company');

  const [formData, setFormData] = useState<InvoiceTemplateFormData>({
    name: '',
    isDefault: false,
    companyName: 'Ihre Firma',
    companyStreet: '',
    companyZip: '',
    companyCity: '',
    companyCountry: 'Schweiz',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    companyTaxId: '',
    companyIban: '',
    companyBank: '',
    headerText: '',
    footerText: '',
    primaryColor: '#2563eb',
    logoUrl: '',
    introText: 'Vielen Dank für Ihr Vertrauen. Wir erlauben uns, Ihnen folgende Leistungen in Rechnung zu stellen:',
    paymentTermsText: 'Zahlbar innerhalb von 30 Tagen netto.',
    showLogo: true,
    showTaxId: true,
    showPaymentInfo: true,
  });

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      setError(null);
      const template = await invoiceTemplateService.getById(templateId!);
      setFormData({
        name: template.name,
        isDefault: template.isDefault,
        companyName: template.companyName,
        companyStreet: template.companyStreet,
        companyZip: template.companyZip,
        companyCity: template.companyCity,
        companyCountry: template.companyCountry,
        companyPhone: template.companyPhone,
        companyEmail: template.companyEmail,
        companyWebsite: template.companyWebsite,
        companyTaxId: template.companyTaxId,
        companyIban: template.companyIban,
        companyBank: template.companyBank,
        headerText: template.headerText || '',
        footerText: template.footerText || '',
        primaryColor: template.primaryColor,
        logoUrl: template.logoUrl || '',
        introText: template.introText || '',
        paymentTermsText: template.paymentTermsText || '',
        showLogo: template.showLogo,
        showTaxId: template.showTaxId,
        showPaymentInfo: template.showPaymentInfo,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden der Vorlage');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let template: InvoiceTemplate;
      if (templateId) {
        template = await invoiceTemplateService.update(templateId, formData);
        setSuccess('Vorlage erfolgreich aktualisiert');
      } else {
        template = await invoiceTemplateService.create(formData);
        setSuccess('Vorlage erfolgreich erstellt');
      }

      if (onSave) {
        onSave(template);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Speichern der Vorlage');
    } finally {
      setLoading(false);
    }
  };

  if (loading && templateId) {
    return (
      <div className="invoice-template-editor">
        <div className="editor-content">
          <div className="loading">Lade Vorlage...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-template-editor" onClick={onCancel}>
      <div className="editor-content" onClick={(e) => e.stopPropagation()}>
        <div className="editor-header">
          <h2>{templateId ? 'Vorlage bearbeiten' : 'Neue Vorlage erstellen'}</h2>
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-close">
              ✕
            </button>
          )}
        </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        {/* Template Name and Default Toggle */}
        <div className="template-basics">
          <div className="form-group">
            <label htmlFor="name">Vorlagenname *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="z.B. Standard, Projektrechnung"
            />
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleChange}
              />
              Als Standardvorlage festlegen
            </label>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            type="button"
            className={activeTab === 'company' ? 'active' : ''}
            onClick={() => setActiveTab('company')}
          >
            Firmendaten
          </button>
          <button
            type="button"
            className={activeTab === 'text' ? 'active' : ''}
            onClick={() => setActiveTab('text')}
          >
            Texte
          </button>
          <button
            type="button"
            className={activeTab === 'style' ? 'active' : ''}
            onClick={() => setActiveTab('style')}
          >
            Design
          </button>
          <button
            type="button"
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            Einstellungen
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Company Info Tab */}
          {activeTab === 'company' && (
            <div className="tab-pane">
              <h3>Firmendaten</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="companyName">Firmenname *</label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="companyStreet">Strasse</label>
                  <input
                    type="text"
                    id="companyStreet"
                    name="companyStreet"
                    value={formData.companyStreet}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="companyZip">PLZ</label>
                  <input
                    type="text"
                    id="companyZip"
                    name="companyZip"
                    value={formData.companyZip}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="companyCity">Ort</label>
                  <input
                    type="text"
                    id="companyCity"
                    name="companyCity"
                    value={formData.companyCity}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="companyCountry">Land</label>
                  <input
                    type="text"
                    id="companyCountry"
                    name="companyCountry"
                    value={formData.companyCountry}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="companyPhone">Telefon</label>
                  <input
                    type="text"
                    id="companyPhone"
                    name="companyPhone"
                    value={formData.companyPhone}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="companyEmail">E-Mail</label>
                  <input
                    type="email"
                    id="companyEmail"
                    name="companyEmail"
                    value={formData.companyEmail}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="companyWebsite">Website</label>
                  <input
                    type="text"
                    id="companyWebsite"
                    name="companyWebsite"
                    value={formData.companyWebsite}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="companyTaxId">UID/Steuernummer</label>
                  <input
                    type="text"
                    id="companyTaxId"
                    name="companyTaxId"
                    value={formData.companyTaxId}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="companyIban">IBAN</label>
                  <input
                    type="text"
                    id="companyIban"
                    name="companyIban"
                    value={formData.companyIban}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="companyBank">Bank</label>
                  <input
                    type="text"
                    id="companyBank"
                    name="companyBank"
                    value={formData.companyBank}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Text Tab */}
          {activeTab === 'text' && (
            <div className="tab-pane">
              <h3>Texte</h3>
              <div className="form-group">
                <label htmlFor="headerText">Kopfzeile (optional)</label>
                <textarea
                  id="headerText"
                  name="headerText"
                  value={formData.headerText}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Text für die Kopfzeile der Rechnung"
                />
              </div>
              <div className="form-group">
                <label htmlFor="introText">Einleitungstext</label>
                <textarea
                  id="introText"
                  name="introText"
                  value={formData.introText}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Text vor der Rechnungspositions-Tabelle"
                />
              </div>
              <div className="form-group">
                <label htmlFor="paymentTermsText">Zahlungsbedingungen</label>
                <textarea
                  id="paymentTermsText"
                  name="paymentTermsText"
                  value={formData.paymentTermsText}
                  onChange={handleChange}
                  rows={2}
                  placeholder="z.B. Zahlbar innerhalb von 30 Tagen netto"
                />
              </div>
              <div className="form-group">
                <label htmlFor="footerText">Fusszeile (optional)</label>
                <textarea
                  id="footerText"
                  name="footerText"
                  value={formData.footerText}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Text für die Fusszeile der Rechnung"
                />
              </div>
            </div>
          )}

          {/* Style Tab */}
          {activeTab === 'style' && (
            <div className="tab-pane">
              <h3>Design</h3>
              <div className="form-group">
                <label htmlFor="logoUrl">Logo URL</label>
                <input
                  type="text"
                  id="logoUrl"
                  name="logoUrl"
                  value={formData.logoUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/logo.png"
                />
                <small>URL zu Ihrem Firmenlogo (PNG, JPG oder SVG)</small>
              </div>
              <div className="form-group">
                <label htmlFor="primaryColor">Primärfarbe</label>
                <div className="color-picker-group">
                  <input
                    type="color"
                    id="primaryColor"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={handleChange}
                    name="primaryColor"
                    placeholder="#2563eb"
                  />
                </div>
                <small>Farbe für Überschriften und Akzente</small>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="tab-pane">
              <h3>Einstellungen</h3>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="showLogo"
                    checked={formData.showLogo}
                    onChange={handleChange}
                  />
                  Logo anzeigen
                </label>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="showTaxId"
                    checked={formData.showTaxId}
                    onChange={handleChange}
                  />
                  UID/Steuernummer anzeigen
                </label>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="showPaymentInfo"
                    checked={formData.showPaymentInfo}
                    onChange={handleChange}
                  />
                  Zahlungsinformationen (IBAN, Bank) anzeigen
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              Abbrechen
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Speichere...' : templateId ? 'Aktualisieren' : 'Erstellen'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default InvoiceTemplateEditor;
