import React, { useEffect, useState } from 'react';
import { Invoice } from '../types';
import '../styles/InvoicePreviewModal.css';

interface InvoicePreviewModalProps {
  invoice: Invoice;
  onClose: () => void;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ invoice, onClose }) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

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
    const fetchPdf = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
        const response = await fetch(
          `${apiUrl}/invoices/${invoice.id}/pdf`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          console.error('PDF fetch failed:', response.status, response.statusText);
          throw new Error('PDF konnte nicht geladen werden');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching PDF:', err);
        setError('Fehler beim Laden des PDFs');
        setLoading(false);
      }
    };

    fetchPdf();

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [invoice.id, pdfUrl]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${invoice.documentType === 'QUOTE' ? 'Angebot' : 'Rechnung'}_${invoice.invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="invoice-preview-modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header no-print">
          <h2>{invoice.documentType === 'QUOTE' ? 'Angebotsvorschau' : 'Rechnungsvorschau'}</h2>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={handleDownload}>
              ⬇️ Herunterladen
            </button>
            <button className="btn btn-close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="pdf-container">
          {loading && <div style={{ padding: '20px', textAlign: 'center' }}>Lade PDF...</div>}
          {error && <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>}
          {pdfUrl && !loading && !error && (
            <object
              data={pdfUrl}
              type="application/pdf"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
            >
              <p>Dein Browser kann PDFs nicht anzeigen. <button onClick={handleDownload}>Hier herunterladen</button></p>
            </object>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;
