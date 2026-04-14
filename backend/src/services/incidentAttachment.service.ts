import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(__dirname, '../../uploads/incident-attachments');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const incidentAttachmentService = {
  async getAttachments(incidentId: string) {
    return prisma.incidentAttachment.findMany({
      where: { incidentId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createAttachment(data: {
    incidentId: string;
    filename: string;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
    uploadedById: string;
  }) {
    return prisma.incidentAttachment.create({
      data,
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  },

  async getAttachmentById(id: string) {
    return prisma.incidentAttachment.findUnique({
      where: { id },
    });
  },

  async deleteAttachment(id: string) {
    const attachment = await prisma.incidentAttachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      return null;
    }

    // Delete file from disk
    const filePath = path.join(UPLOAD_DIR, attachment.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return prisma.incidentAttachment.delete({
      where: { id },
    });
  },

  getUploadDir() {
    return UPLOAD_DIR;
  },
};
