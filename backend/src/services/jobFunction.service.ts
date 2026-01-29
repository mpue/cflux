import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface JobFunctionData {
  title: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  requirements?: string;
  requirementsEn?: string;
  qualifications?: string;
  qualificationsEn?: string;
  responsibilities?: string;
  responsibilitiesEn?: string;
  department?: string;
  level?: string;
  category?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  isActive?: boolean;
}

class JobFunctionService {
  // Get all job functions
  async getAllJobFunctions(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    
    return await prisma.jobFunction.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
      orderBy: [
        { category: 'asc' },
        { title: 'asc' },
      ],
    });
  }

  // Get job function by ID
  async getJobFunctionById(id: string) {
    return await prisma.jobFunction.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeProfile: {
              select: {
                employeeNumber: true,
              },
            },
          },
        },
        documents: {
          include: {
            documentNode: {
              select: {
                id: true,
                title: true,
                type: true,
                contentType: true,
                slug: true,
              },
            },
          },
        },
      },
    });
  }

  // Create new job function
  async createJobFunction(data: JobFunctionData, createdById: string) {
    return await prisma.jobFunction.create({
      data: {
        ...data,
        createdById,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // Update job function
  async updateJobFunction(id: string, data: Partial<JobFunctionData>) {
    return await prisma.jobFunction.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // Delete (soft delete) job function
  async deleteJobFunction(id: string) {
    return await prisma.jobFunction.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  // Hard delete job function (only if no employees assigned)
  async hardDeleteJobFunction(id: string) {
    const jobFunction = await prisma.jobFunction.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    if (jobFunction && jobFunction._count.employees > 0) {
      throw new Error('Cannot delete job function with assigned employees');
    }

    return await prisma.jobFunction.delete({
      where: { id },
    });
  }

  // Get job functions by category
  async getJobFunctionsByCategory(category: string) {
    return await prisma.jobFunction.findMany({
      where: {
        category,
        isActive: true,
      },
      orderBy: {
        title: 'asc',
      },
    });
  }

  // Get job functions by department
  async getJobFunctionsByDepartment(department: string) {
    return await prisma.jobFunction.findMany({
      where: {
        department,
        isActive: true,
      },
      orderBy: {
        title: 'asc',
      },
    });
  }

  // Assign job function to user
  async assignJobFunctionToUser(userId: string, jobFunctionId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        jobFunctionId,
      },
      include: {
        jobFunction: true,
      },
    });
  }

  // Remove job function from user
  async removeJobFunctionFromUser(userId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        jobFunctionId: null,
      },
    });
  }

  // Get all unique categories
  async getCategories() {
    const jobFunctions = await prisma.jobFunction.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });

    return jobFunctions
      .map(jf => jf.category)
      .filter(Boolean)
      .sort();
  }

  // Get all unique departments
  async getDepartments() {
    const jobFunctions = await prisma.jobFunction.findMany({
      where: { isActive: true },
      select: { department: true },
      distinct: ['department'],
    });

    return jobFunctions
      .map(jf => jf.department)
      .filter(Boolean)
      .sort();
  }

  // Add document to job function
  async addDocument(jobFunctionId: string, documentNodeId: string, userId: string) {
    return await prisma.jobFunctionDocument.create({
      data: {
        jobFunctionId,
        documentNodeId,
        createdById: userId,
      },
      include: {
        documentNode: {
          select: {
            id: true,
            title: true,
            type: true,
            contentType: true,
          },
        },
      },
    });
  }

  // Remove document from job function
  async removeDocument(jobFunctionId: string, documentNodeId: string) {
    return await prisma.jobFunctionDocument.deleteMany({
      where: {
        jobFunctionId,
        documentNodeId,
      },
    });
  }

  // Get documents for job function
  async getDocuments(jobFunctionId: string) {
    return await prisma.jobFunctionDocument.findMany({
      where: { jobFunctionId },
      include: {
        documentNode: {
          select: {
            id: true,
            title: true,
            type: true,
            contentType: true,
            slug: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        createdBy: {
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
  }

  // Get matrix overview of all job functions and their documents
  async getMatrix() {
    // Alle Job-Funktionen mit ihren Dokumenten laden
    const jobFunctions = await prisma.jobFunction.findMany({
      where: { isActive: true },
      include: {
        documents: {
          include: {
            documentNode: {
              select: {
                id: true,
                title: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: { title: 'asc' },
    });

    // Alle einzigartigen Dokumente sammeln
    const allDocumentsMap = new Map();
    jobFunctions.forEach((jf) => {
      jf.documents.forEach((jfd) => {
        if (!allDocumentsMap.has(jfd.documentNode.id)) {
          allDocumentsMap.set(jfd.documentNode.id, jfd.documentNode);
        }
      });
    });

    const allDocuments = Array.from(allDocumentsMap.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    );

    // Matrix erstellen
    const matrix = {
      jobFunctions: jobFunctions.map((jf) => ({
        id: jf.id,
        title: jf.title,
      })),
      documents: allDocuments.map((doc) => ({
        id: doc.id,
        title: doc.title,
        type: doc.type,
      })),
      assignments: {} as Record<string, Record<string, boolean>>,
    };

    // Zuordnungen in Matrix eintragen
    allDocuments.forEach((doc) => {
      matrix.assignments[doc.id] = {};
      jobFunctions.forEach((jf) => {
        const hasDocument = jf.documents.some((jfd) => jfd.documentNode.id === doc.id);
        matrix.assignments[doc.id][jf.id] = hasDocument;
      });
    });

    return matrix;
  }
}

export default new JobFunctionService();
