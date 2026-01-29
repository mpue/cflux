import { PrismaClient, TaskStatus, TaskPriority } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTaskData {
  projectId: string;
  name: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  startDate?: Date;
  endDate?: Date;
  estimatedHours?: number;
  assignedToId?: string;
  createdById?: string;
  dependsOn?: string[]; // Array of task IDs this task depends on
}

export interface UpdateTaskData {
  name?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  startDate?: Date;
  endDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  progress?: number;
  assignedToId?: string;
  dependsOn?: string[]; // Array of task IDs this task depends on
}

/**
 * Check for circular dependencies using DFS
 */
async function hasCircularDependency(
  taskId: string,
  dependsOnTaskId: string,
  visited: Set<string> = new Set(),
  recursionStack: Set<string> = new Set()
): Promise<boolean> {
  // If the dependency is the task itself
  if (taskId === dependsOnTaskId) {
    return true;
  }

  visited.add(dependsOnTaskId);
  recursionStack.add(dependsOnTaskId);

  // Get all tasks that dependsOnTaskId depends on
  const dependencies = await prisma.taskDependency.findMany({
    where: { taskId: dependsOnTaskId },
    select: { dependsOnTaskId: true },
  });

  for (const dep of dependencies) {
    if (!visited.has(dep.dependsOnTaskId)) {
      if (await hasCircularDependency(taskId, dep.dependsOnTaskId, visited, recursionStack)) {
        return true;
      }
    } else if (recursionStack.has(dep.dependsOnTaskId)) {
      // Back edge found (cycle detected)
      return true;
    }
  }

  recursionStack.delete(dependsOnTaskId);
  return false;
}

/**
 * Validate dependencies before creating/updating
 */
async function validateDependencies(taskId: string, dependsOn: string[]): Promise<void> {
  // Check if task depends on itself
  if (dependsOn.includes(taskId)) {
    throw new Error('A task cannot depend on itself');
  }

  // Get task to verify it belongs to same project
  const task = await prisma.projectTask.findUnique({
    where: { id: taskId },
    select: { projectId: true },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  // Verify all dependency tasks exist and belong to same project
  const dependencyTasks = await prisma.projectTask.findMany({
    where: { id: { in: dependsOn } },
    select: { id: true, projectId: true },
  });

  if (dependencyTasks.length !== dependsOn.length) {
    throw new Error('One or more dependency tasks not found');
  }

  const invalidProjectDeps = dependencyTasks.filter(dt => dt.projectId !== task.projectId);
  if (invalidProjectDeps.length > 0) {
    throw new Error('Dependencies must belong to the same project');
  }

  // Check for circular dependencies
  for (const depTaskId of dependsOn) {
    const hasCircular = await hasCircularDependency(taskId, depTaskId);
    if (hasCircular) {
      throw new Error('Circular dependency detected. This would create a dependency loop.');
    }
  }
}

export const createTask = async (data: CreateTaskData) => {
  const { dependsOn, ...taskData } = data;

  // Create task first
  const task = await prisma.projectTask.create({
    data: taskData,
    include: {
      assignedTo: true,
      createdBy: true,
      dependencies: {
        include: {
          dependsOnTask: true,
        },
      },
    },
  });

  // Add dependencies if provided
  if (dependsOn && dependsOn.length > 0) {
    await validateDependencies(task.id, dependsOn);
    
    await prisma.taskDependency.createMany({
      data: dependsOn.map(depId => ({
        taskId: task.id,
        dependsOnTaskId: depId,
      })),
    });
  }

  // Fetch updated task with dependencies
  return prisma.projectTask.findUnique({
    where: { id: task.id },
    include: {
      assignedTo: true,
      createdBy: true,
      dependencies: {
        include: {
          dependsOnTask: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      },
      dependentOn: {
        include: {
          task: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      },
    },
  });
};

export const getTasksByProject = async (projectId: string) => {
  return prisma.projectTask.findMany({
    where: { projectId },
    include: {
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      dependencies: {
        include: {
          dependsOnTask: {
            select: {
              id: true,
              name: true,
              status: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      },
      dependentOn: {
        include: {
          task: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      },
    },
    orderBy: { startDate: 'asc' },
  });
};

export const getTaskById = async (id: string) => {
  return prisma.projectTask.findUnique({
    where: { id },
    include: {
      project: true,
      assignedTo: true,
      createdBy: true,
      dependencies: {
        include: {
          dependsOnTask: true,
        },
      },
      dependentOn: {
        include: {
          task: true,
        },
      },
    },
  });
};

export const updateTask = async (id: string, data: UpdateTaskData) => {
  const { dependsOn, ...updateData } = data;

  // Update task data
  await prisma.projectTask.update({
    where: { id },
    data: updateData,
  });

  // Update dependencies if provided
  if (dependsOn !== undefined) {
    // Validate new dependencies
    if (dependsOn.length > 0) {
      await validateDependencies(id, dependsOn);
    }

    // Delete existing dependencies
    await prisma.taskDependency.deleteMany({
      where: { taskId: id },
    });

    // Create new dependencies
    if (dependsOn.length > 0) {
      await prisma.taskDependency.createMany({
        data: dependsOn.map(depId => ({
          taskId: id,
          dependsOnTaskId: depId,
        })),
      });
    }
  }

  // Return updated task with all relations
  return getTaskById(id);
};

export const deleteTask = async (id: string) => {
  // Dependencies are automatically deleted due to onDelete: Cascade
  return prisma.projectTask.delete({
    where: { id },
  });
};

export const getTaskDependencies = async (taskId: string) => {
  return prisma.taskDependency.findMany({
    where: { taskId },
    include: {
      dependsOnTask: true,
    },
  });
};

export const getDependentTasks = async (taskId: string) => {
  return prisma.taskDependency.findMany({
    where: { dependsOnTaskId: taskId },
    include: {
      task: true,
    },
  });
};
