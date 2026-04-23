// lib/projectTasks.ts
// Server-side helpers for PM Phase 1: tasks, comments, activity logging.

import 'server-only';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export const TASK_STATUSES: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'To do',
  in_progress: 'In progress',
  review: 'Review',
  done: 'Done',
  cancelled: 'Cancelled',
};

export const TASK_PRIORITIES: TaskPriority[] = ['low', 'normal', 'high', 'urgent'];

export interface ProjectTask {
  id: string;
  project_id: string;
  parent_task_id: string | null;
  milestone_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  due_date: string | null;
  start_date: string | null;
  estimate_hours: number | null;
  actual_hours: number | null;
  order_index: number;
  created_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author: string;
  body: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProjectLabel {
  id: string;
  project_id: string;
  name: string;
  color: string;
}

// ── Fetchers ────────────────────────────────────────────────────────────

export async function fetchProjectTasks(projectId: string): Promise<ProjectTask[]> {
  const { data } = await supabaseAdmin
    .from('project_tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('status')
    .order('order_index', { ascending: true });
  return (data ?? []) as ProjectTask[];
}

export async function fetchTaskComments(taskId: string): Promise<TaskComment[]> {
  const { data } = await supabaseAdmin
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  return (data ?? []) as TaskComment[];
}

export async function fetchProjectLabels(projectId: string): Promise<ProjectLabel[]> {
  const { data } = await supabaseAdmin
    .from('project_labels')
    .select('*')
    .eq('project_id', projectId)
    .order('name');
  return (data ?? []) as ProjectLabel[];
}

export interface TaskLabelLink { task_id: string; label_id: string }
export async function fetchTaskLabelLinks(taskIds: string[]): Promise<TaskLabelLink[]> {
  if (taskIds.length === 0) return [];
  const { data } = await supabaseAdmin
    .from('task_labels')
    .select('task_id, label_id')
    .in('task_id', taskIds);
  return (data ?? []) as TaskLabelLink[];
}

// ── Activity logger ─────────────────────────────────────────────────────
// Writes into the existing project_activities table so the feed is one view
// across milestones, change requests, tasks, etc.

type ActivityType =
  | 'task_created' | 'task_updated' | 'task_moved' | 'task_assigned'
  | 'task_completed' | 'task_commented' | 'task_deleted';

async function logActivity(opts: {
  projectId: string;
  taskId?: string | null;
  type: ActivityType;
  title: string;
  description?: string;
  actor: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await supabaseAdmin.from('project_activities').insert({
    project_id: opts.projectId,
    task_id: opts.taskId ?? null,
    activity_type: opts.type,
    title: opts.title,
    description: opts.description ?? null,
    actor: opts.actor,
    metadata: opts.metadata ?? null,
    visible_to_client: false, // task events default to internal-only
  });
}

// ── Mutations ──────────────────────────────────────────────────────────

export interface CreateTaskInput {
  projectId: string;
  title: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  description?: string;
  assigneeId?: string | null;
  dueDate?: string | null;
  milestoneId?: string | null;
  parentTaskId?: string | null;
  labelIds?: string[];
  createdBy: string;
}

export async function createTask(input: CreateTaskInput): Promise<ProjectTask> {
  const status = input.status ?? 'backlog';

  // Append to the end of its column — compute next order_index.
  const { data: max } = await supabaseAdmin
    .from('project_tasks')
    .select('order_index')
    .eq('project_id', input.projectId)
    .eq('status', status)
    .order('order_index', { ascending: false })
    .limit(1);
  const orderIndex = ((max?.[0]?.order_index ?? -1) as number) + 1;

  const { data, error } = await supabaseAdmin
    .from('project_tasks')
    .insert({
      project_id: input.projectId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status,
      priority: input.priority ?? 'normal',
      assignee_id: input.assigneeId ?? null,
      due_date: input.dueDate ?? null,
      milestone_id: input.milestoneId ?? null,
      parent_task_id: input.parentTaskId ?? null,
      order_index: orderIndex,
      created_by: input.createdBy,
    })
    .select('*')
    .single();
  if (error) throw new Error(`createTask failed: ${error.message}`);
  const task = data as ProjectTask;

  if (input.labelIds?.length) {
    await supabaseAdmin.from('task_labels').insert(
      input.labelIds.map(label_id => ({ task_id: task.id, label_id })),
    );
  }

  await logActivity({
    projectId: input.projectId,
    taskId: task.id,
    type: 'task_created',
    title: `Created task: ${task.title}`,
    actor: input.createdBy,
  });

  return task;
}

export interface UpdateTaskInput {
  taskId: string;
  actor: string;
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
  milestoneId?: string | null;
  estimateHours?: number | null;
}

export async function updateTask(input: UpdateTaskInput): Promise<ProjectTask> {
  const { data: before } = await supabaseAdmin
    .from('project_tasks')
    .select('*')
    .eq('id', input.taskId)
    .single();
  if (!before) throw new Error('Task not found');

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined)        patch.title = input.title.trim();
  if (input.description !== undefined)  patch.description = input.description?.trim() || null;
  if (input.status !== undefined)       patch.status = input.status;
  if (input.priority !== undefined)     patch.priority = input.priority;
  if (input.assigneeId !== undefined)   patch.assignee_id = input.assigneeId;
  if (input.dueDate !== undefined)      patch.due_date = input.dueDate;
  if (input.milestoneId !== undefined)  patch.milestone_id = input.milestoneId;
  if (input.estimateHours !== undefined) patch.estimate_hours = input.estimateHours;

  // Auto-stamp completed_at when the status transitions to done.
  if (input.status === 'done' && before.status !== 'done')     patch.completed_at = new Date().toISOString();
  if (input.status && input.status !== 'done' && before.status === 'done') patch.completed_at = null;

  const { data, error } = await supabaseAdmin
    .from('project_tasks')
    .update(patch)
    .eq('id', input.taskId)
    .select('*')
    .single();
  if (error) throw new Error(`updateTask failed: ${error.message}`);
  const after = data as ProjectTask;

  // Emit targeted activity entries for the most meaningful changes.
  if (input.status && input.status !== before.status) {
    await logActivity({
      projectId: after.project_id,
      taskId: after.id,
      type: after.status === 'done' ? 'task_completed' : 'task_moved',
      title: after.status === 'done'
        ? `Completed: ${after.title}`
        : `Moved “${after.title}”: ${before.status} → ${after.status}`,
      actor: input.actor,
      metadata: { from: before.status, to: after.status },
    });
  }
  if (input.assigneeId !== undefined && input.assigneeId !== before.assignee_id) {
    await logActivity({
      projectId: after.project_id,
      taskId: after.id,
      type: 'task_assigned',
      title: `Reassigned: ${after.title}`,
      actor: input.actor,
      metadata: { from: before.assignee_id, to: after.assignee_id },
    });
  }
  return after;
}

export async function moveTask(input: {
  taskId: string;
  toStatus: TaskStatus;
  toIndex: number;
  actor: string;
}): Promise<void> {
  // Fetch the task + everything currently in the destination column.
  const { data: task } = await supabaseAdmin
    .from('project_tasks')
    .select('*')
    .eq('id', input.taskId)
    .single();
  if (!task) throw new Error('Task not found');

  const { data: destColumn } = await supabaseAdmin
    .from('project_tasks')
    .select('id, order_index, status')
    .eq('project_id', task.project_id)
    .eq('status', input.toStatus)
    .order('order_index', { ascending: true });

  // Build the new order list for the destination column.
  const others = (destColumn ?? []).filter(t => t.id !== input.taskId);
  const insertAt = Math.max(0, Math.min(input.toIndex, others.length));
  const reordered = [...others.slice(0, insertAt), { id: input.taskId }, ...others.slice(insertAt)];

  // Re-index everyone in the destination column.
  const updates = reordered.map((t, i) => ({
    id: t.id,
    project_id: task.project_id,
    order_index: i,
    status: input.toStatus,
  }));
  // Do them as individual updates — upsert would need a NOT-NULL title etc.
  for (const u of updates) {
    await supabaseAdmin
      .from('project_tasks')
      .update({ order_index: u.order_index, status: u.status })
      .eq('id', u.id);
  }

  if (task.status !== input.toStatus) {
    await logActivity({
      projectId: task.project_id,
      taskId: task.id,
      type: input.toStatus === 'done' ? 'task_completed' : 'task_moved',
      title: input.toStatus === 'done'
        ? `Completed: ${task.title}`
        : `Moved “${task.title}”: ${task.status} → ${input.toStatus}`,
      actor: input.actor,
      metadata: { from: task.status, to: input.toStatus },
    });
    if (input.toStatus === 'done') {
      await supabaseAdmin
        .from('project_tasks')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', task.id);
    }
  }
}

export async function deleteTask(input: { taskId: string; actor: string }): Promise<void> {
  const { data: before } = await supabaseAdmin
    .from('project_tasks')
    .select('id, project_id, title')
    .eq('id', input.taskId)
    .single();
  if (!before) return;
  await supabaseAdmin.from('project_tasks').delete().eq('id', input.taskId);
  await logActivity({
    projectId: before.project_id,
    taskId: null,
    type: 'task_deleted',
    title: `Deleted: ${before.title}`,
    actor: input.actor,
    metadata: { task_id: input.taskId },
  });
}

// ── Comments ───────────────────────────────────────────────────────────

export async function addTaskComment(input: {
  taskId: string;
  author: string;
  body: string;
}): Promise<TaskComment> {
  const body = input.body.trim();
  if (!body) throw new Error('Comment body is required');

  const { data: task } = await supabaseAdmin
    .from('project_tasks')
    .select('id, project_id, title')
    .eq('id', input.taskId)
    .single();
  if (!task) throw new Error('Task not found');

  const { data, error } = await supabaseAdmin
    .from('task_comments')
    .insert({ task_id: input.taskId, author: input.author, body })
    .select('*')
    .single();
  if (error) throw new Error(`addTaskComment failed: ${error.message}`);

  await logActivity({
    projectId: task.project_id,
    taskId: task.id,
    type: 'task_commented',
    title: `Commented on: ${task.title}`,
    description: body.length > 200 ? body.slice(0, 200) + '…' : body,
    actor: input.author,
  });
  return data as TaskComment;
}
