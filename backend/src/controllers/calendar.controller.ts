import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { calendarService } from '../services/calendar.service';
import { CalendarAttendeeStatus, CalendarEventType } from '@prisma/client';

export const calendarController = {
  async getEvents(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { from, to } = req.query;

      const events = await calendarService.getEvents(
        userId,
        from ? new Date(from as string) : undefined,
        to ? new Date(to as string) : undefined,
      );

      res.json(events);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      res.status(500).json({ error: 'Failed to fetch calendar events' });
    }
  },

  async getEventById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const event = await calendarService.getEventById(id, userId);
      if (!event) {
        res.status(404).json({ error: 'Event not found' });
        return;
      }

      res.json(event);
    } catch (error) {
      console.error('Error fetching calendar event:', error);
      res.status(500).json({ error: 'Failed to fetch calendar event' });
    }
  },

  async createEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { title, description, startDate, endDate, allDay, location, color, eventType, isPrivate, attendeeIds } = req.body;

      if (!title || !startDate || !endDate) {
        res.status(400).json({ error: 'title, startDate and endDate are required' });
        return;
      }

      const event = await calendarService.createEvent(userId, {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        allDay: allDay ?? false,
        location,
        color,
        eventType: eventType as CalendarEventType,
        isPrivate: isPrivate ?? false,
        attendeeIds: attendeeIds ?? [],
      });

      res.status(201).json(event);
    } catch (error) {
      console.error('Error creating calendar event:', error);
      res.status(500).json({ error: 'Failed to create calendar event' });
    }
  },

  async updateEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { title, description, startDate, endDate, allDay, location, color, eventType, isPrivate, attendeeIds } = req.body;

      const event = await calendarService.updateEvent(id, userId, {
        title,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        allDay,
        location,
        color,
        eventType: eventType as CalendarEventType,
        isPrivate,
        attendeeIds,
      });

      if (!event) {
        res.status(404).json({ error: 'Event not found or not authorized' });
        return;
      }

      res.json(event);
    } catch (error) {
      console.error('Error updating calendar event:', error);
      res.status(500).json({ error: 'Failed to update calendar event' });
    }
  },

  async deleteEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const result = await calendarService.deleteEvent(id, userId);
      if (!result) {
        res.status(404).json({ error: 'Event not found or not authorized' });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      res.status(500).json({ error: 'Failed to delete calendar event' });
    }
  },

  async respondToInvite(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { status } = req.body;

      if (!['ACCEPTED', 'DECLINED', 'PENDING'].includes(status)) {
        res.status(400).json({ error: 'Invalid status. Must be ACCEPTED, DECLINED, or PENDING' });
        return;
      }

      const result = await calendarService.respondToInvite(id, userId, status as CalendarAttendeeStatus);
      res.json(result);
    } catch (error) {
      console.error('Error responding to invite:', error);
      res.status(500).json({ error: 'Failed to respond to invite' });
    }
  },
};
