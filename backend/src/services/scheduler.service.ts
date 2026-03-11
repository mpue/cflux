import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { autoClockOutJob } from './autoClockOut.service';

const prisma = new PrismaClient();

interface ScheduledJob {
  taskId: string;
  cronTask: ReturnType<typeof cron.schedule>;
}

const activeJobs: Map<string, ScheduledJob> = new Map();

// Built-in task handlers
const taskHandlers: Record<string, () => Promise<{ affectedCount: number; message: string }>> = {
  AUTO_CLOCK_OUT: autoClockOutJob,
};

async function executeTask(taskId: string, taskType: string): Promise<void> {
  const handler = taskHandlers[taskType];
  if (!handler) {
    console.error(`[SCHEDULER] No handler found for task type: ${taskType}`);
    return;
  }

  // Create execution record
  const execution = await prisma.scheduledTaskExecution.create({
    data: {
      taskId,
      status: 'RUNNING',
    },
  });

  try {
    const result = await handler();

    await prisma.scheduledTaskExecution.update({
      where: { id: execution.id },
      data: {
        status: 'SUCCESS',
        completedAt: new Date(),
        message: result.message,
        affectedCount: result.affectedCount,
      },
    });

    await prisma.scheduledTask.update({
      where: { id: taskId },
      data: {
        lastRunAt: new Date(),
        lastRunStatus: 'SUCCESS',
        lastRunMessage: result.message,
        runCount: { increment: 1 },
      },
    });

    console.log(`[SCHEDULER] Task ${taskType} completed: ${result.message}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await prisma.scheduledTaskExecution.update({
      where: { id: execution.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        message: errorMessage,
      },
    });

    await prisma.scheduledTask.update({
      where: { id: taskId },
      data: {
        lastRunAt: new Date(),
        lastRunStatus: 'FAILED',
        lastRunMessage: errorMessage,
        runCount: { increment: 1 },
      },
    });

    console.error(`[SCHEDULER] Task ${taskType} failed:`, errorMessage);
  }
}

function scheduleTask(taskId: string, taskType: string, cronExpression: string): void {
  // Stop existing job if any
  stopTask(taskId);

  if (!cron.validate(cronExpression)) {
    console.error(`[SCHEDULER] Invalid cron expression for task ${taskId}: ${cronExpression}`);
    return;
  }

  const cronTask = cron.schedule(cronExpression, () => {
    executeTask(taskId, taskType);
  });

  activeJobs.set(taskId, { taskId, cronTask });
  console.log(`[SCHEDULER] Scheduled task ${taskType} (${taskId}) with cron: ${cronExpression}`);
}

function stopTask(taskId: string): void {
  const job = activeJobs.get(taskId);
  if (job) {
    job.cronTask.stop();
    activeJobs.delete(taskId);
  }
}

/**
 * Ensure the default Auto Clock-Out system task exists in DB
 */
async function ensureAutoClockOutTask(): Promise<void> {
  const autoClockOutEnabled = process.env.AUTO_CLOCK_OUT_ENABLED !== 'false'; // enabled by default
  const autoClockOutTime = process.env.AUTO_CLOCK_OUT_TIME || '18:00';

  // Parse time to cron expression (HH:MM -> "M H * * *")
  const [hours, minutes] = autoClockOutTime.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    console.error(`[SCHEDULER] Invalid AUTO_CLOCK_OUT_TIME: ${autoClockOutTime}, using default 18:00`);
    return ensureAutoClockOutTaskWithCron('0 18 * * 1-5', autoClockOutEnabled);
  }

  const cronExpr = `${minutes} ${hours} * * 1-5`; // Mo-Fr
  return ensureAutoClockOutTaskWithCron(cronExpr, autoClockOutEnabled);
}

async function ensureAutoClockOutTaskWithCron(cronExpr: string, enabled: boolean): Promise<void> {
  const existing = await prisma.scheduledTask.findFirst({
    where: { taskType: 'AUTO_CLOCK_OUT', isSystemTask: true },
  });

  if (!existing) {
    await prisma.scheduledTask.create({
      data: {
        name: 'Auto Clock-Out',
        description: 'Schliesst automatisch alle offenen Zeiteinträge (CLOCKED_IN / ON_PAUSE) zur konfigurierten Uhrzeit. Betrifft Montag bis Freitag.',
        taskType: 'AUTO_CLOCK_OUT',
        cronExpression: cronExpr,
        status: enabled ? 'ACTIVE' : 'PAUSED',
        isSystemTask: true,
        config: { clockOutTime: process.env.AUTO_CLOCK_OUT_TIME || '18:00' },
      },
    });
    console.log(`[SCHEDULER] Created Auto Clock-Out system task (${enabled ? 'ACTIVE' : 'PAUSED'})`);
  } else {
    // Update cron expression if env var changed
    if (existing.cronExpression !== cronExpr || (enabled ? 'ACTIVE' : 'PAUSED') !== existing.status) {
      await prisma.scheduledTask.update({
        where: { id: existing.id },
        data: {
          cronExpression: cronExpr,
          status: enabled ? 'ACTIVE' : 'PAUSED',
          config: { clockOutTime: process.env.AUTO_CLOCK_OUT_TIME || '18:00' },
        },
      });
    }
  }
}

/**
 * Initialize scheduler: load all active tasks from DB and schedule them
 */
export async function initScheduler(): Promise<void> {
  console.log('[SCHEDULER] Initializing scheduler...');

  // Ensure system tasks exist
  await ensureAutoClockOutTask();

  // Load all active tasks
  const tasks = await prisma.scheduledTask.findMany({
    where: { status: 'ACTIVE' },
  });

  for (const task of tasks) {
    scheduleTask(task.id, task.taskType, task.cronExpression);
  }

  console.log(`[SCHEDULER] Initialized with ${tasks.length} active task(s)`);
}

/**
 * Refresh a specific task's schedule (after update via API)
 */
export async function refreshTask(taskId: string): Promise<void> {
  const task = await prisma.scheduledTask.findUnique({ where: { id: taskId } });
  if (!task) {
    stopTask(taskId);
    return;
  }

  if (task.status === 'ACTIVE') {
    scheduleTask(task.id, task.taskType, task.cronExpression);
  } else {
    stopTask(task.id);
  }
}

/**
 * Stop all scheduled tasks (for graceful shutdown)
 */
export function stopAllTasks(): void {
  for (const [taskId] of activeJobs) {
    stopTask(taskId);
  }
  console.log('[SCHEDULER] All tasks stopped');
}

/**
 * Manually trigger a task execution (for testing/admin)
 */
export async function triggerTaskNow(taskId: string): Promise<void> {
  const task = await prisma.scheduledTask.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new Error('Task not found');
  }
  await executeTask(task.id, task.taskType);
}
