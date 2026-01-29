import React, { useState, useEffect } from 'react';
import { JobFunction } from '../../types';
import api from '../../services/api';

interface JobFunctionsTabProps {
  onUpdate?: () => void;
}

const JobFunctionsTab: React.FC<JobFunctionsTabProps> = ({ onUpdate }) => {
  const [jobFunctions, setJobFunctions] = useState<JobFunction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [showDialog, setShowDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedJobFunction, setSelectedJobFunction] = useState<JobFunction | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  const [formData, setFormData] = useState({
    title: '',
    titleEn: '',
    description: '',
    descriptionEn: '',
    requirements: '',
    requirementsEn: '',
    qualifications: '',
    qualificationsEn: '',
    responsibilities: '',
    responsibilitiesEn: '',
    department: '',
    level: '',
    category: '',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'CHF',
    isActive: true,
  });

  const levels = ['Junior', 'Medior', 'Senior', 'Lead', 'Manager', 'Director'];
  const categories = ['IT', 'HR', 'Finance', 'Operations', 'Sales', 'Marketing', 'Administration'];

  useEffect(() => {
    loadJobFunctions();
  }, []);

  const loadJobFunctions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/job-functions');
      setJobFunctions(response.data);
      setError(null);
    } catch (err) {
      setError('Fehler beim Laden der Funktionen');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (jobFunction?: JobFunction) => {
    if (jobFunction) {
      setFormData({
        title: jobFunction.title,
        titleEn: jobFunction.titleEn || '',
        description: jobFunction.description || '',
        descriptionEn: jobFunction.descriptionEn || '',
        requirements: jobFunction.requirements || '',
        requirementsEn: jobFunction.requirementsEn || '',
        qualifications: jobFunction.qualifications || '',
        qualificationsEn: jobFunction.qualificationsEn || '',
        responsibilities: jobFunction.responsibilities || '',
        responsibilitiesEn: jobFunction.responsibilitiesEn || '',
        department: jobFunction.department || '',
        level: jobFunction.level || '',
        category: jobFunction.category || '',
        salaryMin: jobFunction.salaryMin?.toString() || '',
        salaryMax: jobFunction.salaryMax?.toString() || '',
        salaryCurrency: jobFunction.salaryCurrency || 'CHF',
        isActive: jobFunction.isActive,
      });
      setSelectedJobFunction(jobFunction);
    } else {
      setFormData({
        title: '',
        titleEn: '',
        description: '',
        descriptionEn: '',
        requirements: '',
        requirementsEn: '',
        qualifications: '',
        qualificationsEn: '',
        responsibilities: '',
        responsibilitiesEn: '',
        department: '',
        level: '',
        category: '',
        salaryMin: '',
        salaryMax: '',
        salaryCurrency: 'CHF',
        isActive: true,
      });
      setSelectedJobFunction(null);
    }
    setTabValue(0);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setSelectedJobFunction(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : undefined,
      };

      if (selectedJobFunction) {
        await api.put(`/job-functions/${selectedJobFunction.id}`, data);
        setSuccess('Funktion erfolgreich aktualisiert');
      } else {
        await api.post('/job-functions', data);
        setSuccess('Funktion erfolgreich erstellt');
      }
      
      handleCloseDialog();
      loadJobFunctions();
      if (onUpdate) onUpdate();
    } catch (err) {
      setError('Fehler beim Speichern der Funktion');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchten Sie diese Funktion wirklich löschen?')) {
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/job-functions/${id}`);
      setSuccess('Funktion erfolgreich gelöscht');
      loadJobFunctions();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Löschen der Funktion');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (min?: number, max?: number, currency: string = 'CHF') => {
    if (!min && !max) return '-';
    if (min && max) {
      return `${min.toLocaleString('de-CH')} - ${max.toLocaleString('de-CH')} ${currency}`;
    }
    if (min) return `ab ${min.toLocaleString('de-CH')} ${currency}`;
    if (max) return `bis ${max.toLocaleString('de-CH')} ${currency}`;
    return '-';
  };

  return (
    <div className="tab-container">
      <div className="tab-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Funktionen</h2>
        <button className="btn btn-primary" onClick={() => handleOpenDialog()}>
          + Neue Funktion
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          {error}
          <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          {success}
          <button onClick={() => setSuccess(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Kategorie</th>
              <th>Abteilung</th>
              <th>Level</th>
              <th>Gehaltsspanne</th>
              <th>Mitarbeiter</th>
              <th>Status</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {jobFunctions.map((jobFunction) => (
              <tr key={jobFunction.id}>
                <td>
                  <strong>{jobFunction.title}</strong>
                  {jobFunction.titleEn && (
                    <div style={{ fontSize: '0.9em', color: '#666' }}>{jobFunction.titleEn}</div>
                  )}
                </td>
                <td>{jobFunction.category || '-'}</td>
                <td>{jobFunction.department || '-'}</td>
                <td>{jobFunction.level || '-'}</td>
                <td>{formatCurrency(jobFunction.salaryMin, jobFunction.salaryMax, jobFunction.salaryCurrency)}</td>
                <td>
                  <span className="badge">{jobFunction._count?.employees || 0}</span>
                </td>
                <td>
                  <span className={`status-badge ${jobFunction.isActive ? 'status-active' : 'status-inactive'}`}>
                    {jobFunction.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-sm" onClick={() => handleOpenDialog(jobFunction)} title="Bearbeiten">
                    ✏️
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(jobFunction.id)} title="Löschen">
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            {jobFunctions.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  Keine Funktionen vorhanden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Dialog */}
      {showDialog && (
        <div className="modal-overlay" onClick={handleCloseDialog}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>{selectedJobFunction ? 'Funktion bearbeiten' : 'Neue Funktion'}</h3>
              <button className="modal-close" onClick={handleCloseDialog}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="tabs">
                  <button type="button" className={tabValue === 0 ? 'active' : ''} onClick={() => setTabValue(0)}>Grunddaten</button>
                  <button type="button" className={tabValue === 1 ? 'active' : ''} onClick={() => setTabValue(1)}>Beschreibung</button>
                  <button type="button" className={tabValue === 2 ? 'active' : ''} onClick={() => setTabValue(2)}>Anforderungen</button>
                </div>

                {tabValue === 0 && (
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Titel (DE) *</label>
                      <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Titel (EN)</label>
                      <input type="text" value={formData.titleEn} onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Kategorie</label>
                      <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                        <option value="">Keine</option>
                        {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Abteilung</label>
                      <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Level</label>
                      <select value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })}>
                        <option value="">Keines</option>
                        {levels.map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Min. Gehalt</label>
                      <input type="number" value={formData.salaryMin} onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Max. Gehalt</label>
                      <input type="number" value={formData.salaryMax} onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Währung</label>
                      <input type="text" value={formData.salaryCurrency} onChange={(e) => setFormData({ ...formData, salaryCurrency: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>
                        <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                        {' '}Aktiv
                      </label>
                    </div>
                  </div>
                )}

                {tabValue === 1 && (
                  <div className="form-grid">
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Beschreibung (DE)</label>
                      <textarea rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Beschreibung (EN)</label>
                      <textarea rows={4} value={formData.descriptionEn} onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Verantwortlichkeiten (DE)</label>
                      <textarea rows={4} value={formData.responsibilities} onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Verantwortlichkeiten (EN)</label>
                      <textarea rows={4} value={formData.responsibilitiesEn} onChange={(e) => setFormData({ ...formData, responsibilitiesEn: e.target.value })} />
                    </div>
                  </div>
                )}

                {tabValue === 2 && (
                  <div className="form-grid">
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Anforderungen (DE)</label>
                      <textarea rows={4} value={formData.requirements} onChange={(e) => setFormData({ ...formData, requirements: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Anforderungen (EN)</label>
                      <textarea rows={4} value={formData.requirementsEn} onChange={(e) => setFormData({ ...formData, requirementsEn: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Qualifikationen (DE)</label>
                      <textarea rows={4} value={formData.qualifications} onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Qualifikationen (EN)</label>
                      <textarea rows={4} value={formData.qualificationsEn} onChange={(e) => setFormData({ ...formData, qualificationsEn: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={handleCloseDialog}>Abbrechen</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Speichern...' : 'Speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobFunctionsTab;
