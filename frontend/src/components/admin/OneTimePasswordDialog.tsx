import React, { useState } from 'react';
import { User } from '../../types';
import { userService, OneTimePasswordResult } from '../../services/user.service';
import { BaseModal } from '../common/BaseModal';

interface OneTimePasswordDialogProps {
  user: User;
  onClose: () => void;
  /** Wird nach erfolgreicher Zurücksetzung aufgerufen, damit die Liste neu lädt. */
  onDone: () => void;
}

/**
 * Zweistufiger Dialog: erst bestätigen, dann Ergebnis anzeigen.
 *
 * Die Bestätigung ist wichtig, weil das bisherige Passwort des Benutzers sofort
 * ungültig wird — der Vorgang lässt sich nicht rückgängig machen.
 */
export const OneTimePasswordDialog: React.FC<OneTimePasswordDialogProps> = ({
  user,
  onClose,
  onDone,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OneTimePasswordResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await userService.sendOneTimePassword(user.id);
      setResult(data);
      onDone();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Einmal-Passwort konnte nicht erzeugt werden');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result.password);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = result.password;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <BaseModal isOpen onClose={onClose} maxWidth="520px">
      <h2>🔑 Einmal-Passwort senden</h2>

      {!result ? (
        <>
          <p>
            Für <strong>{user.firstName} {user.lastName}</strong> wird ein neues
            Einmal-Passwort erzeugt und an <strong>{user.email}</strong> gesendet.
          </p>

          <div
            style={{
              background: '#fffbeb',
              borderLeft: '4px solid #f59e0b',
              padding: '12px',
              borderRadius: '4px',
              margin: '16px 0',
              fontSize: '14px',
              color: '#92400e',
            }}
          >
            Das bisherige Passwort wird dabei sofort ungültig. Beim nächsten Login muss
            der Benutzer ein eigenes Passwort vergeben.
          </div>

          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Abbrechen
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSend} disabled={loading}>
              {loading ? 'Wird gesendet …' : 'Passwort erzeugen und senden'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              background: result.emailSent ? '#ecfdf5' : '#fffbeb',
              border: `1px solid ${result.emailSent ? '#a7f3d0' : '#fcd34d'}`,
              color: result.emailSent ? '#047857' : '#92400e',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
            }}
          >
            {result.emailSent ? (
              <>Das Einmal-Passwort wurde an <strong>{result.email}</strong> gesendet.</>
            ) : (
              <>
                <strong>Der Mailversand hat nicht funktioniert.</strong>
                <div style={{ marginTop: '4px' }}>
                  {result.emailError
                    ? result.emailError
                    : 'Vermutlich ist SMTP in den Systemeinstellungen nicht konfiguriert.'}
                </div>
                <div style={{ marginTop: '6px' }}>
                  Das Passwort ist trotzdem gesetzt — bitte unten ablesen und dem Benutzer
                  persönlich mitteilen.
                </div>
              </>
            )}
          </div>

          <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
            Einmal-Passwort
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
            <code
              style={{
                flex: 1,
                padding: '12px',
                background: '#f3f4f6',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '16px',
                letterSpacing: '1px',
                wordBreak: 'break-all',
                color: '#111827',
              }}
            >
              {result.password}
            </code>
            <button type="button" className="btn btn-secondary" onClick={handleCopy}>
              {copied ? '✓ Kopiert' : 'Kopieren'}
            </button>
          </div>

          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '12px' }}>
            Das Passwort lässt sich nur jetzt ablesen — es wird nirgends im Klartext
            gespeichert. Eine Systemnachricht im Postfach des Benutzers hält den Vorgang
            fest, enthält aber kein Passwort.
          </p>

          <div className="modal-actions">
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Fertig
            </button>
          </div>
        </>
      )}
    </BaseModal>
  );
};

export default OneTimePasswordDialog;
