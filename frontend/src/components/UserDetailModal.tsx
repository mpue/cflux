import React, { useState } from 'react';
import { User } from '../types';

interface UserDetailModalProps {
  user: User;
  onClose: () => void;
  onSave: (data: Partial<User>) => Promise<void>;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose, onSave }) => {
  const [activeSection, setActiveSection] = useState<'basic' | 'personal' | 'contact' | 'employment' | 'banking' | 'compliance'>('basic');
  const [formData, setFormData] = useState({
    // Basis
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    role: user.role || 'USER',
    isActive: user.isActive ?? true,
    vacationDays: user.vacationDays || 30,
    password: '',
    
    // Personalien
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
    placeOfBirth: user.placeOfBirth || '',
    nationality: user.nationality || 'Schweiz',
    
    // Kontakt
    phone: user.phone || '',
    mobile: user.mobile || '',
    street: user.street || '',
    streetNumber: user.streetNumber || '',
    zipCode: user.zipCode || '',
    city: user.city || '',
    country: user.country || 'Schweiz',
    
    // Anstellung
    employeeNumber: user.employeeNumber || '',
    entryDate: user.entryDate ? user.entryDate.split('T')[0] : '',
    exitDate: user.exitDate ? user.exitDate.split('T')[0] : '',
    
    // Bankverbindung
    iban: user.iban || '',
    bankName: user.bankName || '',
    
    // Persönliche Angaben
    civilStatus: user.civilStatus || '',
    religion: user.religion || '',
    
    // Sozialversicherung
    ahvNumber: user.ahvNumber || '',
    isCrossBorderCommuter: user.isCrossBorderCommuter || false,
    
    // Swiss Compliance
    weeklyHours: user.weeklyHours || 45,
    canton: user.canton || 'ZH',
    exemptFromTracking: user.exemptFromTracking || false,
    contractHours: user.contractHours || 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSend: any = { ...formData };
    
    // Leere Felder entfernen
    Object.keys(dataToSend).forEach(key => {
      if (dataToSend[key] === '' || dataToSend[key] === null) {
        delete dataToSend[key];
      }
    });
    
    // Passwort nur senden wenn gesetzt
    if (!dataToSend.password || dataToSend.password.length < 6) {
      delete dataToSend.password;
    }
    
    await onSave(dataToSend);
  };

  const renderBasicInfo = () => (
    <>
      <div className="form-group">
        <label>Vorname *</label>
        <input
          type="text"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          required
        />
      </div>
      <div className="form-group">
        <label>Nachname *</label>
        <input
          type="text"
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          required
        />
      </div>
      <div className="form-group">
        <label>E-Mail *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      <div className="form-group">
        <label>Neues Passwort (mindestens 6 Zeichen)</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Leer lassen für keine Änderung"
        />
      </div>
      <div className="form-group">
        <label>Rolle</label>
        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'USER' })}
        >
          <option value="USER">Benutzer</option>
          <option value="ADMIN">Administrator</option>
        </select>
      </div>
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          />
          {' '}Aktiv
        </label>
      </div>
      <div className="form-group">
        <label>Urlaubstage pro Jahr</label>
        <input
          type="number"
          step="0.5"
          value={formData.vacationDays}
          onChange={(e) => setFormData({ ...formData, vacationDays: parseFloat(e.target.value) })}
        />
      </div>
    </>
  );

  const renderPersonalInfo = () => (
    <>
      <div className="form-group">
        <label>Geburtsdatum</label>
        <input
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Geburtsort</label>
        <input
          type="text"
          value={formData.placeOfBirth}
          onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Nationalität</label>
        <input
          type="text"
          value={formData.nationality}
          onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Zivilstand</label>
        <select
          value={formData.civilStatus}
          onChange={(e) => setFormData({ ...formData, civilStatus: e.target.value })}
        >
          <option value="">Bitte wählen</option>
          <option value="ledig">ledig</option>
          <option value="verheiratet">verheiratet</option>
          <option value="geschieden">geschieden</option>
          <option value="verwitwet">verwitwet</option>
          <option value="eingetragene_partnerschaft">eingetragene Partnerschaft</option>
        </select>
      </div>
      <div className="form-group">
        <label>Konfession</label>
        <select
          value={formData.religion}
          onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
        >
          <option value="">Bitte wählen</option>
          <option value="roemisch-katholisch">römisch-katholisch</option>
          <option value="evangelisch-reformiert">evangelisch-reformiert</option>
          <option value="christkatholisch">christkatholisch</option>
          <option value="andere">andere</option>
          <option value="keine">keine</option>
        </select>
      </div>
      <div className="form-group">
        <label>AHV-Nummer (Format: 756.XXXX.XXXX.XX)</label>
        <input
          type="text"
          value={formData.ahvNumber}
          onChange={(e) => setFormData({ ...formData, ahvNumber: e.target.value })}
          placeholder="756.1234.5678.90"
        />
      </div>
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={formData.isCrossBorderCommuter}
            onChange={(e) => setFormData({ ...formData, isCrossBorderCommuter: e.target.checked })}
          />
          {' '}Grenzgänger
        </label>
      </div>
    </>
  );

  const renderContactInfo = () => (
    <>
      <div className="form-group">
        <label>Telefon</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Mobile</label>
        <input
          type="tel"
          value={formData.mobile}
          onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '10px' }}>
        <div className="form-group">
          <label>Strasse</label>
          <input
            type="text"
            value={formData.street}
            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Nr.</label>
          <input
            type="text"
            value={formData.streetNumber}
            onChange={(e) => setFormData({ ...formData, streetNumber: e.target.value })}
          />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
        <div className="form-group">
          <label>PLZ</label>
          <input
            type="text"
            value={formData.zipCode}
            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Ort</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
        </div>
      </div>
      <div className="form-group">
        <label>Land</label>
        <input
          type="text"
          value={formData.country}
          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
        />
      </div>
    </>
  );

  const renderEmploymentInfo = () => (
    <>
      <div className="form-group">
        <label>Personalnummer</label>
        <input
          type="text"
          value={formData.employeeNumber}
          onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Eintrittsdatum</label>
        <input
          type="date"
          value={formData.entryDate}
          onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Austrittsdatum</label>
        <input
          type="date"
          value={formData.exitDate}
          onChange={(e) => setFormData({ ...formData, exitDate: e.target.value })}
        />
      </div>
    </>
  );

  const renderBankingInfo = () => (
    <>
      <div className="form-group">
        <label>IBAN</label>
        <input
          type="text"
          value={formData.iban}
          onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
          placeholder="CH93 0076 2011 6238 5295 7"
        />
      </div>
      <div className="form-group">
        <label>Bankname</label>
        <input
          type="text"
          value={formData.bankName}
          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
        />
      </div>
    </>
  );

  const renderComplianceInfo = () => (
    <>
      <div className="form-group">
        <label>Wöchentliche Höchstarbeitszeit</label>
        <select
          value={formData.weeklyHours}
          onChange={(e) => setFormData({ ...formData, weeklyHours: parseInt(e.target.value) })}
        >
          <option value="45">45 Stunden (Standard)</option>
          <option value="50">50 Stunden</option>
        </select>
        <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
          Gesetzliche Höchstarbeitszeit pro Woche (Art. 9 ArG)
        </small>
      </div>
      
      <div className="form-group">
        <label>Vertragliche Wochenstunden</label>
        <input
          type="number"
          step="0.5"
          value={formData.contractHours || ''}
          onChange={(e) => setFormData({ ...formData, contractHours: parseFloat(e.target.value) || 0 })}
          placeholder="z.B. 42 oder 40"
        />
        <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
          Für Überstunden-Berechnung (Differenz zur gesetzlichen Höchstarbeitszeit)
        </small>
      </div>

      <div className="form-group">
        <label>Kanton</label>
        <select
          value={formData.canton}
          onChange={(e) => setFormData({ ...formData, canton: e.target.value })}
        >
          <option value="ZH">Zürich</option>
          <option value="BE">Bern</option>
          <option value="LU">Luzern</option>
          <option value="UR">Uri</option>
          <option value="SZ">Schwyz</option>
          <option value="OW">Obwalden</option>
          <option value="NW">Nidwalden</option>
          <option value="GL">Glarus</option>
          <option value="ZG">Zug</option>
          <option value="FR">Freiburg</option>
          <option value="SO">Solothurn</option>
          <option value="BS">Basel-Stadt</option>
          <option value="BL">Basel-Landschaft</option>
          <option value="SH">Schaffhausen</option>
          <option value="AR">Appenzell Ausserrhoden</option>
          <option value="AI">Appenzell Innerrhoden</option>
          <option value="SG">St. Gallen</option>
          <option value="GR">Graubünden</option>
          <option value="AG">Aargau</option>
          <option value="TG">Thurgau</option>
          <option value="TI">Tessin</option>
          <option value="VD">Waadt</option>
          <option value="VS">Wallis</option>
          <option value="NE">Neuenburg</option>
          <option value="GE">Genf</option>
          <option value="JU">Jura</option>
        </select>
        <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
          Relevant für kantonale Feiertage
        </small>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={formData.exemptFromTracking}
            onChange={(e) => setFormData({ ...formData, exemptFromTracking: e.target.checked })}
          />
          {' '}Von Zeiterfassung befreit
        </label>
        <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
          Für leitende Angestellte oder bei Jahresgehalt &gt; 120'000 CHF (Art. 73a ArGV 1)
        </small>
      </div>
    </>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <h2>Benutzer bearbeiten: {user.firstName} {user.lastName}</h2>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #ddd', overflowX: 'auto' }}>
          <button
            type="button"
            onClick={() => setActiveSection('basic')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'none',
              borderBottom: activeSection === 'basic' ? '3px solid #007bff' : 'none',
              color: activeSection === 'basic' ? '#007bff' : '#666',
              fontWeight: activeSection === 'basic' ? 'bold' : 'normal',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Basis
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('personal')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'none',
              borderBottom: activeSection === 'personal' ? '3px solid #007bff' : 'none',
              color: activeSection === 'personal' ? '#007bff' : '#666',
              fontWeight: activeSection === 'personal' ? 'bold' : 'normal',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Personalien
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('contact')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'none',
              borderBottom: activeSection === 'contact' ? '3px solid #007bff' : 'none',
              color: activeSection === 'contact' ? '#007bff' : '#666',
              fontWeight: activeSection === 'contact' ? 'bold' : 'normal',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Kontakt
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('employment')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'none',
              borderBottom: activeSection === 'employment' ? '3px solid #007bff' : 'none',
              color: activeSection === 'employment' ? '#007bff' : '#666',
              fontWeight: activeSection === 'employment' ? 'bold' : 'normal',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Anstellung
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('banking')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'none',
              borderBottom: activeSection === 'banking' ? '3px solid #007bff' : 'none',
              color: activeSection === 'banking' ? '#007bff' : '#666',
              fontWeight: activeSection === 'banking' ? 'bold' : 'normal',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Bankverbindung
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('compliance')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'none',
              borderBottom: activeSection === 'compliance' ? '3px solid #007bff' : 'none',
              color: activeSection === 'compliance' ? '#007bff' : '#666',
              fontWeight: activeSection === 'compliance' ? 'bold' : 'normal',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            🇨🇭 Compliance
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {activeSection === 'basic' && renderBasicInfo()}
          {activeSection === 'personal' && renderPersonalInfo()}
          {activeSection === 'contact' && renderContactInfo()}
          {activeSection === 'employment' && renderEmploymentInfo()}
          {activeSection === 'banking' && renderBankingInfo()}
          {activeSection === 'compliance' && renderComplianceInfo()}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="btn btn-primary">
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
