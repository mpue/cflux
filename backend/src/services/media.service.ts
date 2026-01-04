import { PrismaClient, Media, MediaType } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateMediaDto {
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  mediaType: MediaType;
  path: string;
  url?: string;
  description?: string;
  tags?: string[];
  width?: number;
  height?: number;
  duration?: number;
  isPublic?: boolean;
  uploadedById: string;
}

export interface UpdateMediaDto {
  description?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface MediaFilters {
  mediaType?: MediaType;
  isPublic?: boolean;
  search?: string;
  tags?: string[];
}

export const mediaService = {
  async createMedia(data: CreateMediaDto): Promise<Media> {
    const media = await prisma.media.create({
      data: {
        filename: data.filename,
        originalFilename: data.originalFilename,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        mediaType: data.mediaType,
        path: data.path,
        url: data.url,
        description: data.description,
        tags: data.tags || [],
        width: data.width,
        height: data.height,
        duration: data.duration,
        isPublic: data.isPublic || false,
        uploadedById: data.uploadedById,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return media;
  },

  async getAllMedia(filters?: MediaFilters): Promise<Media[]> {
    const where: any = {};

    if (filters?.mediaType) {
      where.mediaType = filters.mediaType;
    }

    if (filters?.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    if (filters?.search) {
      where.OR = [
        { originalFilename: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    const media = await prisma.media.findMany({
      where,
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return media;
  },

  async getMediaById(id: string): Promise<Media | null> {
    const media = await prisma.media.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return media;
  },

  async updateMedia(id: string, data: UpdateMediaDto): Promise<Media> {
    const media = await prisma.media.update({
      where: { id },
      data: {
        description: data.description,
        tags: data.tags,
        isPublic: data.isPublic,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return media;
  },

  async deleteMedia(id: string): Promise<void> {
    await prisma.media.delete({
      where: { id },
    });
  },

  async getMediaByTag(tag: string): Promise<Media[]> {
    const media = await prisma.media.findMany({
      where: {
        tags: {
          has: tag,
        },
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return media;
  },

  async getStatistics(): Promise<any> {
    const totalMedia = await prisma.media.count();
    
    const mediaByType = await prisma.media.groupBy({
      by: ['mediaType'],
      _count: true,
    });

    const totalSize = await prisma.media.aggregate({
      _sum: {
        fileSize: true,
      },
    });

    const publicMedia = await prisma.media.count({
      where: { isPublic: true },
    });

    const privateMedia = await prisma.media.count({
      where: { isPublic: false },
    });

    return {
      total: totalMedia,
      byType: mediaByType.reduce((acc: any, item: any) => {
        acc[item.mediaType] = item._count;
        return acc;
      }, {}),
      totalSize: totalSize._sum.fileSize || 0,
      public: publicMedia,
      private: privateMedia,
    };
  },
};
