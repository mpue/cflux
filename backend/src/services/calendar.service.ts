import { PrismaClient, CalendarEventType, CalendarAttendeeStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCalendarEventDto {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay?: boolean;
  location?: string;
  color?: string;
  eventType?: CalendarEventType;
  isPrivate?: boolean;
  attendeeIds?: string[];
}

export interface UpdateCalendarEventDto {
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  allDay?: boolean;
  location?: string;
  color?: string;
  eventType?: CalendarEventType;
  isPrivate?: boolean;
  attendeeIds?: string[];
}

const eventInclude = {
  createdBy: {
    select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
  },
  attendees: {
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
      },
    },
  },
};

export const calendarService = {
  async getEvents(userId: string, from?: Date, to?: Date) {
    const where: any = {
      deletedAt: null,
      OR: [
        { createdById: userId },
        { attendees: { some: { userId } } },
        { isPrivate: false },
      ],
    };

    if (from || to) {
      where.AND = [
        ...(from ? [{ endDate: { gte: from } }] : []),
        ...(to ? [{ startDate: { lte: to } }] : []),
      ];
    }

    return prisma.calendarEvent.findMany({
      where,
      include: eventInclude,
      orderBy: { startDate: 'asc' },
    });
  },

  async getEventById(id: string, userId: string) {
    return prisma.calendarEvent.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [
          { createdById: userId },
          { attendees: { some: { userId } } },
          { isPrivate: false },
        ],
      },
      include: eventInclude,
    });
  },

  async createEvent(userId: string, data: CreateCalendarEventDto) {
    const { attendeeIds = [], ...eventData } = data;

    return prisma.calendarEvent.create({
      data: {
        ...eventData,
        createdById: userId,
        attendees: {
          create: attendeeIds
            .filter((id) => id !== userId)
            .map((attendeeUserId) => ({
              userId: attendeeUserId,
              status: CalendarAttendeeStatus.PENDING,
            })),
        },
      },
      include: eventInclude,
    });
  },

  async updateEvent(id: string, userId: string, data: UpdateCalendarEventDto) {
    const event = await prisma.calendarEvent.findFirst({
      where: { id, deletedAt: null, createdById: userId },
    });
    if (!event) return null;

    const { attendeeIds, ...eventData } = data;

    if (attendeeIds !== undefined) {
      await prisma.calendarEventAttendee.deleteMany({ where: { eventId: id } });
    }

    return prisma.calendarEvent.update({
      where: { id },
      data: {
        ...eventData,
        ...(attendeeIds !== undefined
          ? {
              attendees: {
                create: attendeeIds
                  .filter((uid) => uid !== userId)
                  .map((attendeeUserId) => ({
                    userId: attendeeUserId,
                    status: CalendarAttendeeStatus.PENDING,
                  })),
              },
            }
          : {}),
      },
      include: eventInclude,
    });
  },

  async deleteEvent(id: string, userId: string) {
    const event = await prisma.calendarEvent.findFirst({
      where: { id, deletedAt: null, createdById: userId },
    });
    if (!event) return null;

    return prisma.calendarEvent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async respondToInvite(eventId: string, userId: string, status: CalendarAttendeeStatus) {
    return prisma.calendarEventAttendee.update({
      where: { eventId_userId: { eventId, userId } },
      data: { status },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  },
};
