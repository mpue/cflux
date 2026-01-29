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
  const [showDocumentsDialog, setShowDocumentsDialog] = useState(false);
  const [showMatrixDialog, setShowMatrixDialog] = useState(false);
  const [selectedJobFunction, setSelectedJobFunction] = useState<JobFunction | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [documents, setDocuments] = useState<any[]>([]);
  const [intranetNodes, setIntranetNodes] = useState<any[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [matrixData, setMatrixData] = useState<any>(null);
  
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

  const handleManageDocuments = async (jobFunction: JobFunction) => {
    setSelectedJobFunction(jobFunction);
    setLoading(true);
    try {
      // Load documents for this job function
      const docsResponse = await api.get(`/job-functions/${jobFunction.id}/documents`);
      setDocuments(docsResponse.data);
      
      // Load all intranet nodes
      const nodesResponse = await api.get('/intranet/tree');
      setIntranetNodes(nodesResponse.data);
      
      setShowDocumentsDialog(true);
    } catch (err) {
      setError('Fehler beim Laden der Dokumente');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocument = async () => {
    if (!selectedJobFunction || !selectedDocumentId) return;

    setLoading(true);
    try {
      await api.post(`/job-functions/${selectedJobFunction.id}/documents`, {
        documentNodeId: selectedDocumentId,
      });
      setSuccess('Dokument erfolgreich hinzugefügt');
      setSelectedDocumentId('');
      
      // Reload documents
      const docsResponse = await api.get(`/job-functions/${selectedJobFunction.id}/documents`);
      setDocuments(docsResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Hinzufügen des Dokuments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDocument = async (documentId: string) => {
    if (!selectedJobFunction) return;
    if (!window.confirm('Möchten Sie dieses Dokument wirklich entfernen?')) return;

    setLoading(true);
    try {
      await api.delete(`/job-functions/${selectedJobFunction.id}/documents/${documentId}`);
      setSuccess('Dokument erfolgreich entfernt');
      
      // Reload documents
      const docsResponse = await api.get(`/job-functions/${selectedJobFunction.id}/documents`);
      setDocuments(docsResponse.data);
    } catch (err) {
      setError('Fehler beim Entfernen des Dokuments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowMatrix = async () => {
    setLoading(true);
    try {
      const response = await api.get('/job-functions/matrix');
      setMatrixData(response.data);
      setShowMatrixDialog(true);
      setError(null);
    } catch (err) {
      setError('Fehler beim Laden der Matrix');
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

  // Flatten document tree to include all sub-documents
  const flattenDocumentTree = (nodes: any[], prefix: string = ''): any[] => {
    let result: any[] = [];
    
    nodes.forEach(node => {
      const displayTitle = prefix + node.title;
      result.push({
        ...node,
        displayTitle,
        level: prefix.length / 2 // Count indentation level
      });
      
      if (node.children && node.children.length > 0) {
        result = result.concat(flattenDocumentTree(node.children, prefix + '  '));
      }
    });
    
    return result;
  };

  return (
    <div className="tab-container">
      <div className="tab-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Funktionen</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handleShowMatrix}>
            📊 Matrix anzeigen
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenDialog()}>
            + Neue Funktion
          </button>
        </div>
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
                  <button className="btn btn-sm" onClick={() => handleManageDocuments(jobFunction)} title="Dokumente verwalten">
                    📄
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

      {/* Documents Dialog */}
      {showDocumentsDialog && selectedJobFunction && (
        <div className="modal-overlay" onClick={() => setShowDocumentsDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>Dokumente für {selectedJobFunction.title}</h3>
              <button className="modal-close" onClick={() => setShowDocumentsDialog(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '20px' }}>
                <h4>Neues Dokument hinzufügen</h4>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label>Intranet-Dokument</label>
                    <select 
                      value={selectedDocumentId} 
                      onChange={(e) => setSelectedDocumentId(e.target.value)}
                      style={{ width: '100%', padding: '8px' }}
                    >
                      <option value="">-- Dokument auswählen --</option>
                      {flattenDocumentTree(intranetNodes)
                        .filter(node => !documents.some(d => d.documentNodeId === node.id))
                        .map(node => (
                          <option key={node.id} value={node.id}>
                            {node.displayTitle}
                          </option>
                        ))}
                    </select>
                  </div>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleAddDocument}
                    disabled={!selectedDocumentId || loading}
                  >
                    Hinzufügen
                  </button>
                </div>
              </div>

              <div>
                <h4>Zugeordnete Dokumente ({documents.length})</h4>
                {documents.length === 0 ? (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>Keine Dokumente zugeordnet</p>
                ) : (
                  <table className="data-table" style={{ marginTop: '10px' }}>
                    <thead>
                      <tr>
                        <th>Titel</th>
                        <th>Typ</th>
                        <th>Hinzugefügt am</th>
                        <th>Aktion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr key={doc.id}>
                          <td>{doc.documentNode?.title}</td>
                          <td>{doc.documentNode?.type}</td>
                          <td>{new Date(doc.createdAt).toLocaleDateString('de-DE')}</td>
                          <td>
                            <button 
                              className="btn btn-sm btn-danger" 
                              onClick={() => handleRemoveDocument(doc.documentNodeId)}
                              title="Entfernen"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowDocumentsDialog(false)}>Schließen</button>
            </div>
          </div>
        </div>
      )}

      {/* Matrix Dialog */}
      {showMatrixDialog && matrixData && (
        <div className="modal-overlay" onClick={() => setShowMatrixDialog(false)}>
          <div className="modal-content" style={{ maxWidth: '95%', maxHeight: '90vh', width: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Funktionen-Dokumente Matrix</h2>
              <button className="modal-close" onClick={() => setShowMatrixDialog(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ overflow: 'auto' }}>
              {matrixData.documents.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                  Keine Dokumente zugeordnet
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table" style={{ minWidth: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ position: 'sticky', left: 0, background: '#fff', zIndex: 10, minWidth: '200px' }}>
                          Dokument
                        </th>
                        {matrixData.jobFunctions.map((jf: any) => (
                          <th 
                            key={jf.id} 
                            style={{ 
                              minWidth: '50px',
                              maxWidth: '50px',
                              padding: '8px 4px',
                              textAlign: 'center',
                              verticalAlign: 'bottom'
                            }}
                          >
                            <div style={{
                              writingMode: 'vertical-rl',
                              transform: 'rotate(180deg)',
                              whiteSpace: 'nowrap',
                              height: '200px',
                              display: 'flex',
                              alignItems: 'flex-end',
                              justifyContent: 'center',
                              margin: '0 auto'
                            }}>
                              {jf.title}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrixData.documents.map((doc: any) => (
                        <tr key={doc.id}>
                          <td style={{ 
                            position: 'sticky', 
                            left: 0, 
                            background: '#fff', 
                            zIndex: 5,
                            fontWeight: 500 
                          }}>
                            {doc.title}
                            <span style={{ 
                              fontSize: '0.85em', 
                              color: '#666', 
                              marginLeft: '8px' 
                            }}>
                              ({doc.type})
                            </span>
                          </td>
                          {matrixData.jobFunctions.map((jf: any) => (
                            <td 
                              key={jf.id} 
                              style={{ 
                                textAlign: 'center',
                                background: matrixData.assignments[doc.id]?.[jf.id] ? '#e8f5e9' : '#fff',
                                padding: '12px 4px'
                              }}
                            >
                              {matrixData.assignments[doc.id]?.[jf.id] ? (
                                <span style={{ fontSize: '1.2em', color: '#4caf50' }}>✓</span>
                              ) : (
                                <span style={{ fontSize: '1.2em', color: '#ccc' }}>—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {matrixData.documents.length > 0 && (
                <div style={{ 
                  marginTop: '20px', 
                  padding: '15px', 
                  background: '#f5f5f5', 
                  borderRadius: '4px',
                  display: 'flex',
                  gap: '30px'
                }}>
                  <div>
                    <strong>Gesamt:</strong>
                  </div>
                  <div>
                    <strong>{matrixData.jobFunctions.length}</strong> Funktionen
                  </div>
                  <div>
                    <strong>{matrixData.documents.length}</strong> Dokumente
                  </div>
                  <div>
                    <strong>
                      {Object.values(matrixData.assignments).reduce((sum: number, jfAssignments: any) => 
                        sum + Object.values(jfAssignments).filter(Boolean).length, 0
                      )}
                    </strong> Zuordnungen
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowMatrixDialog(false)}>Schließen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobFunctionsTab;
