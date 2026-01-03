import React, { useState, useEffect } from 'react';
import { backupService, Backup } from '../../services/backup.service';

export const BackupTab: React.FC = () => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const data = await backupService.listBackups();
      setBackups(data);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Fehler beim Laden der Backups' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!window.confirm('Möchten Sie wirklich ein Backup erstellen?')) return;
    
    try {
      setLoading(true);
      const result = await backupService.createBackup();
      setMessage({ type: 'success', text: `Backup erfolgreich erstellt: ${result.filename}` });
      await loadBackups();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Fehler beim Erstellen des Backups' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = async (filename: string) => {
    try {
      await backupService.downloadBackup(filename);
      setMessage({ type: 'success', text: 'Backup wird heruntergeladen' });
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Fehler beim Herunterladen des Backups' });
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!window.confirm(`Möchten Sie das Backup "${filename}" wirklich löschen?`)) return;
    
    try {
      setLoading(true);
      await backupService.deleteBackup(filename);
      setMessage({ type: 'success', text: 'Backup erfolgreich gelöscht' });
      await loadBackups();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Fehler beim Löschen des Backups' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (!window.confirm(
      `WARNUNG: Das Wiederherstellen des Backups "${filename}" überschreibt alle aktuellen Daten!\n\nMöchten Sie fortfahren?`
    )) return;
    
    try {
      setLoading(true);
      await backupService.restoreBackup(filename);
      setMessage({ type: 'success', text: 'Backup erfolgreich wiederhergestellt. Bitte Seite neu laden.' });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Fehler beim Wiederherstellen des Backups' });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadBackup = async () => {
    if (!uploadFile) {
      setMessage({ type: 'error', text: 'Bitte wählen Sie eine Datei aus' });
      return;
    }
    
    try {
      setLoading(true);
      const result = await backupService.uploadBackup(uploadFile);
      setMessage({ type: 'success', text: `Backup erfolgreich hochgeladen: ${result.filename}` });
      setUploadFile(null);
      await loadBackups();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Fehler beim Hochladen des Backups' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      await backupService.exportData();
      setMessage({ type: 'success', text: 'Daten werden als JSON exportiert' });
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Fehler beim Exportieren der Daten' });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('de-DE');
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2>Backup & Restore</h2>
        
        {message && (
          <div
            style={{
              padding: '10px',
              marginBottom: '15px',
              borderRadius: '4px',
              backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
              color: message.type === 'success' ? '#155724' : '#721c24',
              border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
            }}
          >
            {message.text}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={handleCreateBackup}
            disabled={loading}
          >
            {loading ? 'Lädt...' : 'Neues Backup erstellen'}
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={handleExportData}
            disabled={loading}
          >
            Daten als JSON exportieren
          </button>

          <button
            className="btn btn-secondary"
            onClick={loadBackups}
            disabled={loading}
          >
            Aktualisieren
          </button>
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h3 style={{ marginTop: 0 }}>Backup hochladen</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              disabled={loading}
            />
            <button
              className="btn btn-primary"
              onClick={handleUploadBackup}
              disabled={loading || !uploadFile}
            >
              Hochladen
            </button>
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Dateiname</th>
              <th>Größe</th>
              <th>Erstellt</th>
              <th>Geändert</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {backups.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                  {loading ? 'Lade Backups...' : 'Keine Backups vorhanden'}
                </td>
              </tr>
            ) : (
              backups.map((backup) => (
                <tr key={backup.filename}>
                  <td>{backup.filename}</td>
                  <td>{formatFileSize(backup.size)}</td>
                  <td>{formatDate(backup.created)}</td>
                  <td>{formatDate(backup.modified)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        className="btn btn-small btn-secondary"
                        onClick={() => handleDownloadBackup(backup.filename)}
                        disabled={loading}
                      >
                        Download
                      </button>
                      <button
                        className="btn btn-small btn-primary"
                        onClick={() => handleRestoreBackup(backup.filename)}
                        disabled={loading}
                      >
                        Restore
                      </button>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => handleDeleteBackup(backup.filename)}
                        disabled={loading}
                      >
                        Löschen
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
  );
};
