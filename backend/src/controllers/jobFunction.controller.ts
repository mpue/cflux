import { Request, Response } from 'express';
import jobFunctionService from '../services/jobFunction.service';

class JobFunctionController {
  // Get all job functions
  async getAllJobFunctions(req: Request, res: Response) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const jobFunctions = await jobFunctionService.getAllJobFunctions(includeInactive);
      res.json(jobFunctions);
    } catch (error) {
      console.error('Error fetching job functions:', error);
      res.status(500).json({ message: 'Failed to fetch job functions' });
    }
  }

  // Get job function by ID
  async getJobFunctionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const jobFunction = await jobFunctionService.getJobFunctionById(id);
      
      if (!jobFunction) {
        return res.status(404).json({ message: 'Job function not found' });
      }
      
      res.json(jobFunction);
    } catch (error) {
      console.error('Error fetching job function:', error);
      res.status(500).json({ message: 'Failed to fetch job function' });
    }
  }

  // Create new job function
  async createJobFunction(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const jobFunction = await jobFunctionService.createJobFunction(req.body, userId);
      res.status(201).json(jobFunction);
    } catch (error) {
      console.error('Error creating job function:', error);
      res.status(500).json({ message: 'Failed to create job function' });
    }
  }

  // Update job function
  async updateJobFunction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const jobFunction = await jobFunctionService.updateJobFunction(id, req.body);
      res.json(jobFunction);
    } catch (error) {
      console.error('Error updating job function:', error);
      res.status(500).json({ message: 'Failed to update job function' });
    }
  }

  // Delete job function (soft delete)
  async deleteJobFunction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const hardDelete = req.query.hard === 'true';

      if (hardDelete) {
        await jobFunctionService.hardDeleteJobFunction(id);
      } else {
        await jobFunctionService.deleteJobFunction(id);
      }
      
      res.json({ message: 'Job function deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting job function:', error);
      res.status(500).json({ message: error.message || 'Failed to delete job function' });
    }
  }

  // Get job functions by category
  async getJobFunctionsByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;
      const jobFunctions = await jobFunctionService.getJobFunctionsByCategory(category);
      res.json(jobFunctions);
    } catch (error) {
      console.error('Error fetching job functions by category:', error);
      res.status(500).json({ message: 'Failed to fetch job functions' });
    }
  }

  // Get job functions by department
  async getJobFunctionsByDepartment(req: Request, res: Response) {
    try {
      const { department } = req.params;
      const jobFunctions = await jobFunctionService.getJobFunctionsByDepartment(department);
      res.json(jobFunctions);
    } catch (error) {
      console.error('Error fetching job functions by department:', error);
      res.status(500).json({ message: 'Failed to fetch job functions' });
    }
  }

  // Assign job function to user
  async assignJobFunctionToUser(req: Request, res: Response) {
    try {
      const { userId, jobFunctionId } = req.body;
      
      if (!userId || !jobFunctionId) {
        return res.status(400).json({ message: 'userId and jobFunctionId are required' });
      }

      const user = await jobFunctionService.assignJobFunctionToUser(userId, jobFunctionId);
      res.json(user);
    } catch (error) {
      console.error('Error assigning job function to user:', error);
      res.status(500).json({ message: 'Failed to assign job function' });
    }
  }

  // Remove job function from user
  async removeJobFunctionFromUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const user = await jobFunctionService.removeJobFunctionFromUser(userId);
      res.json(user);
    } catch (error) {
      console.error('Error removing job function from user:', error);
      res.status(500).json({ message: 'Failed to remove job function' });
    }
  }

  // Get all categories
  async getCategories(req: Request, res: Response) {
    try {
      const categories = await jobFunctionService.getCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  }

  // Get all departments
  async getDepartments(req: Request, res: Response) {
    try {
      const departments = await jobFunctionService.getDepartments();
      res.json(departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({ message: 'Failed to fetch departments' });
    }
  }

  // Add document to job function
  async addDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { documentNodeId } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      if (!documentNodeId) {
        return res.status(400).json({ message: 'documentNodeId is required' });
      }

      const result = await jobFunctionService.addDocument(id, documentNodeId, userId);
      res.json(result);
    } catch (error: any) {
      console.error('Error adding document to job function:', error);
      res.status(500).json({ message: error.message || 'Failed to add document' });
    }
  }

  // Remove document from job function
  async removeDocument(req: Request, res: Response) {
    try {
      const { id, documentId } = req.params;
      await jobFunctionService.removeDocument(id, documentId);
      res.json({ message: 'Document removed successfully' });
    } catch (error) {
      console.error('Error removing document from job function:', error);
      res.status(500).json({ message: 'Failed to remove document' });
    }
  }

  // Get documents for job function
  async getDocuments(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const documents = await jobFunctionService.getDocuments(id);
      res.json(documents);
    } catch (error) {
      console.error('Error fetching documents for job function:', error);
      res.status(500).json({ message: 'Failed to fetch documents' });
    }
  }
}

export default new JobFunctionController();
