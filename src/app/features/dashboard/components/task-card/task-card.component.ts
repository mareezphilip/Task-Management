import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-task-card',
  standalone: true,
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCardComponent {
  readonly task = input.required<Task>();
  readonly editRequested = output<Task>();
  readonly deleteRequested = output<Task>();
  protected menuOpen = false;

  protected editTask(): void {
    this.menuOpen = false;
    this.editRequested.emit(this.task());
  }

  protected deleteTask(): void {
    this.menuOpen = false;
    this.deleteRequested.emit(this.task());
  }
}
