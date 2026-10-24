import { useMemo, useState } from 'react';
import { BriefcaseBusiness, Check, FileText, ImagePlus, MessageSquare, Plus, Trash2, X } from 'lucide-react';
import type { ProjectStatus, ProjectTask, ProjectTaskStatus } from '../types/projects';
import { useProjects } from '../hooks/useProjects';
import type { FamilyMember } from '../types/family';

const statuses: Array<{ value: ProjectTaskStatus; label: string }> = [
  { value: 'backlog', label: 'Backlog' }, { value: 'next', label: 'Next' },
  { value: 'in-progress', label: 'In progress' }, { value: 'blocked', label: 'Blocked' }, { value: 'done', label: 'Done' },
];

function TaskDetail({ task, projectId, sectionId, members, updateTask, deleteTask, onClose }: {
  task: ProjectTask; projectId: string; sectionId: string; members: FamilyMember[];
  updateTask: ReturnType<typeof useProjects>['updateTask']; deleteTask: ReturnType<typeof useProjects>['deleteTask']; onClose: () => void;
}) {
  const [comment, setComment] = useState('');
  const [attachment, setAttachment] = useState('');
  const patch = (value: Partial<ProjectTask>) => updateTask(projectId, sectionId, task.id, value);
  const addComment = () => {
    if (!comment.trim()) return;
    patch({ comments: [...task.comments, { id: `comment-${Date.now()}`, author: 'Harr', body: comment.trim(), createdAt: new Date().toISOString() }] });
    setComment('');
  };
  const addAttachment = () => {
    if (!attachment.trim()) return;
    patch({ attachments: [...task.attachments, { id: `attachment-${Date.now()}`, name: attachment.trim().split('/').pop() || 'Link', url: attachment.trim(), kind: 'link' }] });
    setAttachment('');
  };
  return <div className="projects-detail-panel">
    <div className="projects-panel-header"><div><span className="projects-eyebrow">Task</span><h2>{task.title}</h2></div><button type="button" className="projects-icon-button" onClick={onClose} aria-label="Close task"><X size={18} /></button></div>
    <label className="projects-field">Description<textarea value={task.description} onChange={(e) => patch({ description: e.target.value })} placeholder="What needs to happen?" /></label>
    <div className="projects-field-grid">
      <label className="projects-field">Status<select value={task.status} onChange={(e) => patch({ status: e.target.value as ProjectTaskStatus })}>{statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
      <label className="projects-field">Assignee<select value={task.assignee} onChange={(e) => patch({ assignee: e.target.value })}><option value="">Unassigned</option>{members.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}</select></label>
      <label className="projects-field">Priority<select value={task.priority} onChange={(e) => patch({ priority: e.target.value as ProjectTask['priority'] })}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></label>
      <label className="projects-field">Due date<input type="date" value={task.dueDate} onChange={(e) => patch({ dueDate: e.target.value })} /></label>
    </div>
    <div className="projects-subsection"><h3><MessageSquare size={15} /> Comments</h3>{task.comments.map((c) => <div className="projects-comment" key={c.id}><strong>{c.author}</strong><span>{c.body}</span></div>)}<div className="projects-inline-form"><input value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addComment()} placeholder="Add a comment" /><button type="button" onClick={addComment}><Plus size={16} /></button></div></div>
    <div className="projects-subsection"><h3><FileText size={15} /> Files & links</h3>{task.attachments.map((a) => <a className="projects-attachment" href={a.url} target="_blank" rel="noreferrer" key={a.id}><ImagePlus size={15} />{a.name}</a>)}<div className="projects-inline-form"><input value={attachment} onChange={(e) => setAttachment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addAttachment()} placeholder="Paste a photo, file, or link URL" /><button type="button" onClick={addAttachment}><Plus size={16} /></button></div><small>Links are stored with the task. File uploads can be added in a follow-up.</small></div>
    <button type="button" className="projects-danger-button" onClick={() => { deleteTask(projectId, sectionId, task.id); onClose(); }}><Trash2 size={15} /> Delete task</button>
  </div>;
}

export function ProjectsView({ members }: { members: FamilyMember[] }) {
  const { projects, addProject, updateProject, removeProject, addSection, addTask, updateTask, deleteTask } = useProjects();
  const [selectedId, setSelectedId] = useState<string | null>(projects[0]?.id || null);
  const [selectedTask, setSelectedTask] = useState<{ task: ProjectTask; projectId: string; sectionId: string } | null>(null);
  const [newProject, setNewProject] = useState('');
  const [newSection, setNewSection] = useState('');
  const [newTasks, setNewTasks] = useState<Record<string, string>>({});
  const selected = projects.find((p) => p.id === selectedId) || projects[0];
  const allTasks = useMemo(() => selected?.sections.flatMap((s) => s.tasks) || [], [selected]);
  const createProject = () => { if (!newProject.trim()) return; const id = addProject(newProject); setSelectedId(id); setNewProject(''); };
  if (!selected) return <main className="projects-view"><div className="projects-empty"><BriefcaseBusiness size={42} /><h1>Projects</h1><p>Organize home, school, and family work in one shared space.</p><div className="projects-create-row"><input value={newProject} onChange={(e) => setNewProject(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createProject()} placeholder="Create your first project" /><button type="button" onClick={createProject}><Plus size={17} /> Create project</button></div></div></main>;
  return <main className="projects-view"><header className="projects-header"><div><span className="projects-eyebrow">Shared workspace</span><h1><BriefcaseBusiness size={28} /> Projects</h1><p>{projects.length} project{projects.length === 1 ? '' : 's'} · {allTasks.filter((t) => t.status !== 'done').length} open tasks</p></div><div className="projects-create-row"><input value={newProject} onChange={(e) => setNewProject(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createProject()} placeholder="New project" /><button type="button" onClick={createProject}><Plus size={17} /> Add</button></div></header><div className="projects-layout"><aside className="projects-list">{projects.map((p) => <button type="button" key={p.id} className={`projects-list-item ${p.id === selected.id ? 'is-selected' : ''}`} onClick={() => { setSelectedId(p.id); setSelectedTask(null); }}><span className="projects-color-dot" style={{ background: p.color }} /><span><strong>{p.name}</strong><small>{p.sections.reduce((n, s) => n + s.tasks.length, 0)} tasks · {p.status}</small></span></button>)}</aside><section className="projects-board"><div className="projects-project-header"><div><input className="projects-title-input" value={selected.name} onChange={(e) => updateProject(selected.id, { name: e.target.value })} /><textarea value={selected.description} onChange={(e) => updateProject(selected.id, { description: e.target.value })} placeholder="Add a project description" /></div><div className="projects-header-actions"><select value={selected.status} onChange={(e) => updateProject(selected.id, { status: e.target.value as ProjectStatus })}><option value="active">Active</option><option value="on-hold">On hold</option><option value="completed">Completed</option></select><input type="date" value={selected.dueDate} onChange={(e) => updateProject(selected.id, { dueDate: e.target.value })} /><button type="button" className="projects-danger-button" onClick={() => { removeProject(selected.id); setSelectedId(projects.find((p) => p.id !== selected.id)?.id || null); }}><Trash2 size={15} /></button></div></div>{selected.sections.map((section) => <div className="projects-section" key={section.id}><div className="projects-section-header"><h2>{section.name}<span>{section.tasks.length}</span></h2><div className="projects-create-row"><input value={newTasks[section.id] || ''} onChange={(e) => setNewTasks({ ...newTasks, [section.id]: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter' && newTasks[section.id]?.trim()) { addTask(selected.id, section.id, newTasks[section.id]); setNewTasks({ ...newTasks, [section.id]: '' }); } }} placeholder="Add task" /><button type="button" onClick={() => { if (newTasks[section.id]?.trim()) { addTask(selected.id, section.id, newTasks[section.id]); setNewTasks({ ...newTasks, [section.id]: '' }); } }}><Plus size={16} /></button></div></div>{section.tasks.map((task) => <button type="button" className="projects-task-card" key={task.id} onClick={() => setSelectedTask({ task, projectId: selected.id, sectionId: section.id })}><span className={`projects-status-dot projects-status-${task.status}`} /><span className="projects-task-main"><strong>{task.title}</strong><small>{task.assignee || 'Unassigned'} · {statuses.find((s) => s.value === task.status)?.label}{task.comments.length ? ` · ${task.comments.length} comments` : ''}</small></span><select value={task.status} onClick={(e) => e.stopPropagation()} onChange={(e) => updateTask(selected.id, section.id, task.id, { status: e.target.value as ProjectTaskStatus })}>{statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>{task.status === 'done' && <Check size={17} />}</button>)}</div>)}<div className="projects-add-section"><input value={newSection} onChange={(e) => setNewSection(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newSection.trim()) { addSection(selected.id, newSection); setNewSection(''); } }} placeholder="Add a project section" /><button type="button" onClick={() => { if (newSection.trim()) { addSection(selected.id, newSection); setNewSection(''); } }}><Plus size={16} /> Section</button></div></section>{selectedTask && <TaskDetail task={selectedTask.task} projectId={selectedTask.projectId} sectionId={selectedTask.sectionId} members={members} updateTask={updateTask} deleteTask={deleteTask} onClose={() => setSelectedTask(null)} />}</div></main>;
}

