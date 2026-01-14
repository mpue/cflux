import React, { useState, useEffect } from 'react';
import projectBudgetService, { ProjectBudget, ProjectBudgetItem } from '../../services/projectBudget.service';
import { projectService } from '../../services/project.service';
import { costCenterService } from '../../services/costCenter.service';
import { inventoryService } from '../../services/inventory.service';
import { BaseModal } from '../common/BaseModal';
import './ProjectBudgetTab.css';

const ProjectBudgetTab: React.FC = () => {
  const [budgets, setBudgets] = useState<ProjectBudget[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<ProjectBudget | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<ProjectBudget | null>(null);
  const [editingItem, setEditingItem] = useState<ProjectBudgetItem | null>(null);

  const [formData, setFormData] = useState({
    projectId: '',
    costCenterId: '',
    budgetName: '',
    totalBudget: '',
    fiscalYear: new Date().getFullYear().toString(),
    startDate: '',
    endDate: '',
    notes: '',
  });

  const [itemFormData, setItemFormData] = useState({
    category: 'MATERIALS',
    itemName: '',
    description: '',
    inventoryItemId: '',
    costCenterId: '',
    plannedQuantity: '',
    unitPrice: '',
    plannedHours: '',
    hourlyRate: '',
    actualQuantity: '',
    actualUnitPrice: '',
    actualHours: '',
    actualHourlyRate: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [budgetsData, projectsData, costCentersData, inventoryData] = await Promise.all([
        projectBudgetService.getAllBudgets(),
        projectService.getAllProjects(),
        costCenterService.getAll(),
        inventoryService.getAll(),
      ]);
      setBudgets(budgetsData);
      setProjects(projectsData);
      setCostCenters(costCentersData);
      setInventoryItems(inventoryData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const budgetData = {
        ...formData,
        totalBudget: parseFloat(formData.totalBudget),
        costCenterId: formData.costCenterId || undefined,
      };
      await projectBudgetService.createBudget(budgetData as any);
      setSuccessMessage('Budget erfolgreich erstellt');
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Erstellen des Budgets');
    }
  };

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;
    try {
      const budgetData = {
        ...formData,
        totalBudget: formData.totalBudget ? parseFloat(formData.totalBudget) : undefined,
        costCenterId: formData.costCenterId || undefined,
      };
      await projectBudgetService.updateBudget(editingBudget.id, budgetData as any);
      setSuccessMessage('Budget erfolgreich aktualisiert');
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Aktualisieren des Budgets');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!window.confirm('Budget wirklich löschen?')) return;
    try {
      await projectBudgetService.deleteBudget(id);
      setSuccessMessage('Budget erfolgreich gelöscht');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Löschen des Budgets');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBudget) return;
    try {
      const itemData = {
        category: itemFormData.category,
        itemName: itemFormData.itemName,
        description: itemFormData.description,
        inventoryItemId: itemFormData.inventoryItemId || undefined,
        costCenterId: itemFormData.costCenterId || undefined,
        plannedQuantity: itemFormData.plannedQuantity ? parseFloat(itemFormData.plannedQuantity) : undefined,
        unitPrice: itemFormData.unitPrice ? parseFloat(itemFormData.unitPrice) : undefined,
        plannedCost: itemFormData.category === 'LABOR'
          ? (itemFormData.plannedHours && itemFormData.hourlyRate
              ? parseFloat(itemFormData.plannedHours) * parseFloat(itemFormData.hourlyRate)
              : 0)
          : (itemFormData.plannedQuantity && itemFormData.unitPrice 
              ? parseFloat(itemFormData.plannedQuantity) * parseFloat(itemFormData.unitPrice)
              : 0),
        plannedHours: itemFormData.plannedHours ? parseFloat(itemFormData.plannedHours) : undefined,
        hourlyRate: itemFormData.hourlyRate ? parseFloat(itemFormData.hourlyRate) : undefined,
        actualQuantity: itemFormData.actualQuantity ? parseFloat(itemFormData.actualQuantity) : undefined,
        actualUnitPrice: itemFormData.actualUnitPrice ? parseFloat(itemFormData.actualUnitPrice) : undefined,
        actualCost: itemFormData.category === 'LABOR'
          ? (itemFormData.actualHours && (itemFormData.actualHourlyRate || itemFormData.hourlyRate)
              ? parseFloat(itemFormData.actualHours) * parseFloat(itemFormData.actualHourlyRate || itemFormData.hourlyRate)
              : 0)
          : (itemFormData.actualQuantity && (itemFormData.actualUnitPrice || itemFormData.unitPrice)
              ? parseFloat(itemFormData.actualQuantity) * parseFloat(itemFormData.actualUnitPrice || itemFormData.unitPrice)
              : 0),
        actualHours: itemFormData.actualHours ? parseFloat(itemFormData.actualHours) : undefined,
        actualHourlyRate: itemFormData.actualHourlyRate ? parseFloat(itemFormData.actualHourlyRate) : undefined,
        notes: itemFormData.notes || undefined,
      };
      await projectBudgetService.addBudgetItem(selectedBudget.id, itemData as any);
      await projectBudgetService.recalculateBudget(selectedBudget.id);
      setSuccessMessage('Position erfolgreich hinzugefügt');
      setIsItemModalOpen(false);
      resetItemForm();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Hinzufügen der Position');
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !selectedBudget) return;
    try {
      const itemData = {
        category: itemFormData.category,
        itemName: itemFormData.itemName,
        description: itemFormData.description,
        inventoryItemId: itemFormData.inventoryItemId || undefined,
        costCenterId: itemFormData.costCenterId || undefined,
        plannedQuantity: itemFormData.plannedQuantity ? parseFloat(itemFormData.plannedQuantity) : undefined,
        unitPrice: itemFormData.unitPrice ? parseFloat(itemFormData.unitPrice) : undefined,
        plannedCost: itemFormData.category === 'LABOR'
          ? (itemFormData.plannedHours && itemFormData.hourlyRate
              ? parseFloat(itemFormData.plannedHours) * parseFloat(itemFormData.hourlyRate)
              : undefined)
          : (itemFormData.plannedQuantity && itemFormData.unitPrice 
              ? parseFloat(itemFormData.plannedQuantity) * parseFloat(itemFormData.unitPrice)
              : undefined),
        plannedHours: itemFormData.plannedHours ? parseFloat(itemFormData.plannedHours) : undefined,
        hourlyRate: itemFormData.hourlyRate ? parseFloat(itemFormData.hourlyRate) : undefined,
        actualQuantity: itemFormData.actualQuantity ? parseFloat(itemFormData.actualQuantity) : undefined,
        actualUnitPrice: itemFormData.actualUnitPrice ? parseFloat(itemFormData.actualUnitPrice) : undefined,
        actualCost: itemFormData.category === 'LABOR'
          ? (itemFormData.actualHours && (itemFormData.actualHourlyRate || itemFormData.hourlyRate)
              ? parseFloat(itemFormData.actualHours) * parseFloat(itemFormData.actualHourlyRate || itemFormData.hourlyRate)
              : undefined)
          : (itemFormData.actualQuantity && (itemFormData.actualUnitPrice || itemFormData.unitPrice)
              ? parseFloat(itemFormData.actualQuantity) * parseFloat(itemFormData.actualUnitPrice || itemFormData.unitPrice)
              : undefined),
        actualHours: itemFormData.actualHours ? parseFloat(itemFormData.actualHours) : undefined,
        actualHourlyRate: itemFormData.actualHourlyRate ? parseFloat(itemFormData.actualHourlyRate) : undefined,
        notes: itemFormData.notes || undefined,
      };
      await projectBudgetService.updateBudgetItem(editingItem.id, itemData as any);
      await projectBudgetService.recalculateBudget(selectedBudget.id);
      setSuccessMessage('Position erfolgreich aktualisiert');
      setIsItemModalOpen(false);
      resetItemForm();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Aktualisieren der Position');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Position wirklich löschen?') || !selectedBudget) return;
    try {
      await projectBudgetService.deleteBudgetItem(itemId);
      await projectBudgetService.recalculateBudget(selectedBudget.id);
      setSuccessMessage('Position erfolgreich gelöscht');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Löschen der Position');
    }
  };

  const openEditBudgetModal = (budget: ProjectBudget) => {
    setEditingBudget(budget);
    setFormData({
      projectId: budget.projectId,
      costCenterId: budget.costCenterId || '',
      budgetName: budget.budgetName,
      totalBudget: budget.totalBudget.toString(),
      fiscalYear: budget.fiscalYear.toString(),
      startDate: budget.startDate.split('T')[0],
      endDate: budget.endDate.split('T')[0],
      notes: budget.notes || '',
    });
    setIsModalOpen(true);
  };

  const openItemModal = (budget: ProjectBudget, item?: ProjectBudgetItem) => {
    setSelectedBudget(budget);
    if (item) {
      setEditingItem(item);
      setItemFormData({
        category: item.category,
        itemName: item.itemName,
        description: item.description || '',
        inventoryItemId: item.inventoryItemId || '',
        costCenterId: item.costCenterId || '',
        plannedQuantity: item.plannedQuantity?.toString() || '',
        unitPrice: item.unitPrice?.toString() || '',
        plannedHours: item.plannedHours?.toString() || '',
        hourlyRate: item.hourlyRate?.toString() || '',
        actualQuantity: item.actualQuantity?.toString() || '',
        actualUnitPrice: item.actualUnitPrice?.toString() || '',
        actualHours: item.actualHours?.toString() || '',
        actualHourlyRate: item.actualHourlyRate?.toString() || '',
        notes: item.notes || '',
      });
    }
    setIsItemModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      projectId: '',
      costCenterId: '',
      budgetName: '',
      totalBudget: '',
      fiscalYear: new Date().getFullYear().toString(),
      startDate: '',
      endDate: '',
      notes: '',
    });
    setEditingBudget(null);
  };

  const resetItemForm = () => {
    setItemFormData({
      category: 'MATERIALS',
      itemName: '',
      description: '',
      inventoryItemId: '',
      costCenterId: '',
      plannedQuantity: '',
      unitPrice: '',
      plannedHours: '',
      hourlyRate: '',
      actualQuantity: '',
      actualUnitPrice: '',
      actualHours: '',
      actualHourlyRate: '',
      notes: '',
    });
    setEditingItem(null);
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: string } = {
      PLANNING: 'status-planning',
      ACTIVE: 'status-active',
      COMPLETED: 'status-completed',
      EXCEEDED: 'status-exceeded',
    };
    return badges[status] || 'status-planning';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
    }).format(amount);
  };

  if (loading) return <div>Lädt Budgets...</div>;

  return (
    <div className="project-budget-tab">
      <div className="tab-header">
        <h2>📊 Projekt-Budgetplanung</h2>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          + Neues Budget
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <div className="budget-grid">
        {budgets.map((budget) => (
          <div key={budget.id} className="budget-card">
            <div className="budget-card-header">
              <div>
                <h3>{budget.budgetName}</h3>
                <p className="project-name">
                  {budget.project?.name}
                  {budget.project?.customer && ` - ${budget.project.customer.name}`}
                </p>
              </div>
              <span className={`status-badge ${getStatusBadge(budget.status)}`}>
                {budget.status}
              </span>
            </div>

            <div className="budget-stats">
              <div className="stat">
                <span className="stat-label">Gesamtbudget</span>
                <span className="stat-value">{formatCurrency(budget.totalBudget)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Geplante Kosten</span>
                <span className="stat-value">{formatCurrency(budget.plannedCosts)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Tatsächliche Kosten</span>
                <span className="stat-value">{formatCurrency(budget.actualCosts)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Verbleibend</span>
                <span className={`stat-value ${budget.remainingBudget < 0 ? 'negative' : ''}`}>
                  {formatCurrency(budget.remainingBudget)}
                </span>
              </div>
            </div>

            <div className="budget-utilization">
              <div className="utilization-bar">
                <div
                  className="utilization-fill"
                  style={{
                    width: `${Math.min(budget.budgetUtilization, 100)}%`,
                    backgroundColor: budget.budgetUtilization > 100 ? '#dc3545' : '#28a745',
                  }}
                />
              </div>
              <span className="utilization-text">{budget.budgetUtilization.toFixed(1)}%</span>
            </div>

            <div className="budget-meta">
              <span>FJ {budget.fiscalYear}</span>
              <span>{budget.costCenter?.code}</span>
              <span>{budget.items?.length || 0} Positionen</span>
            </div>

            <div className="budget-actions">
              <button
                className="btn-secondary"
                onClick={() => openItemModal(budget)}
                title="Position hinzufügen"
              >
                + Position
              </button>
              <button className="btn-secondary" onClick={() => openEditBudgetModal(budget)}>
                Bearbeiten
              </button>
              <button className="btn-danger" onClick={() => handleDeleteBudget(budget.id)}>
                Löschen
              </button>
            </div>

            {budget.items && budget.items.length > 0 && (
              <div className="budget-items">
                <h4>Positionen</h4>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Kategorie</th>
                      <th>Position</th>
                      <th>Geplant</th>
                      <th>Tatsächlich</th>
                      <th>Abweichung</th>
                      <th>Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budget.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span className="category-badge">{item.category}</span>
                        </td>
                        <td>
                          <div>{item.itemName}</div>
                          {item.inventoryItem && (
                            <small>🏷️ {item.inventoryItem.article?.name}</small>
                          )}
                        </td>
                        <td>{formatCurrency(item.plannedCost)}</td>
                        <td>{formatCurrency(item.actualCost)}</td>
                        <td className={item.variance < 0 ? 'positive' : item.variance > 0 ? 'negative' : ''}>
                          {formatCurrency(item.variance)}
                          <br />
                          <small>({item.variancePercent.toFixed(1)}%)</small>
                        </td>
                        <td>
                          <button
                            className="btn-sm"
                            onClick={() => openItemModal(budget, item)}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-sm btn-danger"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Budget-Modal */}
      <BaseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
      >
        <h2>{editingBudget ? 'Budget bearbeiten' : 'Neues Budget erstellen'}</h2>
        <form onSubmit={editingBudget ? handleUpdateBudget : handleCreateBudget}>
          <div className="form-group">
            <label>Projekt *</label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              required
              disabled={!!editingBudget}
            >
              <option value="">Projekt wählen...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                  {project.customer && ` - ${project.customer.name}`}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Budget-Name *</label>
            <input
              type="text"
              value={formData.budgetName}
              onChange={(e) => setFormData({ ...formData, budgetName: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Gesamtbudget (CHF) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.totalBudget}
                onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Geschäftsjahr *</label>
              <input
                type="number"
                value={formData.fiscalYear}
                onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Startdatum *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Enddatum *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Kostenstelle</label>
            <select
              value={formData.costCenterId}
              onChange={(e) => setFormData({ ...formData, costCenterId: e.target.value })}
            >
              <option value="">Keine</option>
              {costCenters.map((cc) => (
                <option key={cc.id} value={cc.id}>
                  {cc.code} - {cc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Notizen</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              Abbrechen
            </button>
            <button type="submit" className="btn-primary">
              {editingBudget ? 'Aktualisieren' : 'Erstellen'}
            </button>
          </div>
        </form>
      </BaseModal>

      {/* Item-Modal */}
      <BaseModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          resetItemForm();
        }}
      >
        <h2>{editingItem ? 'Position bearbeiten' : 'Neue Position hinzufügen'}</h2>
        <form onSubmit={editingItem ? handleUpdateItem : handleAddItem}>
          <div className="form-group">
            <label>Kategorie *</label>
            <select
              value={itemFormData.category}
              onChange={(e) => setItemFormData({ ...itemFormData, category: e.target.value })}
              required
            >
              <option value="LABOR">Personal / Arbeitsstunden</option>
              <option value="MATERIALS">Material</option>
              <option value="INVENTORY">Lagerbestand</option>
              <option value="EXTERNAL_SERVICES">Externe Dienstleistungen</option>
              <option value="OVERHEAD">Gemeinkosten</option>
              <option value="OTHER">Sonstiges</option>
            </select>
          </div>

          <div className="form-group">
            <label>Positionsname *</label>
            <input
              type="text"
              value={itemFormData.itemName}
              onChange={(e) => setItemFormData({ ...itemFormData, itemName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Beschreibung</label>
            <textarea
              value={itemFormData.description}
              onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
              rows={2}
            />
          </div>

          {itemFormData.category === 'INVENTORY' && (
            <div className="form-group">
              <label>Lagerartikel</label>
              <select
                value={itemFormData.inventoryItemId}
                onChange={(e) =>
                  setItemFormData({ ...itemFormData, inventoryItemId: e.target.value })
                }
              >
                <option value="">Wählen...</option>
                {inventoryItems.map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {item.article?.name} ({item.article?.articleNumber})
                  </option>
                ))}
              </select>
            </div>
          )}

          {itemFormData.category === 'LABOR' ? (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Geplante Stunden</label>
                  <input
                    type="number"
                    step="0.1"
                    value={itemFormData.plannedHours}
                    onChange={(e) =>
                      setItemFormData({ ...itemFormData, plannedHours: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Stundensatz (CHF)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemFormData.hourlyRate}
                    onChange={(e) =>
                      setItemFormData({ ...itemFormData, hourlyRate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Tatsächliche Stunden</label>
                  <input
                    type="number"
                    step="0.1"
                    value={itemFormData.actualHours}
                    onChange={(e) =>
                      setItemFormData({ ...itemFormData, actualHours: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Tatsächlicher Stundensatz (CHF)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemFormData.actualHourlyRate}
                    onChange={(e) =>
                      setItemFormData({ ...itemFormData, actualHourlyRate: e.target.value })
                    }
                    placeholder="Wenn leer, wird geplanter Satz verwendet"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Geplante Menge</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemFormData.plannedQuantity}
                    onChange={(e) =>
                      setItemFormData({ ...itemFormData, plannedQuantity: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Einzelpreis (CHF)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemFormData.unitPrice}
                    onChange={(e) =>
                      setItemFormData({ ...itemFormData, unitPrice: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Tatsächliche Menge</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemFormData.actualQuantity}
                    onChange={(e) =>
                      setItemFormData({ ...itemFormData, actualQuantity: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Tatsächlicher Einzelpreis (CHF)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemFormData.actualUnitPrice}
                    onChange={(e) =>
                      setItemFormData({ ...itemFormData, actualUnitPrice: e.target.value })
                    }
                    placeholder="Wenn leer, wird geplanter Preis verwendet"
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Kostenstelle</label>
            <select
              value={itemFormData.costCenterId}
              onChange={(e) => setItemFormData({ ...itemFormData, costCenterId: e.target.value })}
            >
              <option value="">Keine</option>
              {costCenters.map((cc) => (
                <option key={cc.id} value={cc.id}>
                  {cc.code} - {cc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Notizen</label>
            <textarea
              value={itemFormData.notes}
              onChange={(e) => setItemFormData({ ...itemFormData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsItemModalOpen(false)}
            >
              Abbrechen
            </button>
            <button type="submit" className="btn-primary">
              {editingItem ? 'Aktualisieren' : 'Hinzufügen'}
            </button>
          </div>
        </form>
      </BaseModal>
    </div>
  );
};

export default ProjectBudgetTab;
