import fs from 'fs';
import path from 'path';

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

import {
  uploadLessonVideo,
  deleteElearningUpload,
} from '../controllers/elearning-upload.controller';

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('E-Learning Upload Controller - Videos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
  });

  describe('uploadLessonVideo', () => {
    it('should return the public url for the stored video', async () => {
      const res = mockResponse();
      const req: any = {
        file: {
          filename: 'video-abc.mp4',
          originalname: 'Sicherheitsunterweisung.mp4',
          size: 12345,
          mimetype: 'video/mp4',
        },
      };

      await uploadLessonVideo(req, res);

      expect(res.json).toHaveBeenCalledWith({
        url: '/uploads/course-videos/video-abc.mp4',
        filename: 'video-abc.mp4',
        originalName: 'Sicherheitsunterweisung.mp4',
        size: 12345,
        mimetype: 'video/mp4',
      });
    });

    it('should return 400 when no file was uploaded', async () => {
      const res = mockResponse();

      await uploadLessonVideo({} as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Keine Datei hochgeladen' });
    });
  });

  describe('deleteElearningUpload', () => {
    it('should delete a video from the course-videos directory', async () => {
      const res = mockResponse();
      const req: any = { params: { type: 'video', filename: 'video-abc.mp4' } };

      await deleteElearningUpload(req, res);

      expect(fs.unlinkSync).toHaveBeenCalledWith(
        expect.stringContaining(path.join('uploads', 'course-videos', 'video-abc.mp4'))
      );
      expect(res.json).toHaveBeenCalledWith({ message: 'Datei erfolgreich gelöscht' });
    });

    it('should reject path traversal attempts', async () => {
      const res = mockResponse();
      const req: any = { params: { type: 'video', filename: '../../.env' } };

      await deleteElearningUpload(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('should reject unknown upload types', async () => {
      const res = mockResponse();
      const req: any = { params: { type: 'movies', filename: 'video-abc.mp4' } };

      await deleteElearningUpload(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Ungültiger Upload-Typ' });
    });

    it('should return 404 when the video no longer exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const res = mockResponse();
      const req: any = { params: { type: 'video', filename: 'video-gone.mp4' } };

      await deleteElearningUpload(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });
});
