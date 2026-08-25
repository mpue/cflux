import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { hasProjectAccess, getAccessibleProjectIds, requireProjectAccess } from '../middleware/projectAccess';

const admin = { id: 'admin-1', role: UserRole.ADMIN };
const user = { id: 'user-1', role: UserRole.USER };

const mockAssignments = (rows: Array<{ userId: string; projectId: string }>) => {
  (prisma.projectAssignment.findFirst as jest.Mock).mockImplementation((args: any) =>
    Promise.resolve(
      rows.find(
        (row) => row.userId === args.where.userId && row.projectId === args.where.projectId
      ) || null
    )
  );
  (prisma.projectAssignment.findMany as jest.Mock).mockImplementation((args: any) =>
    Promise.resolve(rows.filter((row) => row.userId === args.where.userId))
  );
};

describe('projectAccess', () => {
  describe('hasProjectAccess', () => {
    it('erlaubt Admins jedes Projekt', async () => {
      mockAssignments([]);

      await expect(hasProjectAccess(admin, 'project-1')).resolves.toBe(true);
      expect(prisma.projectAssignment.findFirst).not.toHaveBeenCalled();
    });

    it('erlaubt einem Benutzer nur zugeordnete Projekte', async () => {
      mockAssignments([{ userId: 'user-1', projectId: 'project-1' }]);

      await expect(hasProjectAccess(user, 'project-1')).resolves.toBe(true);
      await expect(hasProjectAccess(user, 'project-2')).resolves.toBe(false);
    });
  });

  describe('getAccessibleProjectIds', () => {
    it('liefert null (= keine Einschraenkung) fuer Admins', async () => {
      await expect(getAccessibleProjectIds(admin)).resolves.toBeNull();
    });

    it('liefert die zugeordneten Projekt-IDs', async () => {
      mockAssignments([
        { userId: 'user-1', projectId: 'project-1' },
        { userId: 'user-1', projectId: 'project-3' },
        { userId: 'user-2', projectId: 'project-2' },
      ]);

      await expect(getAccessibleProjectIds(user)).resolves.toEqual(['project-1', 'project-3']);
    });
  });

  describe('requireProjectAccess', () => {
    const buildRes = () => {
      const res: any = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    };

    it('laesst zugeordnete Benutzer durch', async () => {
      mockAssignments([{ userId: 'user-1', projectId: 'project-1' }]);

      const req: any = { user, params: { projectId: 'project-1' } };
      const res = buildRes();
      const next = jest.fn();

      await requireProjectAccess()(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('blockt nicht zugeordnete Benutzer mit 403', async () => {
      mockAssignments([]);

      const req: any = { user, params: { projectId: 'project-9' } };
      const res = buildRes();
      const next = jest.fn();

      await requireProjectAccess()(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('liest die Projekt-ID auch aus dem Body', async () => {
      mockAssignments([{ userId: 'user-1', projectId: 'project-1' }]);

      const req: any = { user, body: { projectId: 'project-1' } };
      const res = buildRes();
      const next = jest.fn();

      await requireProjectAccess('body')(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('antwortet mit 400, wenn keine Projekt-ID mitkommt', async () => {
      const req: any = { user, params: {} };
      const res = buildRes();
      const next = jest.fn();

      await requireProjectAccess()(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
