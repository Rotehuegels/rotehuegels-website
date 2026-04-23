'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  Plus, Loader2, X, Calendar, User, Trash2, MessageCircle, Flag,
} from 'lucide-react';
import {
  loadKanbanBoard,
  createTaskAction,
  updateTaskAction,
  moveTaskAction,
  deleteTaskAction,
  addTaskCommentAction,
  loadTaskComments,
  type KanbanBoardData,
} from './tasks-actions';
import { TASK_STATUSES, TASK_STATUS_LABELS, TASK_PRIORITIES } from '@/lib/projectTasks.types';
import type { ProjectTask, TaskComment, TaskStatus, TaskPriority } from '@/lib/projectTasks.types';

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: 'text-zinc-500',
  normal: 'text-sky-400',
  high: 'text-amber-400',
  urgent: 'text-rose-400',
};
const PRIORITY_BG: Record<TaskPriority, string> = {
  low: 'bg-zinc-500/10',
  normal: 'bg-sky-500/10',
  high: 'bg-amber-500/10',
  urgent: 'bg-rose-500/10',
};

export default function TasksBoard({ projectId }: { projectId: string }) {
  const [board, setBoard] = useState<KanbanBoardData | null>(null);
  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{ id: string; fromStatus: TaskStatus } | null>(null);
  const [pending, startTransition] = useTransition();

  const reload = useCallback(async () => {
    const b = await loadKanbanBoard(projectId);
    setBoard(b);
  }, [projectId]);

  useEffect(() => { reload(); }, [reload]);

  const tasksByStatus = useMemo(() => {
    const map = new Map<TaskStatus, ProjectTask[]>();
    for (const s of TASK_STATUSES) map.set(s, []);
    for (const t of board?.tasks ?? []) {
      (map.get(t.status) ?? map.set(t.status, []).get(t.status))!.push(t);
    }
    for (const [, list] of map) list.sort((a, b) => a.order_index - b.order_index);
    return map;
  }, [board]);

  const empById = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of board?.employees ?? []) m.set(e.id, e.name);
    return m;
  }, [board]);

  const labelsByTask = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const l of board?.taskLabelLinks ?? []) {
      const arr = m.get(l.task_id) ?? [];
      arr.push(l.label_id);
      m.set(l.task_id, arr);
    }
    return m;
  }, [board]);

  const labelById = useMemo(() => {
    const m = new Map<string, { name: string; color: string }>();
    for (const l of board?.labels ?? []) m.set(l.id, { name: l.name, color: l.color });
    return m;
  }, [board]);

  const onDropOnColumn = (toStatus: TaskStatus) => async (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    const column = tasksByStatus.get(toStatus) ?? [];
    const toIndex = column.length; // append to end of column
    setDragState(null);
    startTransition(async () => {
      await moveTaskAction({ taskId, toStatus, toIndex });
      await reload();
    });
  };

  if (!board) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <span>{board.tasks.length} tasks</span>
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      </div>

      <div className="overflow-x-auto -mx-6 px-6">
        <div className="flex gap-3 min-w-max pb-4">
          {TASK_STATUSES.map(status => {
            const list = tasksByStatus.get(status) ?? [];
            return (
              <div
                key={status}
                onDragOver={e => e.preventDefault()}
                onDrop={onDropOnColumn(status)}
                className={`w-[280px] shrink-0 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-3 ${
                  dragState && dragState.fromStatus !== status ? 'border-rose-500/30 bg-rose-500/[0.02]' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">{TASK_STATUS_LABELS[status]}</span>
                    <span className="text-[11px] text-zinc-500">{list.length}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {list.map(t => {
                    const assignee = t.assignee_id ? empById.get(t.assignee_id) : null;
                    const labelIds = labelsByTask.get(t.id) ?? [];
                    return (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.setData('text/plain', t.id);
                          e.dataTransfer.effectAllowed = 'move';
                          setDragState({ id: t.id, fromStatus: status });
                        }}
                        onDragEnd={() => setDragState(null)}
                        onClick={() => setDrawerTaskId(t.id)}
                        className="rounded-xl border border-zinc-800 bg-zinc-900/70 hover:border-rose-500/40 p-3 cursor-pointer transition-colors"
                      >
                        {labelIds.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {labelIds.map(lid => {
                              const l = labelById.get(lid);
                              if (!l) return null;
                              return (
                                <span key={lid} className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${l.color}20`, color: l.color }}>
                                  {l.name}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        <p className="text-sm text-white leading-snug mb-2">{t.title}</p>
                        <div className="flex items-center justify-between text-[11px] text-zinc-500">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${PRIORITY_BG[t.priority]} ${PRIORITY_COLOR[t.priority]}`}>
                              <Flag className="h-2.5 w-2.5" />{t.priority}
                            </span>
                            {t.due_date && (
                              <span className="inline-flex items-center gap-1 text-zinc-500">
                                <Calendar className="h-2.5 w-2.5" />{new Date(t.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              </span>
                            )}
                          </div>
                          {assignee && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-[9px] font-semibold text-zinc-200" title={assignee}>
                              {assignee.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <InlineCreateTask
                    projectId={projectId}
                    status={status}
                    onCreated={reload}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {drawerTaskId && (
        <TaskDrawer
          taskId={drawerTaskId}
          board={board}
          onClose={() => setDrawerTaskId(null)}
          onChanged={reload}
        />
      )}
    </div>
  );
}

// ── Inline create at the bottom of each column ────────────────────────

function InlineCreateTask({
  projectId, status, onCreated,
}: { projectId: string; status: TaskStatus; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) { setOpen(false); return; }
    startTransition(async () => {
      await createTaskAction({ projectId, title: trimmed, status });
      setTitle('');
      setOpen(false);
      onCreated();
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/30 px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" /> Add task
      </button>
    );
  }
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-2 space-y-2">
      <input
        ref={inputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') { setTitle(''); setOpen(false); } }}
        placeholder="Task title…"
        className="w-full bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
      />
      <div className="flex items-center justify-end gap-2">
        <button onClick={() => { setTitle(''); setOpen(false); }} className="text-[11px] text-zinc-500 hover:text-zinc-300">Cancel</button>
        <button onClick={submit} disabled={pending} className="inline-flex items-center gap-1 rounded bg-rose-500 hover:bg-rose-600 disabled:opacity-50 px-2 py-1 text-[11px] font-semibold text-white">
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Add
        </button>
      </div>
    </div>
  );
}

// ── Task detail drawer ────────────────────────────────────────────────

function TaskDrawer({
  taskId, board, onClose, onChanged,
}: {
  taskId: string; board: KanbanBoardData; onClose: () => void; onChanged: () => void;
}) {
  const task = board.tasks.find(t => t.id === taskId);
  const [draft, setDraft] = useState(task);
  const [comments, setComments] = useState<TaskComment[] | null>(null);
  const [commentBody, setCommentBody] = useState('');
  const [savingField, startFieldSave] = useTransition();
  const [addingComment, startAddComment] = useTransition();

  useEffect(() => { setDraft(task); }, [task]);

  useEffect(() => {
    let cancelled = false;
    loadTaskComments(taskId).then(c => { if (!cancelled) setComments(c); });
    return () => { cancelled = true; };
  }, [taskId]);

  if (!task || !draft) return null;

  const patch = <K extends keyof typeof draft>(key: K, val: (typeof draft)[K]) => {
    setDraft({ ...draft, [key]: val } as typeof draft);
    startFieldSave(async () => {
      await updateTaskAction({
        taskId,
        [key === 'assignee_id' ? 'assigneeId' : key === 'due_date' ? 'dueDate' : key]: val as unknown as string,
      } as Parameters<typeof updateTaskAction>[0]);
      onChanged();
    });
  };

  const addComment = () => {
    const body = commentBody.trim();
    if (!body) return;
    startAddComment(async () => {
      await addTaskCommentAction({ taskId, body });
      setCommentBody('');
      const next = await loadTaskComments(taskId);
      setComments(next);
      onChanged();
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <aside className="fixed right-0 top-0 bottom-0 w-full max-w-[520px] bg-zinc-950 border-l border-zinc-800 z-50 overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">Task detail</span>
          <div className="flex items-center gap-2">
            {savingField && <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />}
            <button onClick={onClose} className="p-1 text-zinc-500 hover:text-white"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="px-5 py-5 space-y-6">

          {/* Title */}
          <input
            value={draft.title}
            onChange={e => setDraft({ ...draft, title: e.target.value })}
            onBlur={() => { if (draft.title !== task.title) patch('title', draft.title); }}
            className="w-full bg-transparent text-lg font-semibold text-white outline-none border-b border-transparent focus:border-zinc-700 pb-1"
          />

          {/* Fields grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <FieldSelect label="Status" value={draft.status} onChange={v => patch('status', v as TaskStatus)}
              options={TASK_STATUSES.map(s => ({ value: s, label: TASK_STATUS_LABELS[s] }))} />
            <FieldSelect label="Priority" value={draft.priority} onChange={v => patch('priority', v as TaskPriority)}
              options={TASK_PRIORITIES.map(p => ({ value: p, label: p }))} />
            <FieldSelect
              label="Assignee"
              value={draft.assignee_id ?? ''}
              onChange={v => patch('assignee_id', (v || null) as unknown as string)}
              options={[{ value: '', label: 'Unassigned' }, ...board.employees.map(e => ({ value: e.id, label: e.name }))]}
            />
            <FieldDate label="Due date" value={draft.due_date} onChange={v => patch('due_date', v as unknown as string)} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Description</label>
            <textarea
              rows={4}
              value={draft.description ?? ''}
              onChange={e => setDraft({ ...draft, description: e.target.value })}
              onBlur={() => { if ((draft.description ?? '') !== (task.description ?? '')) patch('description', draft.description); }}
              placeholder="Add a richer description…"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-600 outline-none resize-y"
            />
          </div>

          {/* Comments */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="h-4 w-4 text-zinc-500" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">Comments</span>
              <span className="text-[11px] text-zinc-500">{comments?.length ?? '…'}</span>
            </div>
            <div className="space-y-3 mb-3">
              {comments?.map(c => (
                <div key={c.id} className="rounded-lg bg-zinc-900/60 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white">{c.author}</span>
                    <span className="text-[10px] text-zinc-500">{new Date(c.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{c.body}</p>
                </div>
              ))}
              {comments && comments.length === 0 && (
                <p className="text-xs text-zinc-600 italic">No comments yet.</p>
              )}
            </div>
            <div className="flex gap-2">
              <textarea
                rows={2}
                value={commentBody}
                onChange={e => setCommentBody(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addComment(); }}
                placeholder="Leave a comment… (⌘↵ to submit)"
                className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-600 outline-none resize-y"
              />
              <button
                onClick={addComment}
                disabled={addingComment || !commentBody.trim()}
                className="self-end inline-flex items-center gap-1 rounded-lg bg-rose-500 hover:bg-rose-600 disabled:opacity-50 px-3 py-2 text-xs font-semibold text-white"
              >
                {addingComment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Post
              </button>
            </div>
          </div>

          {/* Danger */}
          <div className="pt-4 border-t border-zinc-800">
            <button
              onClick={async () => {
                if (!confirm('Delete this task? This cannot be undone.')) return;
                await deleteTaskAction(taskId);
                onClose();
                onChanged();
              }}
              className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete task
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

// ── Field primitives ─────────────────────────────────────────────────

function FieldSelect({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-1.5 text-sm text-white focus:border-zinc-600 outline-none">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function FieldDate({ label, value, onChange }: { label: string; value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1 flex items-center gap-1">
        <Calendar className="h-3 w-3" /> {label}
      </label>
      <input
        type="date"
        value={value ?? ''}
        onChange={e => onChange(e.target.value || null)}
        className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-1.5 text-sm text-white focus:border-zinc-600 outline-none"
      />
    </div>
  );
}
