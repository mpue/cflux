import React, { useState, useEffect } from 'react';
import { systemSettingsService, SystemSettings } from '../../services/systemSettings.service';
import './SystemSettingsTab.css';

const SystemSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'company' | 'system' | 'backup' | 'email' | 'invoice' | 'features'>('company');
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await systemSettingsService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await systemSettingsService.updateSettings(settings);
      alert('Einstellungen erfolgreich gespeichert');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const updated = await systemSettingsService.uploadLogo(base64);
        setSettings(updated);
        alert('Logo erfolgreich hochgeladen');
      } catch (error: any) {
        alert(error.response?.data?.error || 'Fehler beim Hochladen');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTestEmail = async () => {
    if (!settings || !testEmailRecipient) {
      alert('Bitte geben Sie eine Test-E-Mail-Adresse ein');
      return;
    }

    setTestingEmail(true);
    try {
      const result = await systemSettingsService.testEmailSettings({
        smtpHost: settings.smtpHost || '',
        smtpPort: settings.smtpPort,
        smtpSecure: settings.smtpSecure,
        smtpUser: settings.smtpUser || '',
        smtpPassword: settings.smtpPassword || '',
        smtpFromEmail: settings.smtpFromEmail || '',
        smtpFromName: settings.smtpFromName || '',
        testRecipient: testEmailRecipient,
      });

      if (result.success) {
        alert('✅ ' + result.message);
      } else {
        alert('❌ ' + result.message);
      }
    } catch (error: any) {
      alert('Fehler beim Testen: ' + (error.response?.data?.error || error.message));
    } finally {
      setTestingEmail(false);
    }
  };

  const handleChange = (field: keyof SystemSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return <div className="settings-loading">Lade Einstellungen...</div>;
  }

  if (!settings) {
    return <div className="settings-error">Fehler beim Laden der Einstellungen</div>;
  }

  return (
    <div className="system-settings-tab">
      <div className="settings-header">
        <h2>System-Einstellungen</h2>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Speichern...' : '💾 Einstellungen speichern'}
        </button>
      </div>

      <div className="settings-navigation">
        <button
          className={`nav-btn ${activeSection === 'company' ? 'active' : ''}`}
          onClick={() => setActiveSection('company')}
        >
          🏢 Firmendaten
        </button>
        <button
          className={`nav-btn ${activeSection === 'system' ? 'active' : ''}`}
          onClick={() => setActiveSection('system')}
        >
          ⚙️ System
        </button>
        <button
          className={`nav-btn ${activeSection === 'backup' ? 'active' : ''}`}
          onClick={() => setActiveSection('backup')}
        >
          💾 Backup
        </button>
        <button
          className={`nav-btn ${activeSection === 'email' ? 'active' : ''}`}
          onClick={() => setActiveSection('email')}
        >
          📧 E-Mail
        </button>
        <button
          className={`nav-btn ${activeSection === 'invoice' ? 'active' : ''}`}
          onClick={() => setActiveSection('invoice')}
        >
          🧾 Rechnungen
        </button>
        <button
          className={`nav-btn ${activeSection === 'features' ? 'active' : ''}`}
          onClick={() => setActiveSection('features')}
        >
          🎛️ Features
        </button>
      </div>

      <div className="settings-content">
        {activeSection === 'company' && (
          <div className="settings-section">
            <h3>Firmendaten</h3>

            <div className="form-group">
              <label>Firmenname</label>
              <input
                type="text"
                value={settings.companyName || ''}
                onChange={(e) => handleChange('companyName', e.target.value)}
                placeholder="z.B. Musterfirma GmbH"
              />
            </div>

            <div className="form-group">
              <label>Firmenlogo</label>
              <div className="logo-upload">
                {settings.companyLogo && (
                  <div className="logo-preview">
                    <img src={settings.companyLogo} alt="Logo" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
                <p className="form-help">Empfohlen: PNG mit transparentem Hintergrund, max. 500x200px</p>
              </div>
            </div>

            <div className="form-group">
              <label>Adresse</label>
              <textarea
                value={settings.companyAddress || ''}
                onChange={(e) => handleChange('companyAddress', e.target.value)}
                placeholder="Straße, Nr.&#10;PLZ Ort&#10;Land"
                rows={4}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Telefon</label>
                <input
                  type="text"
                  value={settings.companyPhone || ''}
                  onChange={(e) => handleChange('companyPhone', e.target.value)}
                  placeholder="+41 44 123 45 67"
                />
              </div>

              <div className="form-group">
                <label>E-Mail</label>
                <input
                  type="email"
                  value={settings.companyEmail || ''}
                  onChange={(e) => handleChange('companyEmail', e.target.value)}
                  placeholder="info@firma.ch"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Website</label>
                <input
                  type="text"
                  value={settings.companyWebsite || ''}
                  onChange={(e) => handleChange('companyWebsite', e.target.value)}
                  placeholder="www.firma.ch"
                />
              </div>

              <div className="form-group">
                <label>Steuernummer / UID</label>
                <input
                  type="text"
                  value={settings.companyTaxId || ''}
                  onChange={(e) => handleChange('companyTaxId', e.target.value)}
                  placeholder="CHE-123.456.789 MWST"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'system' && (
          <div className="settings-section">
            <h3>System-Einstellungen</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Währung</label>
                <select
                  value={settings.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                >
                  <option value="CHF">CHF - Schweizer Franken</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="USD">USD - US-Dollar</option>
                  <option value="GBP">GBP - Britisches Pfund</option>
                </select>
              </div>

              <div className="form-group">
                <label>Sprache</label>
                <select
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                >
                  <option value="de">Deutsch</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="it">Italiano</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Datumsformat</label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => handleChange('dateFormat', e.target.value)}
                >
                  <option value="DD.MM.YYYY">DD.MM.YYYY (31.12.2025)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Zeitformat</label>
                <select
                  value={settings.timeFormat}
                  onChange={(e) => handleChange('timeFormat', e.target.value)}
                >
                  <option value="HH:mm">24 Stunden (14:30)</option>
                  <option value="hh:mm A">12 Stunden (02:30 PM)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Zeitzone</label>
              <select
                value={settings.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
              >
                <option value="Europe/Zurich">Europe/Zurich (CET/CEST)</option>
                <option value="Europe/Berlin">Europe/Berlin (CET/CEST)</option>
                <option value="Europe/Vienna">Europe/Vienna (CET/CEST)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
              </select>
            </div>
          </div>
        )}

        {activeSection === 'backup' && (
          <div className="settings-section">
            <h3>Backup-Einstellungen</h3>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.autoBackupEnabled}
                  onChange={(e) => handleChange('autoBackupEnabled', e.target.checked)}
                />
                Automatisches Backup aktivieren
              </label>
            </div>

            {settings.autoBackupEnabled && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Intervall</label>
                    <select
                      value={settings.backupInterval}
                      onChange={(e) => handleChange('backupInterval', e.target.value)}
                    >
                      <option value="daily">Täglich</option>
                      <option value="weekly">Wöchentlich</option>
                      <option value="monthly">Monatlich</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Uhrzeit</label>
                    <input
                      type="time"
                      value={settings.backupTime}
                      onChange={(e) => handleChange('backupTime', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Aufbewahrungsdauer (Tage)</label>
                  <input
                    type="number"
                    value={settings.backupRetention}
                    onChange={(e) => handleChange('backupRetention', parseInt(e.target.value))}
                    min="1"
                    max="365"
                  />
                  <p className="form-help">Backups älter als diese Anzahl Tage werden automatisch gelöscht</p>
                </div>
              </>
            )}

            {settings.lastBackupAt && (
              <div className="info-box">
                <strong>Letztes Backup:</strong>{' '}
                {new Date(settings.lastBackupAt).toLocaleString('de-CH')}
              </div>
            )}
          </div>
        )}

        {activeSection === 'email' && (
          <div className="settings-section">
            <h3>E-Mail-Einstellungen (SMTP)</h3>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.smtpEnabled}
                  onChange={(e) => handleChange('smtpEnabled', e.target.checked)}
                />
                E-Mail-Versand aktivieren
              </label>
            </div>

            {settings.smtpEnabled && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>SMTP Server</label>
                    <input
                      type="text"
                      value={settings.smtpHost || ''}
                      onChange={(e) => handleChange('smtpHost', e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div className="form-group">
                    <label>Port</label>
                    <input
                      type="number"
                      value={settings.smtpPort}
                      onChange={(e) => handleChange('smtpPort', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.smtpSecure}
                      onChange={(e) => handleChange('smtpSecure', e.target.checked)}
                    />
                    Sichere Verbindung (TLS/SSL)
                  </label>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Benutzername</label>
                    <input
                      type="text"
                      value={settings.smtpUser || ''}
                      onChange={(e) => handleChange('smtpUser', e.target.value)}
                      placeholder="user@example.com"
                    />
                  </div>

                  <div className="form-group">
                    <label>Passwort</label>
                    <input
                      type="password"
                      value={settings.smtpPassword || ''}
                      onChange={(e) => handleChange('smtpPassword', e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Absender E-Mail</label>
                    <input
                      type="email"
                      value={settings.smtpFromEmail || ''}
                      onChange={(e) => handleChange('smtpFromEmail', e.target.value)}
                      placeholder="noreply@firma.ch"
                    />
                  </div>

                  <div className="form-group">
                    <label>Absender Name</label>
                    <input
                      type="text"
                      value={settings.smtpFromName || ''}
                      onChange={(e) => handleChange('smtpFromName', e.target.value)}
                      placeholder="Musterfirma"
                    />
                  </div>
                </div>

                <div className="email-test">
                  <h4>E-Mail-Konfiguration testen</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Test-Empfänger</label>
                      <input
                        type="email"
                        value={testEmailRecipient}
                        onChange={(e) => setTestEmailRecipient(e.target.value)}
                        placeholder="test@example.com"
                      />
                    </div>
                    <div className="form-group">
                      <label>&nbsp;</label>
                      <button
                        className="btn-secondary"
                        onClick={handleTestEmail}
                        disabled={testingEmail}
                      >
                        {testingEmail ? 'Sende...' : '📧 Test-E-Mail senden'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeSection === 'invoice' && (
          <div className="settings-section">
            <h3>Rechnungs-Einstellungen</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Rechnungs-Präfix</label>
                <input
                  type="text"
                  value={settings.invoicePrefix}
                  onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                  placeholder="RE-"
                />
                <p className="form-help">z.B. "RE-" für RE-2025-0001</p>
              </div>

              <div className="form-group">
                <label>Startnummer</label>
                <input
                  type="number"
                  value={settings.invoiceNumberStart}
                  onChange={(e) => handleChange('invoiceNumberStart', parseInt(e.target.value))}
                  min="1"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Stellen (Padding)</label>
                <input
                  type="number"
                  value={settings.invoiceNumberPadding}
                  onChange={(e) => handleChange('invoiceNumberPadding', parseInt(e.target.value))}
                  min="1"
                  max="10"
                />
                <p className="form-help">Anzahl Stellen: 4 = 0001, 5 = 00001</p>
              </div>

              <div className="form-group">
                <label>Zahlungsziel (Tage)</label>
                <input
                  type="number"
                  value={settings.invoiceTermsDays}
                  onChange={(e) => handleChange('invoiceTermsDays', parseInt(e.target.value))}
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Rechnungs-Fußzeile</label>
              <textarea
                value={settings.invoiceFooter || ''}
                onChange={(e) => handleChange('invoiceFooter', e.target.value)}
                placeholder="Text für die Fußzeile auf Rechnungen..."
                rows={5}
              />
            </div>
          </div>
        )}

        {activeSection === 'features' && (
          <div className="settings-section">
            <h3>Feature-Verwaltung</h3>
            <p className="section-description">Aktiviere oder deaktiviere einzelne Module</p>

            <div className="feature-toggles">
              <div className="feature-toggle">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.enableTimeTracking}
                    onChange={(e) => handleChange('enableTimeTracking', e.target.checked)}
                  />
                  <div className="feature-info">
                    <strong>⏱️ Zeiterfassung</strong>
                    <span>Erfassung von Arbeitszeiten und Projekten</span>
                  </div>
                </label>
              </div>

              <div className="feature-toggle">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.enableWorkflows}
                    onChange={(e) => handleChange('enableWorkflows', e.target.checked)}
                  />
                  <div className="feature-info">
                    <strong>🔄 Workflows</strong>
                    <span>Automatisierte Genehmigungsprozesse</span>
                  </div>
                </label>
              </div>

              <div className="feature-toggle">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.enableIncidents}
                    onChange={(e) => handleChange('enableIncidents', e.target.checked)}
                  />
                  <div className="feature-info">
                    <strong>🚨 Incident Management</strong>
                    <span>Verwaltung von Vorfällen und Problemen</span>
                  </div>
                </label>
              </div>

              <div className="feature-toggle">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.enableCompliance}
                    onChange={(e) => handleChange('enableCompliance', e.target.checked)}
                  />
                  <div className="feature-info">
                    <strong>🇨🇭 Swiss Compliance</strong>
                    <span>Überwachung gesetzlicher Vorschriften</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="settings-footer">
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Speichern...' : '💾 Einstellungen speichern'}
        </button>
      </div>
    </div>
  );
};

export default SystemSettingsTab;
