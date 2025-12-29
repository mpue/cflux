import React, { useEffect, useState } from 'react';
import { Invoice } from '../types';
import { InvoiceTemplate } from '../types/invoiceTemplate';
import { invoiceTemplateService } from '../services/invoiceTemplateService';
import '../styles/InvoicePreviewModal.css';

interface InvoicePreviewModalProps {
  invoice: Invoice;
  onClose: () => void;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ invoice, onClose }) => {
  const [template, setTemplate] = useState<InvoiceTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        if (invoice.templateId) {
          const tmpl = await invoiceTemplateService.getById(invoice.templateId);
          setTemplate(tmpl);
        } else {
          // Load default template
          const tmpl = await invoiceTemplateService.getDefault();
          setTemplate(tmpl);
        }
      } catch (error) {
        console.error('Error loading template:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [invoice.templateId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !template) {
    return (
      <div className="invoice-preview-modal" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="loading">Lade Vorschau...</div>
        </div>
      </div>
    );
  }

  // Parse logo position
  let logoPosition = { x: 20, y: 20, width: 150, height: 60 };
  if (template.logoPosition) {
    try {
      logoPosition = JSON.parse(template.logoPosition);
    } catch (e) {
      console.warn('Failed to parse logo position');
    }
  }

  // Calculate totals
  const subtotal = invoice.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
  const vatRate = invoice.items?.[0]?.vatRate || 7.7;
  const vat = subtotal * (vatRate / 100);
  const total = subtotal + vat;

  return (
    <div className="invoice-preview-modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header no-print">
          <h2>Rechnungsvorschau</h2>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={handlePrint}>
              🖨️ Drucken
            </button>
            <button className="btn btn-close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="preview-container">
          <div className="preview-page print-page" style={{ backgroundColor: '#ffffff' }}>
            {/* Logo */}
            {template.showLogo && template.logoUrl && (
              <div
                className="logo-static"
                style={{
                  position: 'absolute',
                  left: `${logoPosition.x}px`,
                  top: `${logoPosition.y}px`,
                  width: `${logoPosition.width}px`,
                  height: `${logoPosition.height}px`,
                }}
              >
                <img
                  src={template.logoUrl}
                  alt="Logo"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              </div>
            )}

            {/* Header Text */}
            {template.headerText && (
              <div className="preview-header-text" style={{ color: template.primaryColor }}>
                {template.headerText}
              </div>
            )}

            {/* Company Info */}
            <div className="preview-company" style={{ marginTop: template.showLogo ? '100px' : '20px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', color: template.primaryColor }}>
                {template.companyName}
              </div>
              {template.companyStreet && <div style={{ fontSize: '11px' }}>{template.companyStreet}</div>}
              {(template.companyZip || template.companyCity) && (
                <div style={{ fontSize: '11px' }}>
                  {template.companyZip} {template.companyCity}
                </div>
              )}
              {template.companyPhone && <div style={{ fontSize: '11px' }}>Tel: {template.companyPhone}</div>}
              {template.companyEmail && <div style={{ fontSize: '11px' }}>E-Mail: {template.companyEmail}</div>}
              {template.companyWebsite && <div style={{ fontSize: '11px' }}>{template.companyWebsite}</div>}
            </div>

            {/* Customer Address */}
            <div className="preview-customer">
              <div style={{ fontWeight: 'bold' }}>{invoice.customer?.name || 'Kunde'}</div>
              {invoice.customer?.contactPerson && <div>z.H. {invoice.customer.contactPerson}</div>}
              {invoice.customer?.address && <div>{invoice.customer.address}</div>}
              {(invoice.customer?.zipCode || invoice.customer?.city) && (
                <div>
                  {invoice.customer?.zipCode} {invoice.customer?.city}
                </div>
              )}
              {invoice.customer?.country && invoice.customer.country !== 'Schweiz' && (
                <div>{invoice.customer.country}</div>
              )}
            </div>

            {/* Invoice Details */}
            <div className="preview-details">
              <table style={{ width: '100%', fontSize: '11px' }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 'bold', color: template.primaryColor }}>Rechnung Nr.:</td>
                    <td style={{ textAlign: 'right' }}>{invoice.invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td>Rechnungsdatum:</td>
                    <td style={{ textAlign: 'right' }}>
                      {new Date(invoice.invoiceDate).toLocaleDateString('de-CH')}
                    </td>
                  </tr>
                  <tr>
                    <td>Fälligkeitsdatum:</td>
                    <td style={{ textAlign: 'right' }}>
                      {new Date(invoice.dueDate).toLocaleDateString('de-CH')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Title */}
            <div className="preview-title" style={{ color: template.primaryColor }}>
              RECHNUNG
            </div>

            {/* Intro Text */}
            {template.introText && (
              <div className="preview-intro" style={{ fontSize: '11px', marginTop: '15px' }}>
                {template.introText}
              </div>
            )}

            {/* Items Table */}
            <table className="preview-items" style={{ width: '100%', marginTop: '15px', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: template.primaryColor, color: '#fff' }}>
                  <th style={{ textAlign: 'left', padding: '6px' }}>Pos</th>
                  <th style={{ textAlign: 'left', padding: '6px' }}>Beschreibung</th>
                  <th style={{ textAlign: 'right', padding: '6px' }}>Menge</th>
                  <th style={{ textAlign: 'right', padding: '6px' }}>Einheit</th>
                  <th style={{ textAlign: 'right', padding: '6px' }}>Preis</th>
                  <th style={{ textAlign: 'right', padding: '6px' }}>MwSt.</th>
                  <th style={{ textAlign: 'right', padding: '6px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, index) => (
                  <tr key={item.id || index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '6px' }}>{item.position}</td>
                    <td style={{ padding: '6px' }}>{item.description}</td>
                    <td style={{ textAlign: 'right', padding: '6px' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '6px' }}>{item.unit}</td>
                    <td style={{ textAlign: 'right', padding: '6px' }}>CHF {item.unitPrice.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '6px' }}>{item.vatRate}%</td>
                    <td style={{ textAlign: 'right', padding: '6px' }}>CHF {item.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} style={{ textAlign: 'right', padding: '6px', fontWeight: 'bold' }}>
                    Zwischentotal:
                  </td>
                  <td style={{ textAlign: 'right', padding: '6px' }}>CHF {subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={6} style={{ textAlign: 'right', padding: '6px' }}>
                    MwSt. {vatRate}%:
                  </td>
                  <td style={{ textAlign: 'right', padding: '6px' }}>CHF {vat.toFixed(2)}</td>
                </tr>
                <tr style={{ fontWeight: 'bold', backgroundColor: '#f9fafb' }}>
                  <td colSpan={6} style={{ textAlign: 'right', padding: '8px', color: template.primaryColor }}>
                    Total CHF:
                  </td>
                  <td style={{ textAlign: 'right', padding: '8px', color: template.primaryColor }}>
                    CHF {total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Payment Terms */}
            {template.paymentTermsText && (
              <div className="preview-payment" style={{ fontSize: '11px', marginTop: '15px' }}>
                <strong>Zahlungsbedingungen:</strong> {template.paymentTermsText}
              </div>
            )}

            {/* Payment Info */}
            {template.showPaymentInfo && template.companyIban && (
              <div className="preview-payment-info" style={{ fontSize: '10px', marginTop: '15px' }}>
                <div>
                  <strong>Bankverbindung:</strong>
                </div>
                {template.companyBank && <div>{template.companyBank}</div>}
                <div>IBAN: {template.companyIban}</div>
                <div>Kontoinhaber: {template.companyName}</div>
              </div>
            )}

            {/* Notes */}
            {invoice.notes && (
              <div className="preview-notes" style={{ fontSize: '11px', marginTop: '20px' }}>
                <strong style={{ color: template.primaryColor }}>Bemerkungen:</strong>
                <div style={{ marginTop: '5px' }}>{invoice.notes}</div>
              </div>
            )}

            {/* Footer */}
            {template.footerText && (
              <div
                className="preview-footer"
                style={{
                  fontSize: '9px',
                  color: '#6b7280',
                  marginTop: '30px',
                  borderTop: '1px solid #e5e7eb',
                  paddingTop: '10px',
                  textAlign: 'center',
                }}
              >
                {template.footerText}
              </div>
            )}

            {/* Tax ID */}
            {template.showTaxId && template.companyTaxId && (
              <div className="preview-tax-id" style={{ fontSize: '9px', color: '#6b7280', marginTop: '5px', textAlign: 'center' }}>
                UID: {template.companyTaxId}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;
