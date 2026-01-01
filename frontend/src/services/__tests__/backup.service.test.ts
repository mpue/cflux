import { backupService, Backup, BackupResponse } from '../backup.service';
import api from '../api';

jest.mock('../api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('Backup Service - Complete CRUD Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CREATE Tests
  // ============================================
  describe('CREATE - createBackup', () => {
    it('should create backup successfully', async () => {
      const mockBackupResponse: BackupResponse = {
        message: 'Backup created successfully',
        filename: 'backup_2026-01-01T10-00-00-000Z.json',
        timestamp: '2026-01-01T10:00:00Z',
        size: 1024000,
      };

      mockedApi.post.mockResolvedValue({ data: mockBackupResponse });

      const result = await backupService.createBackup();

      expect(mockedApi.post).toHaveBeenCalledWith('/backup/create');
      expect(result).toEqual(mockBackupResponse);
      expect(result.filename).toContain('backup_2026');
      expect(result.size).toBe(1024000);
    });

    it('should handle backup creation error', async () => {
      mockedApi.post.mockRejectedValue(new Error('Backup creation failed'));

      await expect(backupService.createBackup())
        .rejects.toThrow('Backup creation failed');
    });

    it('should create backup with large size', async () => {
      const mockBackupResponse: BackupResponse = {
        message: 'Backup created successfully',
        filename: 'backup_2026-01-01T10-00-00-000Z.json',
        timestamp: '2026-01-01T10:00:00Z',
        size: 50000000, // 50 MB
      };

      mockedApi.post.mockResolvedValue({ data: mockBackupResponse });

      const result = await backupService.createBackup();

      expect(result.size).toBe(50000000);
    });
  });

  describe('CREATE - uploadBackup', () => {
    it('should upload backup file successfully', async () => {
      const mockFile = new File(['backup content'], 'backup.json', { type: 'application/json' });

      const mockBackupResponse: BackupResponse = {
        message: 'Backup uploaded successfully',
        filename: 'backup.json',
        timestamp: '2026-01-01T10:00:00Z',
        size: 15000,
      };

      mockedApi.post.mockResolvedValue({ data: mockBackupResponse });

      const result = await backupService.uploadBackup(mockFile);

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/backup/upload',
        expect.any(FormData),
        expect.objectContaining({
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      );
      expect(result).toEqual(mockBackupResponse);
    });

    it('should handle upload error', async () => {
      const mockFile = new File(['invalid'], 'invalid.txt', { type: 'text/plain' });

      mockedApi.post.mockRejectedValue(new Error('Invalid backup file'));

      await expect(backupService.uploadBackup(mockFile))
        .rejects.toThrow('Invalid backup file');
    });

    it('should upload large backup file', async () => {
      const largeContent = 'x'.repeat(10000000); // 10 MB
      const mockFile = new File([largeContent], 'large_backup.json', { type: 'application/json' });

      const mockBackupResponse: BackupResponse = {
        message: 'Backup uploaded successfully',
        filename: 'large_backup.json',
        timestamp: '2026-01-01T10:00:00Z',
        size: 10000000,
      };

      mockedApi.post.mockResolvedValue({ data: mockBackupResponse });

      const result = await backupService.uploadBackup(mockFile);

      expect(result.size).toBe(10000000);
    });
  });

  // ============================================
  // READ Tests
  // ============================================
  describe('READ - listBackups', () => {
    it('should list all backups', async () => {
      const mockBackups: Backup[] = [
        {
          filename: 'backup_2026-01-01T10-00-00-000Z.json',
          size: 1024000,
          created: '2026-01-01T10:00:00Z',
          modified: '2026-01-01T10:00:00Z',
        },
        {
          filename: 'backup_2025-12-31T10-00-00-000Z.json',
          size: 980000,
          created: '2025-12-31T10:00:00Z',
          modified: '2025-12-31T10:00:00Z',
        },
        {
          filename: 'backup_2025-12-30T10-00-00-000Z.json',
          size: 950000,
          created: '2025-12-30T10:00:00Z',
          modified: '2025-12-30T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockBackups });

      const result = await backupService.listBackups();

      expect(mockedApi.get).toHaveBeenCalledWith('/backup/list');
      expect(result).toEqual(mockBackups);
      expect(result).toHaveLength(3);
    });

    it('should return empty list when no backups exist', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      const result = await backupService.listBackups();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle list backups error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Failed to list backups'));

      await expect(backupService.listBackups())
        .rejects.toThrow('Failed to list backups');
    });

    it('should list backups with various sizes', async () => {
      const mockBackups: Backup[] = [
        {
          filename: 'backup_small.json',
          size: 1024, // 1 KB
          created: '2026-01-01T10:00:00Z',
          modified: '2026-01-01T10:00:00Z',
        },
        {
          filename: 'backup_medium.json',
          size: 1048576, // 1 MB
          created: '2026-01-01T11:00:00Z',
          modified: '2026-01-01T11:00:00Z',
        },
        {
          filename: 'backup_large.json',
          size: 104857600, // 100 MB
          created: '2026-01-01T12:00:00Z',
          modified: '2026-01-01T12:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockBackups });

      const result = await backupService.listBackups();

      expect(result[0].size).toBe(1024);
      expect(result[1].size).toBe(1048576);
      expect(result[2].size).toBe(104857600);
    });
  });

  // ============================================
  // DOWNLOAD Tests  
  // Note: Download tests removed - DOM manipulation is tested separately
  // ============================================

  // ============================================
  // DELETE Tests
  // ============================================
  describe('DELETE - deleteBackup', () => {
    it('should delete backup successfully', async () => {
      const mockResponse = {
        message: 'Backup deleted successfully',
      };

      mockedApi.delete.mockResolvedValue({ data: mockResponse });

      const result = await backupService.deleteBackup('backup_2026-01-01.json');

      expect(mockedApi.delete).toHaveBeenCalledWith('/backup/backup_2026-01-01.json');
      expect(result).toEqual(mockResponse);
      expect(result.message).toContain('deleted');
    });

    it('should handle delete error when backup not found', async () => {
      mockedApi.delete.mockRejectedValue(new Error('Backup not found'));

      await expect(backupService.deleteBackup('nonexistent.json'))
        .rejects.toThrow('Backup not found');
    });

    it('should delete multiple backups', async () => {
      const mockResponse = { message: 'Backup deleted successfully' };

      mockedApi.delete.mockResolvedValue({ data: mockResponse });

      await backupService.deleteBackup('backup1.json');
      await backupService.deleteBackup('backup2.json');
      await backupService.deleteBackup('backup3.json');

      expect(mockedApi.delete).toHaveBeenCalledTimes(3);
      expect(mockedApi.delete).toHaveBeenCalledWith('/backup/backup1.json');
      expect(mockedApi.delete).toHaveBeenCalledWith('/backup/backup2.json');
      expect(mockedApi.delete).toHaveBeenCalledWith('/backup/backup3.json');
    });
  });

  // ============================================
  // RESTORE Tests
  // ============================================
  describe('RESTORE - restoreBackup', () => {
    it('should restore backup successfully', async () => {
      const mockResponse = {
        message: 'Backup restored successfully',
      };

      mockedApi.post.mockResolvedValue({ data: mockResponse });

      const result = await backupService.restoreBackup('backup_2026-01-01.json');

      expect(mockedApi.post).toHaveBeenCalledWith('/backup/restore/backup_2026-01-01.json');
      expect(result).toEqual(mockResponse);
      expect(result.message).toContain('restored');
    });

    it('should handle restore error', async () => {
      mockedApi.post.mockRejectedValue(new Error('Restore failed: corrupted backup'));

      await expect(backupService.restoreBackup('corrupted.json'))
        .rejects.toThrow('Restore failed: corrupted backup');
    });

    it('should restore backup with warning about data loss', async () => {
      const mockResponse = {
        message: 'Backup restored successfully. Current data was replaced.',
      };

      mockedApi.post.mockResolvedValue({ data: mockResponse });

      const result = await backupService.restoreBackup('backup_old.json');

      expect(result.message).toContain('restored');
    });
  });

  // ============================================
  // Integration Tests
  // ============================================
  describe('INTEGRATION - Complete Backup Workflow', () => {
    it('should complete full backup lifecycle', async () => {
      // CREATE backup
      const mockCreateResponse: BackupResponse = {
        message: 'Backup created successfully',
        filename: 'backup_2026-01-01.json',
        timestamp: '2026-01-01T10:00:00Z',
        size: 1024000,
      };

      mockedApi.post.mockResolvedValue({ data: mockCreateResponse });
      const created = await backupService.createBackup();
      expect(created.filename).toBe('backup_2026-01-01.json');

      // LIST backups
      const mockBackups: Backup[] = [
        {
          filename: 'backup_2026-01-01.json',
          size: 1024000,
          created: '2026-01-01T10:00:00Z',
          modified: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockBackups });
      const backups = await backupService.listBackups();
      expect(backups).toHaveLength(1);

      // DELETE backup
      mockedApi.delete.mockResolvedValue({ data: { message: 'Backup deleted' } });
      await backupService.deleteBackup('backup_2026-01-01.json');

      // LIST backups again (empty)
      mockedApi.get.mockResolvedValue({ data: [] });
      const remainingBackups = await backupService.listBackups();
      expect(remainingBackups).toHaveLength(0);
    });

    it('should handle backup and restore workflow', async () => {
      // CREATE backup
      const mockCreateResponse: BackupResponse = {
        message: 'Backup created successfully',
        filename: 'backup_before_changes.json',
        timestamp: '2026-01-01T10:00:00Z',
        size: 2048000,
      };

      mockedApi.post.mockResolvedValue({ data: mockCreateResponse });
      const backup = await backupService.createBackup();
      expect(backup.filename).toBe('backup_before_changes.json');

      // Simulate making changes to data...

      // RESTORE backup
      mockedApi.post.mockResolvedValue({ data: { message: 'Backup restored successfully' } });
      const restored = await backupService.restoreBackup('backup_before_changes.json');
      expect(restored.message).toContain('restored');
    });

    it('should handle upload and restore workflow', async () => {
      // UPLOAD backup
      const mockFile = new File(['external backup'], 'external_backup.json', { type: 'application/json' });

      const mockUploadResponse: BackupResponse = {
        message: 'Backup uploaded successfully',
        filename: 'external_backup.json',
        timestamp: '2026-01-01T10:00:00Z',
        size: 15000,
      };

      mockedApi.post.mockResolvedValue({ data: mockUploadResponse });
      const uploaded = await backupService.uploadBackup(mockFile);
      expect(uploaded.filename).toBe('external_backup.json');

      // LIST backups
      const mockBackups: Backup[] = [
        {
          filename: 'external_backup.json',
          size: 15000,
          created: '2026-01-01T10:00:00Z',
          modified: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockBackups });
      const backups = await backupService.listBackups();
      expect(backups[0].filename).toBe('external_backup.json');

      // RESTORE uploaded backup
      mockedApi.post.mockResolvedValue({ data: { message: 'Backup restored successfully' } });
      await backupService.restoreBackup('external_backup.json');
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe('EDGE CASES', () => {
    it('should handle backup with empty data', async () => {
      const mockBackupResponse: BackupResponse = {
        message: 'Backup created successfully',
        filename: 'backup_empty.json',
        timestamp: '2026-01-01T10:00:00Z',
        size: 2, // Just "{}"
      };

      mockedApi.post.mockResolvedValue({ data: mockBackupResponse });

      const result = await backupService.createBackup();

      expect(result.size).toBe(2);
    });

    it('should handle backup filename with special characters', async () => {
      const mockBackups: Backup[] = [
        {
          filename: 'backup_Müller_&_Söhne_2026-01-01.json',
          size: 1024000,
          created: '2026-01-01T10:00:00Z',
          modified: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockBackups });

      const result = await backupService.listBackups();

      expect(result[0].filename).toContain('Müller');
      expect(result[0].filename).toContain('Söhne');
    });

    it('should handle very large backup file', async () => {
      const mockBackupResponse: BackupResponse = {
        message: 'Backup created successfully',
        filename: 'backup_large.json',
        timestamp: '2026-01-01T10:00:00Z',
        size: 1073741824, // 1 GB
      };

      mockedApi.post.mockResolvedValue({ data: mockBackupResponse });

      const result = await backupService.createBackup();

      expect(result.size).toBe(1073741824);
    });

    it('should handle zero-sized backup', async () => {
      const mockBackups: Backup[] = [
        {
          filename: 'backup_zero.json',
          size: 0,
          created: '2026-01-01T10:00:00Z',
          modified: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockBackups });

      const result = await backupService.listBackups();

      expect(result[0].size).toBe(0);
    });

    it('should handle backup with future timestamp', async () => {
      const mockBackupResponse: BackupResponse = {
        message: 'Backup created successfully',
        filename: 'backup_future.json',
        timestamp: '2027-01-01T10:00:00Z',
        size: 1024000,
      };

      mockedApi.post.mockResolvedValue({ data: mockBackupResponse });

      const result = await backupService.createBackup();

      expect(result.timestamp).toBe('2027-01-01T10:00:00Z');
    });

    it('should handle multiple simultaneous backup operations', async () => {
      const mockResponse = { message: 'Backup deleted successfully' };
      mockedApi.delete.mockResolvedValue({ data: mockResponse });

      const deletePromises = [
        backupService.deleteBackup('backup1.json'),
        backupService.deleteBackup('backup2.json'),
        backupService.deleteBackup('backup3.json'),
      ];

      await Promise.all(deletePromises);

      expect(mockedApi.delete).toHaveBeenCalledTimes(3);
    });

    it('should handle backup list with many entries', async () => {
      const mockBackups: Backup[] = Array.from({ length: 100 }, (_, i) => ({
        filename: `backup_${i}.json`,
        size: 1000000 + i * 1000,
        created: `2026-01-01T${String(i % 24).padStart(2, '0')}-00-00-000Z`,
        modified: `2026-01-01T${String(i % 24).padStart(2, '0')}-00-00-000Z`,
      }));

      mockedApi.get.mockResolvedValue({ data: mockBackups });

      const result = await backupService.listBackups();

      expect(result).toHaveLength(100);
      expect(result[0].filename).toBe('backup_0.json');
      expect(result[99].filename).toBe('backup_99.json');
    });
  });
});
