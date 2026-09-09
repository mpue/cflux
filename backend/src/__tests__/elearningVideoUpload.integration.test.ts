import express from 'express';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

import {
  handleVideoUpload,
  uploadLessonVideo,
} from '../controllers/elearning-upload.controller';

// Bewusst ohne fs-Mock: dieser Test prueft die echte multer-Verdrahtung
// (Feldname, Filter, Ablageort), nicht nur die Handler-Logik.
const videoDir = path.join(__dirname, '../../uploads/course-videos');

const app = express();
app.post('/upload/video', handleVideoUpload as any, uploadLessonVideo as any);

const fakeVideo = Buffer.alloc(2048, 1);
const writtenFiles: string[] = [];

describe('POST /upload/video (multer integration)', () => {
  afterEach(() => {
    while (writtenFiles.length) {
      const file = writtenFiles.pop()!;
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  });

  it('stores an mp4 under uploads/course-videos and returns its url', async () => {
    const res = await request(app)
      .post('/upload/video')
      .attach('video', fakeVideo, { filename: 'unterweisung.mp4', contentType: 'video/mp4' });

    expect(res.status).toBe(200);
    expect(res.body.url).toMatch(/^\/uploads\/course-videos\/video-[\w-]+\.mp4$/);
    expect(res.body.originalName).toBe('unterweisung.mp4');

    const stored = path.join(videoDir, res.body.filename);
    writtenFiles.push(stored);
    expect(fs.existsSync(stored)).toBe(true);
    expect(fs.statSync(stored).size).toBe(fakeVideo.length);
  });

  it('rejects non-video files with a readable error', async () => {
    const res = await request(app)
      .post('/upload/video')
      .attach('video', Buffer.alloc(100), { filename: 'notizen.txt', contentType: 'text/plain' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Nur Videodateien');
  });

  it('rejects a wrong form field instead of failing with a 500', async () => {
    const res = await request(app)
      .post('/upload/video')
      .attach('datei', fakeVideo, { filename: 'x.mp4', contentType: 'video/mp4' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
