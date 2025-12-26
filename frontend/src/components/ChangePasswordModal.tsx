import React, { useState } from 'react';
import '../styles/ChangePasswordModal.css';

interface ChangePasswordModalProps {
  isFirstLogin: boolean;
  onPasswordChanged: () => void;
  onCancel?: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isFirstLogin,
  onPasswordChanged,
  onCancel
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Bitte füllen Sie alle Felder aus');
      return;
    }

    if (newPassword.length < 6) {
      setError('Das neue Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Die neuen Passwörter stimmen nicht überein');
      return;
    }

    if (currentPassword === newPassword) {
      setError('Das neue Passwort muss sich vom aktuellen unterscheiden');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Ändern des Passworts');
      }

      // Success
      alert('Passwort erfolgreich geändert!');
      onPasswordChanged();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Ändern des Passworts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-modal-overlay">
      <div className="change-password-modal">
        <div className="change-password-header">
          <h2>
            {isFirstLogin ? (
              <>
                <span className="warning-icon">⚠️</span> Passwort ändern erforderlich
              </>
            ) : (
              'Passwort ändern'
            )}
          </h2>
          {!isFirstLogin && onCancel && (
            <button className="close-button" onClick={onCancel} aria-label="Schließen">
              ×
            </button>
          )}
        </div>

        {isFirstLogin && (
          <div className="first-login-notice">
            <p>
              <strong>Aus Sicherheitsgründen müssen Sie Ihr Passwort ändern, bevor Sie fortfahren können.</strong>
            </p>
            <p>Dies ist Ihre erste Anmeldung. Bitte wählen Sie ein sicheres, neues Passwort.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="change-password-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="currentPassword">
              Aktuelles Passwort {isFirstLogin && <span className="hint">(admin123)</span>}
            </label>
            <div className="password-input-wrapper">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                tabIndex={-1}
              >
                {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">Neues Passwort</label>
            <div className="password-input-wrapper">
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowNewPassword(!showNewPassword)}
                tabIndex={-1}
              >
                {showNewPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <small className="password-hint">Mindestens 6 Zeichen</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Neues Passwort bestätigen</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Wird geändert...' : 'Passwort ändern'}
            </button>
            {!isFirstLogin && onCancel && (
              <button
                type="button"
                className="btn-secondary"
                onClick={onCancel}
                disabled={loading}
              >
                Abbrechen
              </button>
            )}
          </div>
        </form>

        {isFirstLogin && (
          <div className="security-tips">
            <h3>💡 Tipps für ein sicheres Passwort:</h3>
            <ul>
              <li>Verwenden Sie mindestens 8 Zeichen</li>
              <li>Kombinieren Sie Groß- und Kleinbuchstaben</li>
              <li>Fügen Sie Zahlen und Sonderzeichen hinzu</li>
              <li>Verwenden Sie kein Passwort, das Sie bereits woanders nutzen</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
