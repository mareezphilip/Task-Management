import type { TaskDto } from "../DTO'S/task.dto";
import type { Assignee } from '../../team/models/assignee.model';

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export interface TaskMove {
  task: Task;
  status: TaskStatus;
  beforeTaskId: string | null;
}
export type ApiTaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export const TASK_PRIORITY_OPTIONS: readonly { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];
export type ChangeType = 'positive' | 'negative' | 'neutral';

export interface Statistic {
  id: string;
  title: string;
  icon: string;
  value: number;
  change: string;
  changeLabel: string;
  changeType: ChangeType;
  color: string;
}

export interface StatisticsResponse {
  statistics: Statistic[];
  lastUpdated: string;
}

export type ApiAssignee = Assignee;

export interface ApiTask {
  id: string;
  title: string;
  description: string;
  status: ApiTaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue: boolean;
  completedAt: string | null;
  assignee: ApiAssignee;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type UpdateTaskRequest = TaskDto;

export interface TasksResponse {
  tasks: ApiTask[];
  meta: { totalCount: number; lastUpdated: string };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueLabel: string;
  dueKey?: 'completed' | 'today' | 'inDays' | 'overdueDays';
  dueDays?: number;
  category: string;
  assignee: { name: string; fullName?: string; initials: string };
  overdue?: boolean;
}

export interface DashboardMetric {
  label: string;
  value: number;
  caption: string;
  icon: string;
  tone: 'blue' | 'green' | 'slate' | 'red';
}
