import React, { useEffect, useState } from 'react';
import { absenceService } from '../services/absence.service';
import { userService } from '../services/user.service';
import { AbsenceRequest, User } from '../types';
import './VacationPlanner.css';

const months = [
  'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
];

const absenceColors: Record<string, string> = {
  VACATION: '#4caf50',
  SICK_LEAVE: '#f44336',
  PERSONAL_LEAVE: '#ff9800',
  UNPAID_LEAVE: '#9e9e9e',
  OTHER: '#2196f3',
};

const VacationPlanner: React.FC = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [absences, setAbsences] = useState<AbsenceRequest[]>([]);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('APPROVED');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    document.title = 'CFlux - Urlaubsplaner';
  }, []);

  useEffect(() => {
    loadData();
  }, [year, filterStatus]);

  useEffect(() => {
    // Filter users by search term
    if (searchTerm) {
      const filtered = allUsers.filter(u => 
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setUsers(filtered);
    } else {
      setUsers(allUsers);
    }
  }, [searchTerm, allUsers]);

  const loadData = async () => {
    const usersData = await userService.getAllUsers();
    setAllUsers(usersData);
    setUsers(usersData);
    
    if (filterStatus === 'ALL') {
      const allAbsences = await absenceService.getAllAbsenceRequests();
      setAbsences(allAbsences);
    } else {
      const filteredAbsences = await absenceService.getAllAbsenceRequests(filterStatus);
      setAbsences(filteredAbsences);
    }
  };

  // Hilfsfunktion: Gibt true zurück, wenn der Tag im Abwesenheitszeitraum liegt
  const isAbsent = (userId: string, date: Date) => {
    const absence = absences.find(a => a.userId === userId &&
      new Date(a.startDate) <= date && new Date(a.endDate) >= date
    );
    
    if (!absence) return null;
    if (filterType !== 'ALL' && absence.type !== filterType) return null;
    return absence;
  };

  // Erzeuge alle Tage des Jahres
  const daysInYear = (year: number) => {
    const days: Date[] = [];
    const d = new Date(year, 0, 1);
    while (d.getFullYear() === year) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return days;
  };

  const days = daysInYear(year);

  return (
    <div className="vacation-planner">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>Urlaubsplaner {year}</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setYear(y => y - 1)} style={{ padding: '8px 16px' }}>‹ {year - 1}</button>
          <span style={{ fontWeight: 'bold', padding: '0 8px' }}>{year}</span>
          <button className="btn btn-secondary" onClick={() => setYear(y => y + 1)} style={{ padding: '8px 16px' }}>{year + 1} ›</button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="vp-filters" style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 8, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px', minWidth: '150px' }}>
          <label style={{ marginRight: 8, fontWeight: 'bold', display: 'block', marginBottom: 4 }}>Benutzer:</label>
          <input
            type="text"
            placeholder="Name eingeben..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ddd', width: '100%', fontSize: '14px' }}
          />
        </div>
        
        <div style={{ flex: '1 1 180px', minWidth: '150px' }}>
          <label style={{ marginRight: 8, fontWeight: 'bold', display: 'block', marginBottom: 4 }}>Typ:</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ddd', width: '100%', fontSize: '14px' }}
          >
            <option value="ALL">Alle Typen</option>
            <option value="VACATION">Urlaub</option>
            <option value="SICK_LEAVE">Krankheit</option>
            <option value="PERSONAL_LEAVE">Persönlich</option>
            <option value="UNPAID_LEAVE">Unbezahlt</option>
            <option value="OTHER">Sonstige</option>
          </select>
        </div>

        <div style={{ flex: '1 1 160px', minWidth: '150px' }}>
          <label style={{ marginRight: 8, fontWeight: 'bold', display: 'block', marginBottom: 4 }}>Status:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ddd', width: '100%', fontSize: '14px' }}
          >
            <option value="APPROVED">Genehmigt</option>
            <option value="PENDING">Ausstehend</option>
            <option value="REJECTED">Abgelehnt</option>
            <option value="ALL">Alle</option>
          </select>
        </div>

        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-end' }}>
          <button 
            className="btn btn-primary" 
            onClick={loadData}
            style={{ padding: '8px 16px' }}
          >
            Aktualisieren
          </button>
        </div>
      </div>

      <div className="vp-table-wrapper">
        <table className="vp-table">
          <thead>
            <tr>
              <th>Benutzer</th>
              {months.map((m, i) => (
                <th key={i} colSpan={new Date(year, i + 1, 0).getDate()}>{m}</th>
              ))}
            </tr>
            <tr>
              <th></th>
              {days.map((d, i) => (
                <td key={i} className="vp-day-header">{d.getDate()}</td>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td className="vp-user">{user.firstName} {user.lastName}</td>
                {days.map((d, i) => {
                  const absence = isAbsent(user.id, d);
                  return (
                    <td
                      key={i}
                      className={absence ? 'vp-absent' : ''}
                      style={absence ? { background: absenceColors[absence.type] } : {}}
                      title={absence ? `${absence.type} (${absence.startDate} - ${absence.endDate})` : ''}
                    ></td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="vp-legend">
        <b>Legende:</b>
        {Object.entries(absenceColors).map(([type, color]) => (
          <span key={type} style={{ background: color, color: '#fff', padding: '2px 8px', marginLeft: 8, borderRadius: 4 }}>{type}</span>
        ))}
      </div>
    </div>
  );
};

export default VacationPlanner;
