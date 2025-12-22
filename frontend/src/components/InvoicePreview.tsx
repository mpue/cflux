import React from 'react';
import { InvoiceTemplateFormData } from '../types/invoiceTemplate';
import '../styles/InvoicePreview.css';

interface InvoicePreviewProps {
  template: InvoiceTemplateFormData;
  onLogoPositionChange?: (position: { x: number; y: number; width: number; height: number }) => void;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ template, onLogoPositionChange }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const [logoPosition, setLogoPosition] = React.useState(() => {
    if (template.logoPosition) {
      try {
        return JSON.parse(template.logoPosition);
      } catch {
        return { x: 20, y: 20, width: 150, height: 60 };
      }
    }
    return { x: 20, y: 20, width: 150, height: 60 };
  });
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const logoRef = React.useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({
      x: e.clientX - logoPosition.x,
      y: e.clientY - logoPosition.y,
    });
    e.preventDefault();
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.stopPropagation();
    e.preventDefault();
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        const newPosition = {
          ...logoPosition,
          x: Math.max(0, Math.min(newX, 500)),
          y: Math.max(0, Math.min(newY, 200)),
        };
        setLogoPosition(newPosition);
        
        if (onLogoPositionChange) {
          onLogoPositionChange(newPosition);
        }
      } else if (isResizing) {
        if (logoRef.current) {
          const rect = logoRef.current.getBoundingClientRect();
          const newWidth = e.clientX - rect.left;
          const newHeight = newWidth * (logoPosition.height / logoPosition.width); // Maintain aspect ratio
          
          const newPosition = {
            ...logoPosition,
            width: Math.max(50, Math.min(newWidth, 300)),
            height: Math.max(20, Math.min(newHeight, 120)),
          };
          setLogoPosition(newPosition);
          
          if (onLogoPositionChange) {
            onLogoPositionChange(newPosition);
          }
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, logoPosition, onLogoPositionChange]);

  // Mock invoice data for preview
  const mockInvoice = {
    invoiceNumber: 'RE-2025-0001',
    invoiceDate: new Date().toLocaleDateString('de-CH'),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('de-CH'),
    customer: {
      name: 'Musterfirma AG',
      contactPerson: 'Max Mustermann',
      address: 'Musterstrasse 123',
      zipCode: '8000',
      city: 'Zürich',
      country: 'Schweiz',
    },
    items: [
      {
        description: 'Beratungsleistung',
        quantity: 10,
        unit: 'Stunden',
        unitPrice: 150,
        vatRate: 7.7,
      },
      {
        description: 'Implementierung',
        quantity: 20,
        unit: 'Stunden',
        unitPrice: 180,
        vatRate: 7.7,
      },
    ],
  };

  const subtotal = mockInvoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const vat = subtotal * 0.077;
  const total = subtotal + vat;

  return (
    <div className="invoice-preview">
      <div className="preview-header">
        <h3>Vorschau</h3>
        <span className="preview-label">Live-Ansicht der Rechnung</span>
      </div>

      <div className="preview-page" style={{ backgroundColor: '#ffffff' }}>
        {/* Logo (draggable) */}
        {template.showLogo && template.logoUrl && (
          <div
            ref={logoRef}
            className={`logo-container ${isDragging ? 'dragging' : ''}`}
            style={{
              position: 'absolute',
              left: `${logoPosition.x}px`,
              top: `${logoPosition.y}px`,
              width: `${logoPosition.width}px`,
              height: `${logoPosition.height}px`,
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onMouseDown={handleMouseDown}
          >
            <img
              src={template.logoUrl}
              alt="Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
            />
            <div className="logo-hint">Verschieben & Größe ändern</div>
            <div
              className="resize-handle"
              onMouseDown={handleResizeStart}
            />
          </div>
        )}

        {/* Header */}
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
          <div style={{ fontWeight: 'bold' }}>{mockInvoice.customer.name}</div>
          {mockInvoice.customer.contactPerson && <div>z.H. {mockInvoice.customer.contactPerson}</div>}
          <div>{mockInvoice.customer.address}</div>
          <div>
            {mockInvoice.customer.zipCode} {mockInvoice.customer.city}
          </div>
        </div>

        {/* Invoice Details */}
        <div className="preview-details">
          <table style={{ width: '100%', fontSize: '11px' }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Rechnung Nr.:</td>
                <td style={{ textAlign: 'right' }}>{mockInvoice.invoiceNumber}</td>
              </tr>
              <tr>
                <td>Rechnungsdatum:</td>
                <td style={{ textAlign: 'right' }}>{mockInvoice.invoiceDate}</td>
              </tr>
              <tr>
                <td>Fälligkeitsdatum:</td>
                <td style={{ textAlign: 'right' }}>{mockInvoice.dueDate}</td>
              </tr>
            </tbody>
          </table>
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
              <th style={{ textAlign: 'left', padding: '6px' }}>Beschreibung</th>
              <th style={{ textAlign: 'right', padding: '6px' }}>Menge</th>
              <th style={{ textAlign: 'right', padding: '6px' }}>Einheit</th>
              <th style={{ textAlign: 'right', padding: '6px' }}>Preis</th>
              <th style={{ textAlign: 'right', padding: '6px' }}>MwSt.</th>
              <th style={{ textAlign: 'right', padding: '6px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {mockInvoice.items.map((item, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '6px' }}>{item.description}</td>
                <td style={{ textAlign: 'right', padding: '6px' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right', padding: '6px' }}>{item.unit}</td>
                <td style={{ textAlign: 'right', padding: '6px' }}>CHF {item.unitPrice.toFixed(2)}</td>
                <td style={{ textAlign: 'right', padding: '6px' }}>{item.vatRate}%</td>
                <td style={{ textAlign: 'right', padding: '6px' }}>
                  CHF {(item.quantity * item.unitPrice).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} style={{ textAlign: 'right', padding: '6px', fontWeight: 'bold' }}>
                Zwischentotal:
              </td>
              <td style={{ textAlign: 'right', padding: '6px' }}>CHF {subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={5} style={{ textAlign: 'right', padding: '6px' }}>
                MwSt. 7.7%:
              </td>
              <td style={{ textAlign: 'right', padding: '6px' }}>CHF {vat.toFixed(2)}</td>
            </tr>
            <tr style={{ fontWeight: 'bold', backgroundColor: '#f9fafb' }}>
              <td colSpan={5} style={{ textAlign: 'right', padding: '8px', color: template.primaryColor }}>
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
          </div>
        )}

        {/* Footer */}
        {template.footerText && (
          <div
            className="preview-footer"
            style={{ fontSize: '9px', color: '#6b7280', marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '10px' }}
          >
            {template.footerText}
          </div>
        )}

        {/* Tax ID */}
        {template.showTaxId && template.companyTaxId && (
          <div className="preview-tax-id" style={{ fontSize: '9px', color: '#6b7280', marginTop: '5px' }}>
            UID: {template.companyTaxId}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicePreview;
