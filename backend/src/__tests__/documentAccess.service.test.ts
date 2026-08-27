import { prisma } from '../lib/prisma';
import {
  createAccessFilter,
  hasAttachmentAccess,
  hasNodeAccess,
} from '../services/documentAccess.service';

/**
 * Die Regel: ein Knoten erbt die Rechte des naechsten Vorfahren, der welche
 * gesetzt hat. Nirgends im Pfad Rechte gesetzt heisst offen.
 *
 * Vorher schaute die Pruefung nur auf den Knoten selbst — ein geschuetzter
 * Ordner liess damit seinen kompletten Inhalt offen. Genau das halten die
 * Tests unten fest.
 */

jest.mock('../lib/prisma', () => ({
  prisma: {
    userGroupMembership: { findMany: jest.fn() },
    documentNode: { findUnique: jest.fn(), findMany: jest.fn() },
    documentNodeGroupPermission: { findMany: jest.fn() },
    documentNodeAttachment: { findUnique: jest.fn() },
  },
}));

/** Der Baum, gegen den geprueft wird. */
const TREE: Record<string, { parentId: string | null; perms: any[] }> = {
  wurzel: { parentId: null, perms: [] },
  offen: { parentId: 'wurzel', perms: [] },
  personal: { parentId: 'wurzel', perms: [{ userGroupId: 'hr', permissionLevel: 'WRITE' }] },
  'personal/vertraege': { parentId: 'personal', perms: [] },
  'personal/vertraege/muster': { parentId: 'personal/vertraege', perms: [] },
  // Ein Unterordner, der die Sperre wieder oeffnet.
  'personal/aushang': {
    parentId: 'personal',
    perms: [{ userGroupId: 'alle', permissionLevel: 'READ' }],
  },
};

const inGroups = (...groupIds: string[]) => {
  (prisma.userGroupMembership.findMany as jest.Mock).mockResolvedValue(
    groupIds.map((userGroupId) => ({ userGroupId }))
  );
};

beforeEach(() => {
  jest.clearAllMocks();

  (prisma.documentNode.findUnique as jest.Mock).mockImplementation(({ where }: any) => {
    const node = TREE[where.id];
    return Promise.resolve(
      node ? { parentId: node.parentId, groupPermissions: node.perms } : null
    );
  });

  (prisma.documentNode.findMany as jest.Mock).mockResolvedValue(
    Object.entries(TREE).map(([id, n]) => ({ id, parentId: n.parentId }))
  );

  (prisma.documentNodeGroupPermission.findMany as jest.Mock).mockResolvedValue(
    Object.entries(TREE).flatMap(([id, n]) =>
      n.perms.map((p) => ({ documentNodeId: id, ...p }))
    )
  );
});

describe('hasNodeAccess — Vererbung', () => {
  it('laesst einen Knoten ohne Rechte irgendwo im Pfad offen', async () => {
    inGroups();
    expect(await hasNodeAccess('u', 'offen')).toBe(true);
  });

  it('wendet das Recht eines Ordners auf sein Dokument an', async () => {
    // Der Kern: "personal/vertraege" hat selbst keine Rechte, erbt aber die
    // Sperre von "personal". Vor der Aenderung war es offen.
    inGroups('vertrieb');
    expect(await hasNodeAccess('u', 'personal/vertraege')).toBe(false);

    inGroups('hr');
    expect(await hasNodeAccess('u', 'personal/vertraege')).toBe(true);
  });

  it('vererbt ueber mehrere Ebenen', async () => {
    inGroups('vertrieb');
    expect(await hasNodeAccess('u', 'personal/vertraege/muster')).toBe(false);

    inGroups('hr');
    expect(await hasNodeAccess('u', 'personal/vertraege/muster')).toBe(true);
  });

  it('laesst den naechstgelegenen Vorfahren entscheiden, auch wenn er oeffnet', async () => {
    inGroups('alle');
    expect(await hasNodeAccess('u', 'personal/aushang')).toBe(true);
    // Das darueber liegende "personal" bleibt trotzdem gesperrt.
    expect(await hasNodeAccess('u', 'personal')).toBe(false);
  });

  it('beachtet die Stufe: READ genuegt nicht fuer WRITE', async () => {
    inGroups('alle');
    expect(await hasNodeAccess('u', 'personal/aushang', 'READ')).toBe(true);
    expect(await hasNodeAccess('u', 'personal/aushang', 'WRITE')).toBe(false);
  });

  it('schliesst niedrigere Stufen in hoeheren ein', async () => {
    inGroups('hr');
    expect(await hasNodeAccess('u', 'personal', 'READ')).toBe(true);
    expect(await hasNodeAccess('u', 'personal', 'WRITE')).toBe(true);
    expect(await hasNodeAccess('u', 'personal', 'ADMIN')).toBe(false);
  });

  it('bricht bei einem Zyklus in parentId ab, statt haengen zu bleiben', async () => {
    (prisma.documentNode.findUnique as jest.Mock).mockImplementation(({ where }: any) =>
      Promise.resolve({
        parentId: where.id === 'a' ? 'b' : 'a',
        groupPermissions: [],
      })
    );
    inGroups();
    await expect(hasNodeAccess('u', 'a')).resolves.toBe(true);
  });
});

describe('hasAttachmentAccess', () => {
  it('erbt die Entscheidung vom Dokument des Anhangs', async () => {
    (prisma.documentNodeAttachment.findUnique as jest.Mock).mockResolvedValue({
      documentNodeId: 'personal/vertraege',
    });

    inGroups('vertrieb');
    expect(await hasAttachmentAccess('u', 'anhang-1')).toBe(false);

    inGroups('hr');
    expect(await hasAttachmentAccess('u', 'anhang-1')).toBe(true);
  });
});

describe('createAccessFilter', () => {
  it('entscheidet wie hasNodeAccess, nur ohne Abfrage je Knoten', async () => {
    inGroups('hr');
    const access = await createAccessFilter('u');

    expect(access.canAccess('offen')).toBe(true);
    expect(access.canAccess('personal')).toBe(true);
    expect(access.canAccess('personal/vertraege/muster')).toBe(true);
    expect(access.canAccess('personal/aushang')).toBe(false); // nur Gruppe "alle"
  });

  it('sperrt Fremde aus dem ganzen Teilbaum aus', async () => {
    inGroups('vertrieb');
    const access = await createAccessFilter('u');

    expect(access.canAccess('offen')).toBe(true);
    expect(access.canAccess('personal')).toBe(false);
    expect(access.canAccess('personal/vertraege')).toBe(false);
    expect(access.canAccess('personal/vertraege/muster')).toBe(false);
  });

  it('laedt die Grunddaten genau einmal, egal wie oft geprueft wird', async () => {
    inGroups('hr');
    const access = await createAccessFilter('u');

    for (const id of Object.keys(TREE)) access.canAccess(id);

    expect(prisma.documentNode.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.documentNodeGroupPermission.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.documentNode.findUnique).not.toHaveBeenCalled();
  });
});
