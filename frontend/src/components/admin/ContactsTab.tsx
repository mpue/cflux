import React, { useState } from 'react';
import {
  Contact,
  ContactGroup,
  contactService,
} from '../../services/contact.service';
import { UserGroup } from '../../services/userGroup.service';

interface ContactsTabProps {
  contacts: Contact[];
  contactGroups: ContactGroup[];
  userGroups: UserGroup[];
  onUpdate: () => void;
}

const CATEGORIES = ['Kunde', 'Lieferant', 'Partner', 'Behörde', 'Intern', 'Sonstiges'];

const emptyForm = {
  firstName: '',
  lastName: '',
  company: '',
  position: '',
  email: '',
  phone: '',
  mobile: '',
  street: '',
  zipCode: '',
  city: '',
  country: '',
  category: '',
  notes: '',
  contactGroupId: '',
};

export const ContactsTab: React.FC<ContactsTabProps> = ({
  contacts,
  contactGroups,
  userGroups,
  onUpdate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');

  // Mitarbeiter-Synchronisation
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncGroupId, setSyncGroupId] = useState('');
  const [syncing, setSyncing] = useState(false);

  // Kontaktgruppen-Verwaltung
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    color: '#3498db',
    userGroupIds: [] as string[],
  });

  // ===== Kontakt CRUD =====
  const handleOpenModal = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        company: contact.company || '',
        position: contact.position || '',
        email: contact.email || '',
        phone: contact.phone || '',
        mobile: contact.mobile || '',
        street: contact.street || '',
        zipCode: contact.zipCode || '',
        city: contact.city || '',
        country: contact.country || '',
        category: contact.category || '',
        notes: contact.notes || '',
        contactGroupId: contact.contactGroupId || '',
      });
    } else {
      setEditingContact(null);
      setFormData({ ...emptyForm });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<Contact> = {
        ...formData,
        company: formData.company || undefined,
        position: formData.position || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        mobile: formData.mobile || undefined,
        street: formData.street || undefined,
        zipCode: formData.zipCode || undefined,
        city: formData.city || undefined,
        country: formData.country || undefined,
        category: formData.category || undefined,
        notes: formData.notes || undefined,
        contactGroupId: formData.contactGroupId || undefined,
      };

      if (editingContact) {
        await contactService.updateContact(editingContact.id, payload);
      } else {
        await contactService.createContact(payload);
      }
      handleCloseModal();
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Speichern des Kontakts');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchten Sie diesen Kontakt wirklich löschen?')) return;
    try {
      await contactService.deleteContact(id);
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Löschen des Kontakts');
    }
  };

  // ===== Kontaktgruppen CRUD =====
  const handleOpenGroupForm = (group?: ContactGroup) => {
    if (group) {
      setEditingGroup(group);
      setGroupForm({
        name: group.name,
        description: group.description || '',
        color: group.color || '#3498db',
        userGroupIds: (group.visibleToGroups || []).map((g) => g.id),
      });
    } else {
      setEditingGroup(null);
      setGroupForm({ name: '', description: '', color: '#3498db', userGroupIds: [] });
    }
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        await contactService.updateContactGroup(editingGroup.id, groupForm);
      } else {
        await contactService.createContactGroup(groupForm);
      }
      setEditingGroup(null);
      setGroupForm({ name: '', description: '', color: '#3498db', userGroupIds: [] });
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Speichern der Kontaktgruppe');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!window.confirm('Kontaktgruppe wirklich löschen? Die Kontakte bleiben erhalten.')) return;
    try {
      await contactService.deleteContactGroup(id);
      if (editingGroup?.id === id) setEditingGroup(null);
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Löschen der Kontaktgruppe');
    }
  };

  // ===== Mitarbeiter synchronisieren =====
  const handleSync = async () => {
    if (!syncGroupId) {
      alert('Bitte eine Ziel-Kontaktgruppe auswählen');
      return;
    }
    setSyncing(true);
    try {
      const { result } = await contactService.syncEmployees(syncGroupId);
      alert(
        `Synchronisation abgeschlossen:\n` +
          `Neu angelegt: ${result.created}\n` +
          `Aktualisiert: ${result.updated}`
      );
      setIsSyncModalOpen(false);
      setSyncGroupId('');
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler bei der Mitarbeiter-Synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const toggleUserGroup = (groupId: string) => {
    setGroupForm((prev) => ({
      ...prev,
      userGroupIds: prev.userGroupIds.includes(groupId)
        ? prev.userGroupIds.filter((id) => id !== groupId)
        : [...prev.userGroupIds, groupId],
    }));
  };

  // ===== Filter =====
  const filteredContacts = contacts.filter((contact) => {
    const haystack = [
      contact.firstName,
      contact.lastName,
      contact.company,
      contact.email,
      contact.phone,
      contact.mobile,
      contact.city,
      contact.position,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || contact.category === categoryFilter;
    const matchesGroup =
      !groupFilter ||
      (groupFilter === '__none__' ? !contact.contactGroupId : contact.contactGroupId === groupFilter);

    return matchesSearch && matchesCategory && matchesGroup;
  });

  const inputStyle = { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📇 Kontakte</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSyncGroupId('');
              setIsSyncModalOpen(true);
            }}
            title="Alle Mitarbeiter als Kontakte in eine Kontaktgruppe synchronisieren"
          >
            🔄 Mitarbeiter synchronisieren
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              handleOpenGroupForm();
              setIsGroupModalOpen(true);
            }}
            title="Kontaktgruppen und deren Sichtbarkeit verwalten"
          >
            🏷️ Gruppen verwalten
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            Neuer Kontakt
          </button>
        </div>
      </div>

      {/* Filterleiste (analog zum Geräte-Modul) */}
      <div
        style={{
          position: 'sticky',
          top: '0',
          zIndex: 100,
          background: 'var(--card-bg, #f8f9fa)',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid var(--border-color, #dee2e6)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ marginBottom: '8px', fontWeight: 600, color: 'var(--text-primary, #333)', fontSize: '13px' }}>
          🔍 Filter
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Suche nach Name, Firma, E-Mail, Telefon oder Ort..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: '300px' }}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ ...inputStyle, minWidth: '150px' }}
          >
            <option value="">Alle Kategorien</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            style={{ ...inputStyle, minWidth: '180px' }}
          >
            <option value="">Alle Gruppen</option>
            <option value="__none__">Ohne Gruppe</option>
            {contactGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          {(searchTerm || categoryFilter || groupFilter) && (
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setGroupFilter('');
              }}
              title="Alle Filter zurücksetzen"
              style={{ padding: '8px 12px' }}
            >
              ✖ Filter zurücksetzen
            </button>
          )}
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary, #666)' }}>
          {filteredContacts.length} von {contacts.length} Kontakten angezeigt
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Firma</th>
            <th>Position</th>
            <th>E-Mail</th>
            <th>Telefon</th>
            <th>Ort</th>
            <th>Kategorie</th>
            <th>Gruppe</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filteredContacts.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                Keine Kontakte gefunden
              </td>
            </tr>
          ) : (
            filteredContacts.map((contact) => (
              <tr key={contact.id}>
                <td>
                  <strong>
                    {contact.lastName} {contact.firstName}
                  </strong>
                </td>
                <td>{contact.company || '-'}</td>
                <td>{contact.position || '-'}</td>
                <td>
                  {contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : '-'}
                </td>
                <td>{contact.mobile || contact.phone || '-'}</td>
                <td>{contact.city || '-'}</td>
                <td>{contact.category || '-'}</td>
                <td>
                  {contact.contactGroup ? (
                    <span
                      className="status-badge"
                      style={{
                        background: contact.contactGroup.color || '#666',
                        color: '#fff',
                      }}
                    >
                      {contact.contactGroup.name}
                    </span>
                  ) : (
                    <span style={{ color: '#999' }}>-</span>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleOpenModal(contact)}
                      title="Bearbeiten"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(contact.id)}
                      title="Löschen"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Kontakt anlegen/bearbeiten */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px', width: '90%', padding: '0' }}
          >
            <div className="modal-header">
              <h3>{editingContact ? 'Kontakt bearbeiten' : 'Neuer Kontakt'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '30px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
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
                  <label>Firma</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Position</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>E-Mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Telefon</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Mobil</label>
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Kategorie</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Bitte wählen</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Straße</label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                  <div>
                    <label>PLZ</label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    />
                  </div>
                  <div>
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
                <div className="form-group">
                  <label>Kontaktgruppe</label>
                  <select
                    value={formData.contactGroupId}
                    onChange={(e) => setFormData({ ...formData, contactGroupId: e.target.value })}
                  >
                    <option value="">Keine Gruppe</option>
                    {contactGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Notizen</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Abbrechen
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingContact ? 'Aktualisieren' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mitarbeiter synchronisieren */}
      {isSyncModalOpen && (
        <div className="modal-overlay" onClick={() => !syncing && setIsSyncModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px', width: '90%', padding: '0' }}
          >
            <div className="modal-header">
              <h3>🔄 Mitarbeiter synchronisieren</h3>
              <button className="modal-close" onClick={() => !syncing && setIsSyncModalOpen(false)}>
                ×
              </button>
            </div>

            <div style={{ padding: '30px' }}>
              <p style={{ marginTop: 0, color: 'var(--text-secondary, #666)', fontSize: '14px' }}>
                Übernimmt die Kontaktdaten aller aktiven Mitarbeiter (Name, E-Mail, Telefon, Mobil,
                Adresse, Position) als Kontakte in die gewählte Kontaktgruppe. Die Synchronisation
                läuft nur in eine Richtung (Mitarbeiter → Kontakte); bereits synchronisierte Kontakte
                werden aktualisiert, nicht doppelt angelegt.
              </p>

              <div className="form-group">
                <label>Ziel-Kontaktgruppe *</label>
                <select
                  value={syncGroupId}
                  onChange={(e) => setSyncGroupId(e.target.value)}
                  style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                  autoFocus
                >
                  <option value="">Bitte wählen...</option>
                  {contactGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                {contactGroups.length === 0 && (
                  <p style={{ color: '#e67e22', fontSize: '12px', marginTop: '6px' }}>
                    Es ist noch keine Kontaktgruppe vorhanden. Bitte zuerst unter „Gruppen verwalten" eine anlegen.
                  </p>
                )}
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsSyncModalOpen(false)}
                  disabled={syncing}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSync}
                  disabled={!syncGroupId || syncing}
                >
                  {syncing ? 'Synchronisiere...' : 'Synchronisieren'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kontaktgruppen verwalten */}
      {isGroupModalOpen && (
        <div className="modal-overlay" onClick={() => setIsGroupModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '900px', width: '92%', padding: '0' }}
          >
            <div className="modal-header">
              <h3>🏷️ Kontaktgruppen verwalten</h3>
              <button className="modal-close" onClick={() => setIsGroupModalOpen(false)}>
                ×
              </button>
            </div>

            <div style={{ padding: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              {/* Liste bestehender Gruppen */}
              <div>
                <h4 style={{ marginTop: 0 }}>Vorhandene Gruppen</h4>
                {contactGroups.length === 0 ? (
                  <p style={{ color: '#999' }}>Noch keine Kontaktgruppen angelegt.</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {contactGroups.map((g) => (
                      <li
                        key={g.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px',
                          borderRadius: '6px',
                          marginBottom: '8px',
                          border: '1px solid var(--border-color, #dee2e6)',
                          background: editingGroup?.id === g.id ? 'var(--card-bg, #eef)' : 'transparent',
                        }}
                      >
                        <div>
                          <span
                            style={{
                              display: 'inline-block',
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              background: g.color || '#666',
                              marginRight: '8px',
                            }}
                          />
                          <strong>{g.name}</strong>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary, #666)', marginTop: '4px' }}>
                            {g._count?.contacts ?? 0} Kontakte ·{' '}
                            {g.visibleToGroups && g.visibleToGroups.length > 0
                              ? `Sichtbar für: ${g.visibleToGroups.map((vg) => vg.name).join(', ')}`
                              : 'Sichtbar für alle'}
                          </div>
                        </div>
                        <div className="action-buttons">
                          <button className="btn btn-sm btn-secondary" onClick={() => handleOpenGroupForm(g)} title="Bearbeiten">
                            ✏️
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteGroup(g.id)} title="Löschen">
                            🗑️
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Gruppe anlegen/bearbeiten */}
              <form onSubmit={handleSaveGroup}>
                <h4 style={{ marginTop: 0 }}>{editingGroup ? 'Gruppe bearbeiten' : 'Neue Gruppe'}</h4>
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Beschreibung</label>
                  <input
                    type="text"
                    value={groupForm.description}
                    onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Farbe</label>
                  <input
                    type="color"
                    value={groupForm.color}
                    onChange={(e) => setGroupForm({ ...groupForm, color: e.target.value })}
                    style={{ width: '60px', height: '36px', padding: '2px' }}
                  />
                </div>
                <div className="form-group">
                  <label>Sichtbar für Benutzergruppen</label>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary, #666)', margin: '0 0 8px' }}>
                    Kontakte dieser Gruppe sind nur für Benutzer der ausgewählten Benutzergruppen sichtbar.
                    Ohne Auswahl sind sie für alle sichtbar. (Admins sehen immer alles.)
                  </p>
                  <div
                    style={{
                      maxHeight: '180px',
                      overflowY: 'auto',
                      border: '1px solid var(--border-color, #dee2e6)',
                      borderRadius: '6px',
                      padding: '8px',
                    }}
                  >
                    {userGroups.length === 0 ? (
                      <p style={{ color: '#999', margin: 0 }}>Keine Benutzergruppen vorhanden.</p>
                    ) : (
                      userGroups.map((ug) => (
                        <label
                          key={ug.id}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}
                        >
                          <input
                            type="checkbox"
                            checked={groupForm.userGroupIds.includes(ug.id)}
                            onChange={() => toggleUserGroup(ug.id)}
                          />
                          {ug.color && (
                            <span
                              style={{
                                display: 'inline-block',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: ug.color,
                              }}
                            />
                          )}
                          {ug.name}
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '20px' }}>
                  {editingGroup && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditingGroup(null);
                        setGroupForm({ name: '', description: '', color: '#3498db', userGroupIds: [] });
                      }}
                    >
                      Abbrechen
                    </button>
                  )}
                  <button type="submit" className="btn btn-primary">
                    {editingGroup ? 'Aktualisieren' : 'Gruppe anlegen'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
