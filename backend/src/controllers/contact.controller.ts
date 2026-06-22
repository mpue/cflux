import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Sichtbarkeits-Filter für Kontakte: Admins sehen alles. Normale Benutzer sehen
// nur Kontakte, die in denselben Gruppen sind wie sie selbst, d.h. Kontakte in
// Kontaktgruppen, die für eine ihrer Benutzergruppen freigegeben sind. Kontakte
// ohne Gruppe bleiben für alle sichtbar.
const buildVisibilityWhere = async (req: AuthRequest) => {
  if (req.user?.role === 'ADMIN') {
    return {};
  }

  const memberships = await prisma.userGroupMembership.findMany({
    where: { userId: req.user!.id },
    select: { userGroupId: true },
  });
  const userGroupIds = memberships.map((m) => m.userGroupId);

  return {
    OR: [
      { contactGroupId: null },
      { contactGroup: { visibleToGroups: { some: { id: { in: userGroupIds } } } } },
    ],
  };
};

// Einzelnen Kontakt unter Berücksichtigung der Sichtbarkeit laden. Liefert null,
// wenn der Kontakt nicht existiert oder für den Benutzer nicht sichtbar ist.
const findVisibleContact = async (req: AuthRequest, id: string) => {
  const visibilityWhere = await buildVisibilityWhere(req);
  return prisma.contact.findFirst({
    where: { id, ...visibilityWhere },
    include: contactInclude,
  });
};

const contactInclude = {
  contactGroup: {
    include: {
      visibleToGroups: {
        select: { id: true, name: true, color: true },
      },
    },
  },
};

// ===== KONTAKTE =====

export const getAllContacts = async (req: AuthRequest, res: Response) => {
  try {
    const visibilityWhere = await buildVisibilityWhere(req);

    const contacts = await prisma.contact.findMany({
      where: visibilityWhere,
      include: contactInclude,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Kontakte' });
  }
};

export const getContactById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const contact = await findVisibleContact(req, id);

    if (!contact) {
      return res.status(404).json({ error: 'Kontakt nicht gefunden' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Kontakts' });
  }
};

export const createContact = async (req: AuthRequest, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      company,
      position,
      email,
      phone,
      mobile,
      street,
      zipCode,
      city,
      country,
      category,
      notes,
      contactGroupId,
    } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'Vor- und Nachname sind erforderlich' });
    }

    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        company: company || null,
        position: position || null,
        email: email || null,
        phone: phone || null,
        mobile: mobile || null,
        street: street || null,
        zipCode: zipCode || null,
        city: city || null,
        country: country || null,
        category: category || null,
        notes: notes || null,
        contactGroupId: contactGroupId || null,
      },
      include: contactInclude,
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Kontakts' });
  }
};

export const updateContact = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existing = await findVisibleContact(req, id);
    if (!existing) {
      return res.status(404).json({ error: 'Kontakt nicht gefunden' });
    }

    const fields = [
      'firstName',
      'lastName',
      'company',
      'position',
      'email',
      'phone',
      'mobile',
      'street',
      'zipCode',
      'city',
      'country',
      'category',
      'notes',
      'contactGroupId',
      'isActive',
    ] as const;

    const updateData: Record<string, unknown> = {};
    for (const field of fields) {
      if (data[field] !== undefined) {
        if (field === 'isActive') {
          updateData[field] = data[field];
        } else if (field === 'contactGroupId') {
          updateData[field] = data[field] || null;
        } else {
          updateData[field] = data[field] || null;
        }
      }
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: updateData,
      include: contactInclude,
    });

    res.json(contact);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Kontakts' });
  }
};

export const deleteContact = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const contact = await findVisibleContact(req, id);
    if (!contact) {
      return res.status(404).json({ error: 'Kontakt nicht gefunden' });
    }

    await prisma.contact.delete({ where: { id } });

    res.json({ message: 'Kontakt erfolgreich gelöscht' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Kontakts' });
  }
};

// ===== MITARBEITER-SYNCHRONISATION (Mitarbeiter -> Kontakte, eine Richtung) =====

export const syncEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const { contactGroupId } = req.body;

    if (!contactGroupId) {
      return res.status(400).json({ error: 'Eine Ziel-Kontaktgruppe ist erforderlich' });
    }

    const group = await prisma.contactGroup.findUnique({ where: { id: contactGroupId } });
    if (!group) {
      return res.status(404).json({ error: 'Kontaktgruppe nicht gefunden' });
    }

    const employees = await prisma.employee.findMany({
      where: { isActive: true },
    });

    const result = { created: 0, updated: 0, skipped: 0 };

    for (const emp of employees) {
      // Adresse aus Straße + Hausnummer zusammensetzen, PLZ aus postalCode/zipCode.
      const street = [emp.street, emp.streetNumber].filter(Boolean).join(' ') || null;
      const zipCode = emp.postalCode || emp.zipCode || null;

      const data = {
        firstName: emp.firstName,
        lastName: emp.lastName,
        company: null as string | null,
        position: emp.position || null,
        email: emp.email || null,
        phone: emp.phone || null,
        mobile: emp.mobile || null,
        street,
        zipCode,
        city: emp.city || null,
        country: emp.country || null,
        category: 'Intern',
        contactGroupId,
      };

      // Bestehenden synchronisierten Kontakt anhand der employeeId finden.
      const existing = await prisma.contact.findUnique({ where: { employeeId: emp.id } });

      if (existing) {
        await prisma.contact.update({
          where: { id: existing.id },
          data,
        });
        result.updated++;
      } else {
        await prisma.contact.create({
          data: {
            ...data,
            employeeId: emp.id,
          },
        });
        result.created++;
      }
    }

    res.json({
      message: 'Mitarbeiter erfolgreich synchronisiert',
      result,
    });
  } catch (error) {
    console.error('Error syncing employees to contacts:', error);
    res.status(500).json({ error: 'Fehler bei der Mitarbeiter-Synchronisation' });
  }
};

// ===== KONTAKTGRUPPEN =====

const contactGroupInclude = {
  visibleToGroups: {
    select: { id: true, name: true, color: true },
  },
  _count: {
    select: { contacts: true },
  },
};

export const getAllContactGroups = async (_req: AuthRequest, res: Response) => {
  try {
    const groups = await prisma.contactGroup.findMany({
      include: contactGroupInclude,
      orderBy: { name: 'asc' },
    });

    res.json(groups);
  } catch (error) {
    console.error('Error fetching contact groups:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Kontaktgruppen' });
  }
};

export const createContactGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, color, userGroupIds } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name der Kontaktgruppe ist erforderlich' });
    }

    const group = await prisma.contactGroup.create({
      data: {
        name,
        description: description || null,
        color: color || null,
        visibleToGroups: Array.isArray(userGroupIds) && userGroupIds.length
          ? { connect: userGroupIds.map((gid: string) => ({ id: gid })) }
          : undefined,
      },
      include: contactGroupInclude,
    });

    res.status(201).json(group);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Eine Kontaktgruppe mit diesem Namen existiert bereits' });
    }
    console.error('Error creating contact group:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Kontaktgruppe' });
  }
};

export const updateContactGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, color, isActive, userGroupIds } = req.body;

    const existing = await prisma.contactGroup.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Kontaktgruppe nicht gefunden' });
    }

    const group = await prisma.contactGroup.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        description: description !== undefined ? description || null : existing.description,
        color: color !== undefined ? color || null : existing.color,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        // Wenn userGroupIds übergeben wird, die Sichtbarkeit komplett ersetzen.
        ...(userGroupIds !== undefined && {
          visibleToGroups: {
            set: Array.isArray(userGroupIds)
              ? userGroupIds.map((gid: string) => ({ id: gid }))
              : [],
          },
        }),
      },
      include: contactGroupInclude,
    });

    res.json(group);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Eine Kontaktgruppe mit diesem Namen existiert bereits' });
    }
    console.error('Error updating contact group:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Kontaktgruppe' });
  }
};

export const deleteContactGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const group = await prisma.contactGroup.findUnique({ where: { id } });
    if (!group) {
      return res.status(404).json({ error: 'Kontaktgruppe nicht gefunden' });
    }

    // Kontakte bleiben erhalten; ihre contactGroupId wird durch onDelete: SetNull geleert.
    await prisma.contactGroup.delete({ where: { id } });

    res.json({ message: 'Kontaktgruppe erfolgreich gelöscht' });
  } catch (error) {
    console.error('Error deleting contact group:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Kontaktgruppe' });
  }
};
