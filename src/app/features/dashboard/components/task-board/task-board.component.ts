import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Task, TaskMove, TaskStatus } from '../../models/task.model';
import { TaskCardComponent } from '../task-card/task-card.component';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [TaskCardComponent, DragDropModule, TranslatePipe],
  templateUrl: './task-board.component.html',
  styleUrl: './task-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskBoardComponent {
  readonly tasks = input.required<Task[]>();
  readonly saving = input(false);
  readonly editRequested = output<Task>();
  readonly deleteRequested = output<Task>();
  readonly taskMoved = output<TaskMove>();
  protected readonly columns: { status: TaskStatus; label: string }[] = [
    { status: 'todo', label: 'board.todo' },
    { status: 'in-progress', label: 'board.progress' },
    { status: 'done', label: 'board.done' },
  ];

  protected tasksFor(status: TaskStatus): Task[] {
    return this.tasks().filter((task) => task.status === status);
  }

  protected dropTask(event: CdkDragDrop<TaskStatus, TaskStatus, Task>): void {
    if (this.saving() || !event.isPointerOverContainer) return;
    const task = event.item.data;
    const status = event.container.data;
    if (event.previousContainer === event.container && event.previousIndex === event.currentIndex)
      return;

    const destinationTasks = this.tasksFor(status).filter((item) => item.id !== task.id);
    this.taskMoved.emit({
      task,
      status,
      beforeTaskId: destinationTasks[event.currentIndex]?.id ?? null,
    });
  }
}
