import React, { useState, useEffect } from 'react';
import { User } from '../types';
import '../styles/PDFReportModal.css';

interface PDFReportModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

const PDFReportModal: React.FC<PDFReportModalProps> = ({ 
  user, 
  isOpen, 
  onClose,
  isAdmin = false 
}) => {
  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [includeDetailed, setIncludeDetailed] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleQuickSelect = (months: number) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);

    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const handleLastMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const handleCurrentYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const handleGeneratePDF = async () => {
    if (!startDate || !endDate) {
      setError('Bitte wählen Sie einen Zeitraum aus');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Startdatum muss vor dem Enddatum liegen');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const endpoint = isAdmin 
        ? `/api/reports/user-pdf/${user.id}`
        : '/api/reports/my-pdf';

      const response = await fetch(
        `${endpoint}?startDate=${startDate}&endDate=${endDate}&detailed=${includeDetailed}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Fehler beim Generieren des PDF-Berichts');
      }

      // Download PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Arbeitszeitbericht_${user.firstName}_${user.lastName}_${startDate}_${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content pdf-report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>PDF-Bericht erstellen</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="user-info">
            <h3>{user.firstName} {user.lastName}</h3>
            <p>{user.email}</p>
            {user.employeeNumber && <p>Personalnummer: {user.employeeNumber}</p>}
          </div>

          <div className="quick-select-buttons">
            <h4>Schnellauswahl:</h4>
            <div className="button-group">
              <button 
                type="button" 
                className="quick-select-btn"
                onClick={handleCurrentMonth}
              >
                Aktueller Monat
              </button>
              <button 
                type="button" 
                className="quick-select-btn"
                onClick={handleLastMonth}
              >
                Letzter Monat
              </button>
              <button 
                type="button" 
                className="quick-select-btn"
                onClick={() => handleQuickSelect(3)}
              >
                Letzte 3 Monate
              </button>
              <button 
                type="button" 
                className="quick-select-btn"
                onClick={() => handleQuickSelect(6)}
              >
                Letzte 6 Monate
              </button>
              <button 
                type="button" 
                className="quick-select-btn"
                onClick={handleCurrentYear}
              >
                Aktuelles Jahr
              </button>
            </div>
          </div>

          <div className="date-range-inputs">
            <div className="form-group">
              <label htmlFor="startDate">Startdatum:</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">Enddatum:</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeDetailed}
                onChange={(e) => setIncludeDetailed(e.target.checked)}
              />
              <span>Detaillierte Zeiteinträge einschließen</span>
            </label>
          </div>

          <div className="report-info">
            <h4>Der Bericht enthält:</h4>
            <ul>
              <li>Mitarbeiterdaten und Personalinformationen</li>
              <li>Zusammenfassung der Arbeitsstunden</li>
              <li>Stundenverteilung nach Projekten</li>
              <li>Stundenverteilung nach Standorten</li>
              <li>Arbeitszeit-Compliance Analyse (bei Vertragsangaben)</li>
              <li>Wöchentliche Übersicht</li>
              <li>Tägliche Übersicht</li>
              <li>Abwesenheiten (Urlaub, Krankheit, etc.)</li>
              {includeDetailed && <li><strong>Detaillierte Liste aller Zeiteinträge</strong></li>}
            </ul>
          </div>

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={isGenerating}
          >
            Abbrechen
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleGeneratePDF}
            disabled={isGenerating || !startDate || !endDate}
          >
            {isGenerating ? 'Wird generiert...' : 'PDF erstellen'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFReportModal;
