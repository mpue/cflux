import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import AppNavbar from '../components/AppNavbar';
import './CalendarPage.css';

// ─── Types ───────────────────────────────────────────────────────────────────

type ViewMode = 'year' | 'month' | 'week';

type EventType = 'APPOINTMENT' | 'MEETING' | 'REMINDER' | 'TASK';

interface Attendee {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  user: { id: string; firstName: string; lastName: string; email: string; avatarUrl?: string };
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  location?: string;
  color: string;
  eventType: EventType;
  isPrivate: boolean;
  createdById: string;
  createdBy: { id: string; firstName: string; lastName: string; email: string };
  attendees: Attendee[];
}

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
  location: string;
  color: string;
  eventType: EventType;
  isPrivate: boolean;
  attendeeIds: string[];
}

const EVENT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  APPOINTMENT: 'Termin',
  MEETING: 'Besprechung',
  REMINDER: 'Erinnerung',
  TASK: 'Aufgabe',
};

const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLocalDateStr(date: Date) {
  return date.toISOString().slice(0, 10);
}
function toLocalTimeStr(date: Date) {
  return date.toTimeString().slice(0, 5);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getMonthDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  // Mon = 0 ... Sun = 6
  const startPad = (first.getDay() + 6) % 7;
  const endPad = (7 - ((last.getDay() + 7) % 7) - 1 + 7) % 7;
  const days: Date[] = [];
  for (let i = startPad; i > 0; i--) {
    days.push(new Date(year, month, 1 - i));
  }
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  for (let i = 1; i <= endPad; i++) {
    days.push(new Date(year, month + 1, i));
  }
  return days;
}

function getWeekDays(date: Date): Date[] {
  const day = (date.getDay() + 6) % 7; // Mon=0
  const monday = new Date(date);
  monday.setDate(date.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((ev) => {
    const start = new Date(ev.startDate);
    const end = new Date(ev.endDate);
    return (
      isSameDay(start, day) ||
      isSameDay(end, day) ||
      (start < day && end > day && !isSameDay(start, end))
    );
  });
}

function defaultForm(date?: Date): EventFormData {
  const now = date || new Date();
  const end = new Date(now);
  end.setHours(end.getHours() + 1);
  return {
    title: '',
    description: '',
    startDate: toLocalDateStr(now),
    startTime: toLocalTimeStr(now),
    endDate: toLocalDateStr(end),
    endTime: toLocalTimeStr(end),
    allDay: false,
    location: '',
    color: '#3B82F6',
    eventType: 'APPOINTMENT',
    isPrivate: false,
    attendeeIds: [],
  };
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────

interface MiniCalendarProps {
  today: Date;
  currentDate: Date;
  events: CalendarEvent[];
  onDayClick: (d: Date) => void;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ today, currentDate, events, onDayClick }) => {
  const [miniDate, setMiniDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const days = getMonthDays(miniDate.getFullYear(), miniDate.getMonth());

  const hasDot = (d: Date) =>
    d.getMonth() === miniDate.getMonth() &&
    events.some((ev) => isSameDay(new Date(ev.startDate), d));

  return (
    <div className="mini-cal">
      <div className="mini-cal-header">
        <button className="mini-cal-nav" onClick={() => setMiniDate(new Date(miniDate.getFullYear(), miniDate.getMonth() - 1, 1))}>‹</button>
        <span className="mini-cal-title">{MONTHS[miniDate.getMonth()]} {miniDate.getFullYear()}</span>
        <button className="mini-cal-nav" onClick={() => setMiniDate(new Date(miniDate.getFullYear(), miniDate.getMonth() + 1, 1))}>›</button>
      </div>
      <div className="mini-cal-grid">
        {WEEKDAYS_SHORT.map((d) => (
          <div key={d} className="mini-cal-wd">{d}</div>
        ))}
        {days.map((d, i) => {
          const isToday = isSameDay(d, today);
          const isOther = d.getMonth() !== miniDate.getMonth();
          const isSelected =
            d.getFullYear() === currentDate.getFullYear() &&
            d.getMonth() === currentDate.getMonth() &&
            !isOther;
          return (
            <div
              key={i}
              className={`mini-cal-day${isOther ? ' other' : ''}${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
              onClick={() => !isOther && onDayClick(d)}
            >
              {d.getDate()}
              {hasDot(d) && <span className="mini-cal-dot" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const today = new Date();

  const [view, setView] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState<EventFormData>(defaultForm());
  const [saving, setSaving] = useState(false);

  // Detail popup
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);
  const [detailPos, setDetailPos] = useState({ x: 0, y: 0 });

  // Users for attendee picker
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);

  // Drag state
  const dragEventRef = useRef<CalendarEvent | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      let from: Date, to: Date;
      if (view === 'year') {
        from = new Date(currentDate.getFullYear(), 0, 1);
        to = new Date(currentDate.getFullYear(), 11, 31);
      } else if (view === 'month') {
        from = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        to = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      } else {
        const week = getWeekDays(currentDate);
        from = week[0];
        to = week[6];
      }
      const res = await api.get('/calendar', {
        params: { from: from.toISOString(), to: to.toISOString() },
      });
      setEvents(res.data);
      setError(null);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Fehler beim Laden der Termine');
    } finally {
      setLoading(false);
    }
  }, [view, currentDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    api.get('/users').then((r) => setAllUsers(r.data)).catch(() => {});
  }, []);

  // ── Navigation ─────────────────────────────────────────────────────────────

  function navigate(dir: -1 | 1) {
    const d = new Date(currentDate);
    if (view === 'year') d.setFullYear(d.getFullYear() + dir);
    else if (view === 'month') d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + dir * 7);
    setCurrentDate(d);
  }

  function goToday() {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  // ── Title ──────────────────────────────────────────────────────────────────

  function headerTitle() {
    if (view === 'year') return currentDate.getFullYear().toString();
    if (view === 'month') return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    const week = getWeekDays(currentDate);
    return `KW ${getISOWeek(week[0])} · ${MONTHS_SHORT[week[0].getMonth()]} ${week[0].getFullYear()}`;
  }

  function getISOWeek(d: Date) {
    const jan4 = new Date(d.getFullYear(), 0, 4);
    const diff = d.getTime() - jan4.getTime();
    return 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
  }

  // ── Modal helpers ──────────────────────────────────────────────────────────

  function openCreate(day?: Date) {
    setEditingEvent(null);
    setForm(defaultForm(day));
    setShowModal(true);
  }

  function openEdit(ev: CalendarEvent) {
    setDetailEvent(null);
    setEditingEvent(ev);
    const s = new Date(ev.startDate);
    const e = new Date(ev.endDate);
    setForm({
      title: ev.title,
      description: ev.description || '',
      startDate: toLocalDateStr(s),
      startTime: ev.allDay ? '00:00' : toLocalTimeStr(s),
      endDate: toLocalDateStr(e),
      endTime: ev.allDay ? '00:00' : toLocalTimeStr(e),
      allDay: ev.allDay,
      location: ev.location || '',
      color: ev.color,
      eventType: ev.eventType,
      isPrivate: ev.isPrivate,
      attendeeIds: ev.attendees.map((a) => a.user.id),
    });
    setShowModal(true);
  }

  async function saveEvent() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const startDate = form.allDay
        ? new Date(form.startDate + 'T00:00:00')
        : new Date(form.startDate + 'T' + form.startTime);
      const endDate = form.allDay
        ? new Date(form.endDate + 'T23:59:59')
        : new Date(form.endDate + 'T' + form.endTime);

      const payload = {
        title: form.title,
        description: form.description || undefined,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        allDay: form.allDay,
        location: form.location || undefined,
        color: form.color,
        eventType: form.eventType,
        isPrivate: form.isPrivate,
        attendeeIds: form.attendeeIds,
      };

      if (editingEvent) {
        await api.put(`/calendar/${editingEvent.id}`, payload);
      } else {
        await api.post('/calendar', payload);
      }
      setShowModal(false);
      fetchEvents();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent(id: string) {
    if (!window.confirm('Termin wirklich löschen?')) return;
    try {
      await api.delete(`/calendar/${id}`);
      setDetailEvent(null);
      fetchEvents();
    } catch {
      alert('Fehler beim Löschen');
    }
  }

  async function respond(eventId: string, status: 'ACCEPTED' | 'DECLINED') {
    try {
      await api.post(`/calendar/${eventId}/respond`, { status });
      fetchEvents();
      setDetailEvent(null);
    } catch {
      alert('Fehler beim Antworten');
    }
  }

  // ── Drag & Drop ────────────────────────────────────────────────────────────

  function onDragStart(ev: React.DragEvent, event: CalendarEvent) {
    dragEventRef.current = event;
    ev.dataTransfer.effectAllowed = 'move';
  }

  async function onDropDay(ev: React.DragEvent, targetDay: Date) {
    ev.preventDefault();
    const event = dragEventRef.current;
    if (!event) return;
    if (event.createdById !== user?.id) return;

    const origStart = new Date(event.startDate);
    const origEnd = new Date(event.endDate);
    const duration = origEnd.getTime() - origStart.getTime();

    const newStart = new Date(targetDay);
    newStart.setHours(origStart.getHours(), origStart.getMinutes(), 0, 0);
    const newEnd = new Date(newStart.getTime() + duration);

    try {
      await api.put(`/calendar/${event.id}`, {
        startDate: newStart.toISOString(),
        endDate: newEnd.toISOString(),
      });
      dragEventRef.current = null;
      fetchEvents();
    } catch {
      alert('Fehler beim Verschieben');
    }
  }

  // ── Event chip ─────────────────────────────────────────────────────────────

  function EventChip({ event, compact = false }: { event: CalendarEvent; compact?: boolean }) {
    return (
      <div
        className={`cal-event-chip${compact ? ' compact' : ''}`}
        style={{ backgroundColor: event.color }}
        draggable={event.createdById === user?.id}
        onDragStart={(e) => onDragStart(e, event)}
        onClick={(e) => {
          e.stopPropagation();
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setDetailPos({ x: rect.left, y: rect.bottom + 6 });
          setDetailEvent(event);
        }}
        title={event.title}
      >
        {!compact && !event.allDay && (
          <span className="cal-event-time">
            {toLocalTimeStr(new Date(event.startDate))}
          </span>
        )}
        <span className="cal-event-title">{event.title}</span>
      </div>
    );
  }

  // ── Views ──────────────────────────────────────────────────────────────────

  function renderMonthView() {
    const days = getMonthDays(currentDate.getFullYear(), currentDate.getMonth());
    return (
      <div className="cal-month-grid">
        {WEEKDAYS_SHORT.map((d) => (
          <div key={d} className="cal-weekday-header">{d}</div>
        ))}
        {days.map((day, idx) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = isSameDay(day, today);
          const dayEvents = getEventsForDay(events, day);
          return (
            <div
              key={idx}
              className={`cal-day-cell${isCurrentMonth ? '' : ' other-month'}${isToday ? ' today' : ''}`}
              onClick={() => openCreate(day)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDropDay(e, day)}
            >
              <span className="cal-day-number">{day.getDate()}</span>
              <div className="cal-day-events">
                {dayEvents.slice(0, 3).map((ev) => (
                  <EventChip key={ev.id} event={ev} compact />
                ))}
                {dayEvents.length > 3 && (
                  <span className="cal-more">+{dayEvents.length - 3} weitere</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderWeekView() {
    const days = getWeekDays(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return (
      <div className="cal-week-container">
        <div className="cal-week-header">
          <div className="cal-week-time-gutter" />
          {days.map((day, i) => (
            <div
              key={i}
              className={`cal-week-day-header${isSameDay(day, today) ? ' today' : ''}`}
            >
              <span className="cal-week-day-name">{WEEKDAYS_SHORT[i]}</span>
              <span
                className={`cal-week-day-num${isSameDay(day, today) ? ' today-badge' : ''}`}
              >
                {day.getDate()}
              </span>
            </div>
          ))}
        </div>
        <div className="cal-week-body">
          <div className="cal-week-time-col">
            {hours.map((h) => (
              <div key={h} className="cal-week-hour-label">
                {h.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
          {days.map((day, di) => {
            const dayEvents = getEventsForDay(events, day).filter((e) => !e.allDay);
            return (
              <div
                key={di}
                className={`cal-week-day-col${isSameDay(day, today) ? ' today-col' : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDropDay(e, day)}
              >
                {hours.map((h) => (
                  <div
                    key={h}
                    className="cal-week-hour-cell"
                    onClick={() => {
                      const d = new Date(day);
                      d.setHours(h, 0, 0, 0);
                      openCreate(d);
                    }}
                  />
                ))}
                {dayEvents.map((ev) => {
                  const start = new Date(ev.startDate);
                  const end = new Date(ev.endDate);
                  const top = (start.getHours() + start.getMinutes() / 60) * 60;
                  const height = Math.max(
                    ((end.getTime() - start.getTime()) / 3600000) * 60,
                    22,
                  );
                  return (
                    <div
                      key={ev.id}
                      className="cal-week-event"
                      style={{ top, height, backgroundColor: ev.color }}
                      draggable={ev.createdById === user?.id}
                      onDragStart={(e) => onDragStart(e, ev)}
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setDetailPos({ x: rect.right + 8, y: rect.top });
                        setDetailEvent(ev);
                      }}
                    >
                      <div className="cal-week-event-title">{ev.title}</div>
                      <div className="cal-week-event-time">
                        {toLocalTimeStr(start)} – {toLocalTimeStr(end)}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderYearView() {
    const year = currentDate.getFullYear();
    return (
      <div className="cal-year-grid">
        {Array.from({ length: 12 }, (_, m) => {
          const days = getMonthDays(year, m);
          const monthEvents = events.filter((ev) => {
            const s = new Date(ev.startDate);
            return s.getFullYear() === year && s.getMonth() === m;
          });
          return (
            <div
              key={m}
              className="cal-year-month"
              onClick={() => {
                setCurrentDate(new Date(year, m, 1));
                setView('month');
              }}
            >
              <div className="cal-year-month-title">{MONTHS_SHORT[m]}</div>
              <div className="cal-year-mini-grid">
                {WEEKDAYS_SHORT.map((d) => (
                  <div key={d} className="cal-year-mini-weekday">{d[0]}</div>
                ))}
                {days.map((day, idx) => {
                  const hasEvents = getEventsForDay(monthEvents, day).length > 0;
                  return (
                    <div
                      key={idx}
                      className={`cal-year-mini-day${day.getMonth() !== m ? ' other' : ''}${isSameDay(day, today) ? ' today' : ''}${hasEvents ? ' has-events' : ''}`}
                    >
                      {day.getDate()}
                    </div>
                  );
                })}
              </div>
              <div className="cal-year-event-count">
                {monthEvents.length > 0 && `${monthEvents.length} Termin${monthEvents.length !== 1 ? 'e' : ''}`}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Event Detail Popup ─────────────────────────────────────────────────────

  function DetailPopup() {
    if (!detailEvent) return null;
    const myAttendee = detailEvent.attendees.find((a) => a.user.id === user?.id);
    const isOwner = detailEvent.createdById === user?.id;

    return (
      <>
        <div className="cal-detail-backdrop" onClick={() => setDetailEvent(null)} />
        <div
          className="cal-detail-popup"
          style={{
            left: Math.min(detailPos.x, window.innerWidth - 340),
            top: Math.min(detailPos.y, window.innerHeight - 300),
          }}
        >
          <div className="cal-detail-color-bar" style={{ backgroundColor: detailEvent.color }} />
          <button className="cal-detail-close" onClick={() => setDetailEvent(null)}>×</button>
          <div className="cal-detail-body">
            <div className="cal-detail-type">{EVENT_TYPE_LABELS[detailEvent.eventType]}</div>
            <h3 className="cal-detail-title">{detailEvent.title}</h3>
            <div className="cal-detail-time">
              {new Date(detailEvent.startDate).toLocaleDateString('de-CH', {
                weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
              })}
              {!detailEvent.allDay && (
                <> · {toLocalTimeStr(new Date(detailEvent.startDate))} – {toLocalTimeStr(new Date(detailEvent.endDate))}</>
              )}
              {detailEvent.allDay && ' · Ganztägig'}
            </div>
            {detailEvent.location && (
              <div className="cal-detail-location">📍 {detailEvent.location}</div>
            )}
            {detailEvent.description && (
              <p className="cal-detail-desc">{detailEvent.description}</p>
            )}
            {detailEvent.attendees.length > 0 && (
              <div className="cal-detail-attendees">
                <div className="cal-detail-attendees-label">Teilnehmer</div>
                {detailEvent.attendees.map((a) => (
                  <div key={a.id} className="cal-detail-attendee">
                    <span className="cal-attendee-name">
                      {a.user.firstName} {a.user.lastName}
                    </span>
                    <span className={`cal-attendee-status ${a.status.toLowerCase()}`}>
                      {a.status === 'ACCEPTED' ? '✓' : a.status === 'DECLINED' ? '✗' : '?'}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="cal-detail-actions">
              {myAttendee && !isOwner && (
                <>
                  {myAttendee.status !== 'ACCEPTED' && (
                    <button className="btn-accept" onClick={() => respond(detailEvent.id, 'ACCEPTED')}>
                      Annehmen
                    </button>
                  )}
                  {myAttendee.status !== 'DECLINED' && (
                    <button className="btn-decline" onClick={() => respond(detailEvent.id, 'DECLINED')}>
                      Ablehnen
                    </button>
                  )}
                </>
              )}
              {isOwner && (
                <>
                  <button className="btn-edit" onClick={() => openEdit(detailEvent)}>
                    Bearbeiten
                  </button>
                  <button className="btn-delete" onClick={() => deleteEvent(detailEvent.id)}>
                    Löschen
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Event Form Modal ───────────────────────────────────────────────────────

  function EventModal() {
    if (!showModal) return null;
    const isMeeting = form.eventType === 'MEETING';

    return (
      <div className="cal-modal-overlay" onClick={() => setShowModal(false)}>
        <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
          <div className="cal-modal-header">
            <h2>{editingEvent ? 'Termin bearbeiten' : 'Neuer Termin'}</h2>
            <button className="cal-modal-close" onClick={() => setShowModal(false)}>×</button>
          </div>
          <div className="cal-modal-body">
            {/* Title */}
            <div className="cal-form-row">
              <input
                className="cal-input cal-input-title"
                placeholder="Titel *"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                autoFocus
              />
            </div>

            {/* Type */}
            <div className="cal-form-row cal-form-row-inline">
              {(Object.entries(EVENT_TYPE_LABELS) as [EventType, string][]).map(([k, v]) => (
                <button
                  key={k}
                  className={`cal-type-btn${form.eventType === k ? ' active' : ''}`}
                  onClick={() => setForm({ ...form, eventType: k })}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* All Day */}
            <div className="cal-form-row cal-form-row-inline">
              <label className="cal-checkbox-label">
                <input
                  type="checkbox"
                  checked={form.allDay}
                  onChange={(e) => setForm({ ...form, allDay: e.target.checked })}
                />
                Ganztägig
              </label>
            </div>

            {/* Dates */}
            <div className="cal-form-row cal-form-row-inline">
              <div className="cal-form-group">
                <label>Start</label>
                <input
                  type="date"
                  className="cal-input"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
                {!form.allDay && (
                  <input
                    type="time"
                    className="cal-input"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  />
                )}
              </div>
              <span className="cal-arrow">→</span>
              <div className="cal-form-group">
                <label>Ende</label>
                <input
                  type="date"
                  className="cal-input"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
                {!form.allDay && (
                  <input
                    type="time"
                    className="cal-input"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  />
                )}
              </div>
            </div>

            {/* Location */}
            <div className="cal-form-row">
              <input
                className="cal-input"
                placeholder="📍 Ort"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="cal-form-row">
              <textarea
                className="cal-input cal-textarea"
                placeholder="Beschreibung"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Color */}
            <div className="cal-form-row cal-form-row-inline">
              <label>Farbe</label>
              <div className="cal-color-picker">
                {EVENT_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`cal-color-swatch${form.color === c ? ' selected' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setForm({ ...form, color: c })}
                  />
                ))}
              </div>
            </div>

            {/* Private */}
            <div className="cal-form-row cal-form-row-inline">
              <label className="cal-checkbox-label">
                <input
                  type="checkbox"
                  checked={form.isPrivate}
                  onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
                />
                Privat (nur für mich sichtbar)
              </label>
            </div>

            {/* Attendees (always for meetings, optional for others) */}
            {(isMeeting || form.attendeeIds.length > 0) && (
              <div className="cal-form-row">
                <label className="cal-label">
                  {isMeeting ? 'Teilnehmer (Besprechung)' : 'Teilnehmer'}
                </label>
                <div className="cal-attendee-list">
                  {allUsers
                    .filter((u) => u.id !== user?.id)
                    .map((u) => {
                      const checked = form.attendeeIds.includes(u.id);
                      return (
                        <label key={u.id} className={`cal-attendee-item${checked ? ' selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const ids = e.target.checked
                                ? [...form.attendeeIds, u.id]
                                : form.attendeeIds.filter((id) => id !== u.id);
                              setForm({ ...form, attendeeIds: ids });
                            }}
                          />
                          {u.firstName} {u.lastName} <span className="cal-attendee-email">({u.email})</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            )}
            {!isMeeting && form.attendeeIds.length === 0 && (
              <div className="cal-form-row">
                <button
                  className="cal-add-attendees-btn"
                  onClick={() => setForm({ ...form, eventType: 'MEETING' })}
                >
                  + Teilnehmer einladen
                </button>
              </div>
            )}
          </div>
          <div className="cal-modal-footer">
            <button className="btn-secondary" onClick={() => setShowModal(false)}>
              Abbrechen
            </button>
            <button className="btn-primary" onClick={saveEvent} disabled={saving || !form.title.trim()}>
              {saving ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <AppNavbar title="Kalender" />
      <div className="cal-page">
      {/* Toolbar */}
      <div className="cal-toolbar">
        <div className="cal-toolbar-left">
          <button className="cal-nav-btn" onClick={() => navigate(-1)}>‹</button>
          <button className="cal-today-btn" onClick={goToday}>Heute</button>
          <button className="cal-nav-btn" onClick={() => navigate(1)}>›</button>
          <h2 className="cal-title">{headerTitle()}</h2>
        </div>
        <div className="cal-toolbar-right">
          <div className="cal-view-tabs">
            {(['year', 'month', 'week'] as ViewMode[]).map((v) => (
              <button
                key={v}
                className={`cal-view-tab${view === v ? ' active' : ''}`}
                onClick={() => setView(v)}
              >
                {v === 'year' ? 'Jahr' : v === 'month' ? 'Monat' : 'Woche'}
              </button>
            ))}
          </div>
          <button className="cal-create-btn" onClick={() => openCreate()}>
            + Neuer Termin
          </button>
        </div>
      </div>

      {/* Body: sidebar + content */}
      <div className="cal-body">
        {/* Left sidebar with mini calendar */}
        <aside className="cal-sidebar">
          <MiniCalendar
            today={today}
            currentDate={currentDate}
            events={events}
            onDayClick={(d) => {
              setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
              setView('month');
            }}
          />
        </aside>

        {/* Content */}
        <div className="cal-content">
          {loading && <div className="cal-loading">Lade Termine…</div>}
          {error && <div className="cal-error">{error}</div>}
          {!loading && !error && (
            <>
              {view === 'month' && renderMonthView()}
              {view === 'week' && renderWeekView()}
              {view === 'year' && renderYearView()}
            </>
          )}
        </div>
      </div>

      <EventModal />
      <DetailPopup />
    </div>
    </>
  );
};

export default CalendarPage;
