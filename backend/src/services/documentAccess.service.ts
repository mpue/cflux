import { DocumentPermissionLevel } from '@prisma/client';
import { prisma } from '../lib/prisma';

/**
 * Zugriffspruefung fuer Intranet-Dokumente.
 *
 * Die Regel in einem Satz: ein Knoten erbt die Rechte des naechsten Vorfahren,
 * der welche gesetzt hat. Sind im ganzen Pfad bis zur Wurzel keine gesetzt, ist
 * der Knoten offen fuer jeden mit dem Intranet-Modul.
 *
 * Damit wirkt ein Recht auf einem Ordner fuer alles darin — auch fuer spaeter
 * angelegte oder hineinverschobene Dokumente, ohne dass irgendetwas nachgezogen
 * werden muesste. Vorher schaute die Pruefung nur auf den Knoten selbst; ein
 * geschuetzter Ordner liess seinen kompletten Inhalt offen.
 *
 * Die Spalte `inherited` auf DocumentNodeGroupPermission bleibt ungenutzt: sie
 * war fuer den anderen Weg gedacht (Rechte beim Setzen nach unten schreiben),
 * und der kann auseinanderlaufen, sobald jemand etwas verschiebt.
 */

const RANK: Record<DocumentPermissionLevel, number> = {
  READ: 1,
  WRITE: 2,
  ADMIN: 3,
};

/**
 * Obergrenze fuer den Weg nach oben. Ein Zyklus in parentId sollte es nicht
 * geben, wuerde hier aber sonst zur Endlosschleife.
 */
const MAX_DEPTH = 64;

interface NodePermission {
  userGroupId: string;
  permissionLevel: DocumentPermissionLevel;
}

const loadUserGroupIds = async (userId: string): Promise<string[]> => {
  const memberships = await prisma.userGroupMembership.findMany({
    where: { userId, userGroup: { isActive: true } },
    select: { userGroupId: true },
  });

  return memberships.map((m) => m.userGroupId);
};

/** Deckt einer der Gruppen des Users die verlangte Stufe ab? */
const satisfies = (
  permissions: NodePermission[],
  groupIds: string[],
  required: DocumentPermissionLevel
): boolean =>
  permissions.some(
    (p) => groupIds.includes(p.userGroupId) && RANK[p.permissionLevel] >= RANK[required]
  );

/**
 * Prueft einen einzelnen Knoten. Laeuft den Pfad nach oben, bis Rechte gefunden
 * sind — fuer die Tiefen eines Dokumentenbaums sind das wenige Abfragen.
 * Fuer Listen stattdessen createAccessFilter benutzen.
 */
export const hasNodeAccess = async (
  userId: string,
  nodeId: string,
  required: DocumentPermissionLevel = 'READ'
): Promise<boolean> => {
  const groupIds = await loadUserGroupIds(userId);

  let currentId: string | null = nodeId;

  for (let depth = 0; currentId && depth < MAX_DEPTH; depth++) {
    const node: { parentId: string | null; groupPermissions: NodePermission[] } | null =
      await prisma.documentNode.findUnique({
        where: { id: currentId },
        select: {
          parentId: true,
          groupPermissions: { select: { userGroupId: true, permissionLevel: true } },
        },
      });

    if (!node) break;

    if (node.groupPermissions.length > 0) {
      // Der naechstgelegene Vorfahre mit Rechten entscheidet — auch wenn er
      // den Zugriff verweigert. Sonst liesse sich eine Sperre dadurch umgehen,
      // dass weiter oben etwas Offeneres steht.
      return satisfies(node.groupPermissions, groupIds, required);
    }

    currentId = node.parentId;
  }

  // Nirgends im Pfad Rechte gesetzt: offen.
  return true;
};

/** Prueft ueber den Anhang hinweg das Dokument, zu dem er gehoert. */
export const hasAttachmentAccess = async (
  userId: string,
  attachmentId: string,
  required: DocumentPermissionLevel = 'READ'
): Promise<boolean> => {
  const attachment = await prisma.documentNodeAttachment.findUnique({
    where: { id: attachmentId },
    select: { documentNodeId: true },
  });

  // Gibt es den Anhang nicht, entscheidet der Aufrufer ueber die Antwort;
  // hier ist nichts zu verweigern.
  if (!attachment) return true;

  return hasNodeAccess(userId, attachment.documentNodeId, required);
};

export interface AccessFilter {
  /** Darf der User diesen Knoten auf der verlangten Stufe? */
  canAccess(nodeId: string, required?: DocumentPermissionLevel): boolean;
}

/**
 * Fuer Listen und Baeume: laedt Elternbeziehungen und Rechte einmal und
 * entscheidet danach im Speicher.
 *
 * Vorher lief pro Knoten eine eigene Abfrage — bei einem Baum mit ein paar
 * hundert Dokumenten waren das ein paar hundert Rundreisen zur Datenbank.
 */
export const createAccessFilter = async (userId: string): Promise<AccessFilter> => {
  const [groupIds, nodes, permissions] = await Promise.all([
    loadUserGroupIds(userId),
    prisma.documentNode.findMany({ select: { id: true, parentId: true } }),
    prisma.documentNodeGroupPermission.findMany({
      select: { documentNodeId: true, userGroupId: true, permissionLevel: true },
    }),
  ]);

  const parentOf = new Map(nodes.map((n) => [n.id, n.parentId]));

  const permsOf = new Map<string, NodePermission[]>();
  for (const p of permissions) {
    const list = permsOf.get(p.documentNodeId);
    const entry = { userGroupId: p.userGroupId, permissionLevel: p.permissionLevel };
    if (list) list.push(entry);
    else permsOf.set(p.documentNodeId, [entry]);
  }

  return {
    canAccess(nodeId: string, required: DocumentPermissionLevel = 'READ'): boolean {
      let currentId: string | null | undefined = nodeId;

      for (let depth = 0; currentId && depth < MAX_DEPTH; depth++) {
        const perms = permsOf.get(currentId);
        if (perms?.length) {
          return satisfies(perms, groupIds, required);
        }
        currentId = parentOf.get(currentId);
      }

      return true;
    },
  };
};
