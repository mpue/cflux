import { Request, Response } from 'express';
import * as projectTaskService from '../services/projectTask.service';

export const createTask = async (req: Request, res: Response) => {
  try {
    const task = await projectTaskService.createTask(req.body);
    res.status(201).json(task);
  } catch (error: any) {
    console.error('Error creating task:', error);
    res.status(400).json({ error: error.message || 'Failed to create task' });
  }
};

export const getTasksByProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const tasks = await projectTaskService.getTasksByProject(projectId);
    res.json(tasks);
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await projectTaskService.getTaskById(id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error: any) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await projectTaskService.updateTask(id, req.body);
    res.json(task);
  } catch (error: any) {
    console.error('Error updating task:', error);
    res.status(400).json({ error: error.message || 'Failed to update task' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await projectTaskService.deleteTask(id);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

export const getTaskDependencies = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dependencies = await projectTaskService.getTaskDependencies(id);
    res.json(dependencies);
  } catch (error: any) {
    console.error('Error fetching dependencies:', error);
    res.status(500).json({ error: 'Failed to fetch dependencies' });
  }
};

export const getDependentTasks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dependentTasks = await projectTaskService.getDependentTasks(id);
    res.json(dependentTasks);
  } catch (error: any) {
    console.error('Error fetching dependent tasks:', error);
    res.status(500).json({ error: 'Failed to fetch dependent tasks' });
  }
};
