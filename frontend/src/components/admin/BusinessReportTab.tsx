import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { reportService } from '../../services/report.service';
import * as invoiceService from '../../services/invoiceService';
import orderService from '../../services/order.service';
import { projectService } from '../../services/project.service';
import { userService } from '../../services/user.service';
import '../../styles/BusinessReport.css';

interface BusinessMetrics {
  revenue: {
    total: number;
    paid: number;
    outstanding: number;
    overdue: number;
    byMonth: Array<{ month: string; amount: number }>;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    onHold: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  timeTracking: {
    totalHours: number;
    billableHours: number;
    nonBillableHours: number;
    overtimeHours: number;
  };
  hr: {
    totalEmployees: number;
    activeEmployees: number;
    departments: Array<{ name: string; count: number }>;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    totalValue: number;
  };
}

export const BusinessReportTab: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    setDefaultDates();
  }, []);

  const setDefaultDates = () => {
    const now = new Date();
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
    setStartDate(firstDayOfYear.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  };

  useEffect(() => {
    if (startDate && endDate) {
      loadData();
    }
  }, [startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [invoices, projects, users, orders, timeReports] = await Promise.all([
        invoiceService.getAllInvoices(),
        projectService.getAllProjects(),
        userService.getAllUsersAdmin(),
        orderService.getOrders().catch(() => ({ orders: [] })),
        reportService.getAllUsersSummary(startDate, endDate)
      ]);

      // Filter data by date range
      const filteredInvoices = invoices.filter((inv: any) => {
        const invDate = new Date(inv.createdAt);
        return invDate >= new Date(startDate) && invDate <= new Date(endDate);
      });

      // Calculate revenue metrics
      const revenueMetrics = {
        total: filteredInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0),
        paid: filteredInvoices
          .filter((inv: any) => inv.status === 'PAID')
          .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0),
        outstanding: filteredInvoices
          .filter((inv: any) => inv.status === 'SENT' || inv.status === 'OVERDUE')
          .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0),
        overdue: filteredInvoices
          .filter((inv: any) => inv.status === 'OVERDUE')
          .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0),
        byMonth: calculateRevenueByMonth(filteredInvoices)
      };

      // Calculate project metrics
      const projectMetrics = {
        total: projects.length,
        active: projects.filter((p: any) => p.status === 'ACTIVE').length,
        completed: projects.filter((p: any) => p.status === 'COMPLETED').length,
        onHold: projects.filter((p: any) => p.status === 'ON_HOLD').length,
        byStatus: [
          { status: 'Planung', count: projects.filter((p: any) => p.status === 'PLANNING').length },
          { status: 'Aktiv', count: projects.filter((p: any) => p.status === 'ACTIVE').length },
          { status: 'Pausiert', count: projects.filter((p: any) => p.status === 'ON_HOLD').length },
          { status: 'Abgeschlossen', count: projects.filter((p: any) => p.status === 'COMPLETED').length },
          { status: 'Abgebrochen', count: projects.filter((p: any) => p.status === 'CANCELLED').length }
        ].filter(item => item.count > 0)
      };

      // Calculate time tracking metrics
      const totalHours = timeReports.reduce((sum: number, report: any) => 
        sum + (report.totalHours || 0), 0);
      
      const timeMetrics = {
        totalHours: totalHours,
        billableHours: totalHours * 0.75, // Estimation
        nonBillableHours: totalHours * 0.25,
        overtimeHours: timeReports.reduce((sum: number, report: any) => 
          sum + (report.overtime || 0), 0)
      };

      // Calculate HR metrics
      const activeEmployees = users.filter((u: any) => u.isActive);
      const hrMetrics = {
        totalEmployees: users.length,
        activeEmployees: activeEmployees.length,
        departments: calculateDepartmentDistribution(activeEmployees)
      };

      // Calculate order metrics
      const ordersList = Array.isArray(orders) ? orders : (orders.orders || []);
      const orderMetrics = {
        total: ordersList.length,
        pending: ordersList.filter((o: any) => 
          o.status === 'DRAFT' || o.status === 'REQUESTED' || o.status === 'APPROVED'
        ).length,
        completed: ordersList.filter((o: any) => o.status === 'RECEIVED').length,
        totalValue: ordersList.reduce((sum: number, order: any) => 
          sum + (order.grandTotal || order.totalPrice || 0), 0)
      };

      setMetrics({
        revenue: revenueMetrics,
        projects: projectMetrics,
        timeTracking: timeMetrics,
        hr: hrMetrics,
        orders: orderMetrics
      });

    } catch (error: any) {
      console.error('Error loading business report:', error);
      setError('Fehler beim Laden der Geschäftsdaten');
    } finally {
      setLoading(false);
    }
  };

  const calculateRevenueByMonth = (invoices: any[]) => {
    const monthData: { [key: string]: number } = {};
    
    invoices.forEach((inv: any) => {
      if (inv.status === 'PAID' && inv.paidAt) {
        const date = new Date(inv.paidAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthData[monthKey] = (monthData[monthKey] || 0) + (inv.total || 0);
      }
    });

    return Object.entries(monthData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, amount]) => ({
        month: new Date(month + '-01').toLocaleDateString('de-DE', { month: 'short', year: 'numeric' }),
        amount
      }));
  };

  const calculateDepartmentDistribution = (employees: any[]) => {
    const deptCount: { [key: string]: number } = {};
    
    employees.forEach((emp: any) => {
      const dept = emp.employeeProfile?.department || emp.department || 'Nicht zugewiesen';
      deptCount[dept] = (deptCount[dept] || 0) + 1;
    });

    return Object.entries(deptCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount);
  };

  const formatNumber = (num: number, decimals: number = 0) => {
    return new Intl.NumberFormat('de-CH', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  const exportToPDF = async () => {
    try {
      // Create a printable version
      window.print();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Fehler beim PDF-Export');
    }
  };

  if (loading && !metrics) {
    return (
      <div className="business-report-container">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner"></div>
          <p>Lade Geschäftsdaten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="business-report-container">
      <div className="report-header no-print">
        <h2>📊 Geschäftsbericht</h2>
        <div className="report-actions">
          <div className="date-filters">
            <label>
              Von:
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label>
              Bis:
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
          </div>
          <button className="btn btn-primary" onClick={exportToPDF} disabled={loading}>
            📄 Als PDF exportieren
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {metrics && (
        <>
          {/* Executive Summary */}
          <div className="report-section executive-summary">
            <h3>Executive Summary</h3>
            <div className="metrics-grid">
              <div className="metric-card revenue">
                <div className="metric-icon">💰</div>
                <div className="metric-content">
                  <div className="metric-value">{formatCurrency(metrics.revenue.total)}</div>
                  <div className="metric-label">Gesamtumsatz</div>
                  <div className="metric-detail">
                    <span className="positive">✓ {formatCurrency(metrics.revenue.paid)} bezahlt</span>
                    {metrics.revenue.overdue > 0 && (
                      <span className="negative">⚠ {formatCurrency(metrics.revenue.overdue)} überfällig</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="metric-card projects">
                <div className="metric-icon">📁</div>
                <div className="metric-content">
                  <div className="metric-value">{metrics.projects.total}</div>
                  <div className="metric-label">Projekte</div>
                  <div className="metric-detail">
                    {metrics.projects.active} aktiv · {metrics.projects.completed} abgeschlossen
                  </div>
                </div>
              </div>

              <div className="metric-card time">
                <div className="metric-icon">⏱️</div>
                <div className="metric-content">
                  <div className="metric-value">{formatNumber(metrics.timeTracking.totalHours, 0)}h</div>
                  <div className="metric-label">Gesamtstunden</div>
                  <div className="metric-detail">
                    {formatNumber(metrics.timeTracking.billableHours, 0)}h verrechenbar
                  </div>
                </div>
              </div>

              <div className="metric-card employees">
                <div className="metric-icon">👥</div>
                <div className="metric-content">
                  <div className="metric-value">{metrics.hr.activeEmployees}</div>
                  <div className="metric-label">Aktive Mitarbeiter</div>
                  <div className="metric-detail">
                    {metrics.hr.departments.length} Abteilungen
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Analysis */}
          <div className="report-section">
            <h3>Umsatzanalyse</h3>
            <div className="chart-row">
              <div className="chart-container" style={{ flex: 2 }}>
                <h4>Umsatz nach Monat</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.revenue.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#0088FE" 
                      name="Umsatz"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container" style={{ flex: 1 }}>
                <h4>Zahlungsstatus</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Bezahlt', value: metrics.revenue.paid },
                        { name: 'Ausstehend', value: metrics.revenue.outstanding - metrics.revenue.overdue },
                        { name: 'Überfällig', value: metrics.revenue.overdue }
                      ].filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#00C49F" />
                      <Cell fill="#FFBB28" />
                      <Cell fill="#FF8042" />
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Project Status */}
          <div className="report-section">
            <h3>Projektstatus</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.projects.byStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#0088FE" name="Anzahl Projekte">
                    {metrics.projects.byStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Time Tracking Analysis */}
          <div className="report-section">
            <h3>Zeiterfassung</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { 
                      category: 'Stunden', 
                      Verrechenbar: metrics.timeTracking.billableHours,
                      'Nicht verrechenbar': metrics.timeTracking.nonBillableHours,
                      Überstunden: metrics.timeTracking.overtimeHours
                    }
                  ]}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Verrechenbar" fill="#00C49F" />
                  <Bar dataKey="Nicht verrechenbar" fill="#FFBB28" />
                  <Bar dataKey="Überstunden" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* HR Overview */}
          <div className="report-section">
            <h3>Personalübersicht</h3>
            <div className="chart-container">
              <h4>Mitarbeiter nach Abteilung</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.hr.departments}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Mitarbeiter">
                    {metrics.hr.departments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Footer */}
          <div className="report-footer">
            <p>
              Bericht erstellt am: {new Date().toLocaleDateString('de-DE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p>Zeitraum: {new Date(startDate).toLocaleDateString('de-DE')} - {new Date(endDate).toLocaleDateString('de-DE')}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default BusinessReportTab;
