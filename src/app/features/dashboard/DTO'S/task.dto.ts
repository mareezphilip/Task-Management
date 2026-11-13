import type { ApiTaskStatus, TaskPriority } from '../models/task.model';
import type { Assignee } from '../../team/models/assignee.model';

/** Request body sent to the task create and update endpoints. */
export class TaskDto {
  title: string;
  description: string;
  status: ApiTaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignee: Pick<Assignee, 'name' | 'email'>;
  tags: string[];

  constructor(taskData: Partial<TaskDto> = {}) {
    this.title = taskData.title ?? '';
    this.description = taskData.description ?? '';
    this.status = taskData.status ?? 'todo';
    this.priority = taskData.priority ?? 'medium';
    this.dueDate = taskData.dueDate ?? '';
    this.assignee = { name: '', email: '', ...taskData.assignee };
    this.tags = [...(taskData.tags ?? [])];
  }
}
