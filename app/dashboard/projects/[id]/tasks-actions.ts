'use server';

import { requireActorWithPermission } from '@/lib/serverActionAuthz';
import {
  createTask as libCreateTask,
  updateTask as libUpdateTask,
  moveTask as libMoveTask,
  deleteTask as libDeleteTask,
  addTaskComment as libAddTaskComment,
  fetchProjectTasks,
  fetchProjectLabels,
  fetchTaskLabelLinks,
  fetchTaskComments,
  type ProjectTask,
  type ProjectLabel,
  type TaskComment,
  type TaskStatus,
  type TaskPriority,
} from '@/lib/projectTasks';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function requireViewActor(): Promise<string> {
  const actor = await requireActorWithPermission('projects.view');
  return actor.email || actor.userId;
}
async function requireEditActor(): Promise<string> {
  const actor = await requireActorWithPermission('projects.edit');
  return actor.email || actor.userId;
}

export interface KanbanBoardData {
  tasks: ProjectTask[];
  labels: ProjectLabel[];
  taskLabelLinks: { task_id: string; label_id: string }[];
  employees: { id: string; name: string }[];
}

export async function loadKanbanBoard(projectId: string): Promise<KanbanBoardData> {
  await requireViewActor();
  const [tasks, labels, emps] = await Promise.all([
    fetchProjectTasks(projectId),
    fetchProjectLabels(projectId),
    supabaseAdmin.from('employees').select('id, first_name, last_name').order('first_name'),
  ]);
  const taskLabelLinks = await fetchTaskLabelLinks(tasks.map(t => t.id));
  const employees = (emps.data ?? []).map(e => ({
    id: e.id as string,
    name: [e.first_name, e.last_name].filter(Boolean).join(' ') || 'Unnamed',
  }));
  return { tasks, labels, taskLabelLinks, employees };
}

export async function createTaskAction(input: {
  projectId: string;
  title: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
}): Promise<ProjectTask> {
  const actor = await requireEditActor();
  return libCreateTask({
    projectId: input.projectId,
    title: input.title,
    status: input.status,
    priority: input.priority,
    assigneeId: input.assigneeId ?? null,
    dueDate: input.dueDate ?? null,
    createdBy: actor,
  });
}

export async function updateTaskAction(input: {
  taskId: string;
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
}): Promise<ProjectTask> {
  const actor = await requireEditActor();
  return libUpdateTask({ ...input, actor });
}

export async function moveTaskAction(input: {
  taskId: string;
  toStatus: TaskStatus;
  toIndex: number;
}): Promise<void> {
  const actor = await requireEditActor();
  await libMoveTask({ ...input, actor });
}

export async function deleteTaskAction(taskId: string): Promise<void> {
  const actor = await requireActorWithPermission('projects.delete');
  await libDeleteTask({ taskId, actor: actor.email || actor.userId });
}

export async function addTaskCommentAction(input: {
  taskId: string;
  body: string;
}): Promise<TaskComment> {
  // Commenting is tied to edit access — if you can edit, you can discuss.
  const actor = await requireEditActor();
  return libAddTaskComment({ taskId: input.taskId, author: actor, body: input.body });
}

export async function loadTaskComments(taskId: string): Promise<TaskComment[]> {
  await requireViewActor();
  return fetchTaskComments(taskId);
}
