// lib/projectTasks.types.ts
// Pure types + constants — safe to import from both server and client
// components. The mutation logic that touches supabaseAdmin stays in
// lib/projectTasks.ts behind `import 'server-only'`.

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
