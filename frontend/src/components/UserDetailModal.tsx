import React, { useState, useEffect, useRef } from 'react';
import { User, JobFunction } from '../types';
import api from '../services/api';
import { userService } from '../services/user.service';

interface UserDetailModalProps {
  user: User;
  onClose: () => void;
  onSave: (data: Partial<User>) => Promise<void>;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose, onSave }) => {
  const [activeSection, setActiveSection] = useState<'basic' | 'personal' | 'contact' | 'employment' | 'banking' | 'compliance'>('basic');
  const [jobFunctions, setJobFunctions] = useState<JobFunction[]>([]);
  const [allUsers, setAllUsers] = useState<Array<{ id: string; firstName: string; lastName: string; email: string }>>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user.avatarUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
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
    // Load job functions
    const loadJobFunctions = async () => {
      try {
        const response = await api.get('/job-functions');
        setJobFunctions(response.data);
      } catch (error) {
        console.error('Failed to load job functions:', error);
      }
    };
    loadJobFunctions();
  }, []);

  useEffect(() => {
    // Load all users for supervisor dropdown
    const loadUsers = async () => {
      try {
        const response = await api.get('/users/list');
        setAllUsers(response.data);
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };
    loadUsers();
  }, []);

  const [formData, setFormData] = useState({
    // Basis
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    role: user.role || 'USER',
    isActive: user.isActive ?? true,
    requiresPasswordChange: user.requiresPasswordChange ?? false,
    vacationDays: user.employeeProfile?.vacationDays || user.vacationDays || 30,
    password: '',
    
    // Personalien
    dateOfBirth: user.employeeProfile?.dateOfBirth ? user.employeeProfile.dateOfBirth.split('T')[0] : (user.dateOfBirth ? user.dateOfBirth.split('T')[0] : ''),
    placeOfBirth: user.employeeProfile?.placeOfBirth || user.placeOfBirth || '',
    nationality: user.employeeProfile?.nationality || user.nationality || 'Schweiz',
    
    // Kontakt
    phone: user.employeeProfile?.phone || user.phone || '',
    mobile: user.employeeProfile?.mobile || user.mobile || '',
    street: user.employeeProfile?.street || user.street || '',
    streetNumber: user.employeeProfile?.streetNumber || user.streetNumber || '',
    zipCode: user.employeeProfile?.zipCode || user.zipCode || '',
    city: user.employeeProfile?.city || user.city || '',
    country: user.employeeProfile?.country || user.country || 'Schweiz',
    
    // Anstellung
    employeeNumber: user.employeeProfile?.employeeNumber || user.employeeNumber || '',
    entryDate: user.employeeProfile?.entryDate ? user.employeeProfile.entryDate.split('T')[0] : (user.entryDate ? user.entryDate.split('T')[0] : ''),
    exitDate: user.employeeProfile?.exitDate ? user.employeeProfile.exitDate.split('T')[0] : (user.exitDate ? user.exitDate.split('T')[0] : ''),
    jobFunctionId: (user as any).jobFunctionId || '',
    supervisorId: user.supervisorId || '',
    
    // Bankverbindung
    iban: user.employeeProfile?.iban || user.iban || '',
    bankName: user.employeeProfile?.bankName || user.bankName || '',
    
    // Persönliche Angaben
    civilStatus: user.employeeProfile?.civilStatus || user.civilStatus || '',
    religion: user.employeeProfile?.religion || user.religion || '',
    
    // Sozialversicherung
    ahvNumber: user.employeeProfile?.ahvNumber || user.ahvNumber || '',
    isCrossBorderCommuter: user.employeeProfile?.isCrossBorderCommuter || user.isCrossBorderCommuter || false,
    
    // Swiss Compliance
    weeklyHours: user.employeeProfile?.weeklyHours || user.weeklyHours || 45,
    canton: user.employeeProfile?.canton || user.canton || 'ZH',
    exemptFromTracking: user.employeeProfile?.exemptFromTracking || user.exemptFromTracking || false,
    contractHours: user.employeeProfile?.contractHours || user.contractHours || 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validiere erforderliche Felder
    if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.email?.trim()) {
      alert('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }
    
    const dataToSend: any = { ...formData };
    
    // supervisorId: leerer String → null senden (Vorgesetzter entfernen)
    if (dataToSend.supervisorId === '') {
      dataToSend.supervisorId = null;
    }
    
    // Leere Felder entfernen (außer supervisorId, da null explizit gewollt)
    Object.keys(dataToSend).forEach(key => {
      if (key === 'supervisorId') return;
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const result = await userService.uploadAvatar(user.id, file);
      setAvatarUrl(result.avatarUrl);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Hochladen des Avatars');
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleAvatarDelete = async () => {
    if (!window.confirm('Avatar wirklich löschen?')) return;
    try {
      await userService.deleteAvatar(user.id);
      setAvatarUrl(undefined);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Löschen des Avatars');
    }
  };

  const getAvatarSrc = (url: string) => {
    // Build full URL from backend
    const backendUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || window.location.origin;
    return `${backendUrl}/${url}`;
  };

  const renderBasicInfo = () => (
    <>
      {/* Avatar Upload */}
      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <div
          onClick={() => avatarInputRef.current?.click()}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: avatarUrl ? 'transparent' : '#e3f2fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: avatarUrl ? '0' : '28px',
            fontWeight: 600,
            color: '#1565c0',
            cursor: 'pointer',
            border: '2px dashed #ccc',
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
          }}
          title="Klicken zum Ändern"
        >
          {avatarUrl ? (
            <img src={getAvatarSrc(avatarUrl)} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
          )}
          {avatarUploading && (
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
              ⏳
            </div>
          )}
        </div>
        <div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: 'none' }}
            onChange={handleAvatarUpload}
          />
          <button type="button" className="btn btn-small" onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading}>
            📷 Avatar hochladen
          </button>
          {avatarUrl && (
            <button type="button" className="btn btn-small btn-danger" style={{ marginLeft: '8px' }} onClick={handleAvatarDelete}>
              Entfernen
            </button>
          )}
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#999' }}>
            Wird automatisch auf 200×200px zugeschnitten
          </p>
        </div>
      </div>

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
        <label>
          <input
            type="checkbox"
            checked={formData.requiresPasswordChange}
            onChange={(e) => setFormData({ ...formData, requiresPasswordChange: e.target.checked })}
          />
          {' '}Passwort ändern erforderlich
        </label>
        <small style={{ display: 'block', color: '#666', fontSize: '12px', marginTop: '4px' }}>
          Benutzer muss beim nächsten Login das Passwort ändern
        </small>
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
        <label>Funktion</label>
        <select
          value={formData.jobFunctionId}
          onChange={(e) => setFormData({ ...formData, jobFunctionId: e.target.value })}
        >
          <option value="">Keine Funktion zugewiesen</option>
          {jobFunctions.filter(jf => jf.isActive).map((jf) => (
            <option key={jf.id} value={jf.id}>
              {jf.title} {jf.department ? `(${jf.department})` : ''}
            </option>
          ))}
        </select>
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
      <div className="form-group">
        <label>Vorgesetzte/r</label>
        <select
          value={formData.supervisorId}
          onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
        >
          <option value="">Kein Vorgesetzter</option>
          {allUsers
            .filter(u => u.id !== user.id)
            .map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName} ({u.email})
              </option>
            ))}
        </select>
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
