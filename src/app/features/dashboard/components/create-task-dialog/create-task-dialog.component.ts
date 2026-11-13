import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  output,
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { finalize } from 'rxjs';
import { TaskDto } from "../../DTO'S/task.dto";
import { ApiTask, ApiTaskStatus, TASK_PRIORITY_OPTIONS } from '../../models/task.model';
import { DashboardDataService } from '../../services/dashboard-data.service';
import { ConfirmDialogComponent } from '../../../../shared/ui/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-create-task-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, InputTextModule, CheckboxModule, SelectModule],
  templateUrl: './create-task-dialog.component.html',
  styleUrl: './create-task-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateTaskDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CreateTaskDialogComponent>);
  private readonly dialog = inject(MatDialog);
  private readonly dashboardData = inject(DashboardDataService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly formBuilder = inject(FormBuilder);
  protected readonly taskToEdit = inject<ApiTask | null>(MAT_DIALOG_DATA, { optional: true });
  readonly taskSaved = output<void>();
  protected loading = false;

  protected readonly statusOptions: { value: ApiTaskStatus; label: string }[] = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Completed' },
  ];
  protected readonly priorityOptions = TASK_PRIORITY_OPTIONS;
  protected readonly tagOptions = [
    'Design',
    'Development',
    'Documentation',
    'Finance',
    'Operations',
  ];
  protected readonly taskDto = new TaskDto();
  protected readonly taskForm: FormGroup;
  constructor() {
    const task = this.taskToEdit;
    if (task) this.taskDto = new TaskDto({ ...task, dueDate: task.dueDate.slice(0, 10) });
    this.taskForm = this.formBuilder.nonNullable.group({
      title: [
        this.taskDto.title,
        [Validators.required, Validators.pattern(/[\s\S]*\S[\s\S]*/), Validators.maxLength(120)],
      ],
      description: [
        this.taskDto.description,
        [Validators.required, Validators.pattern(/[\s\S]*\S[\s\S]*/)],
      ],
      status: [this.taskDto.status, Validators.required],
      priority: [this.taskDto.priority, Validators.required],
      dueDate: [this.taskDto.dueDate, Validators.required],
      assigneeName: [
        this.taskDto.assignee.name,
        [Validators.required, Validators.pattern(/[\s\S]*\S[\s\S]*/)],
      ],
      assigneeEmail: [this.taskDto.assignee.email, [Validators.required, Validators.email]],
      tags: [this.taskDto.tags],
    });
  }

  protected close(): void {
    if (!this.hasUnsavedChanges()) {
      this.dialogRef.close();
      return;
    }

    const confirmationRef = this.dialog.open(ConfirmDialogComponent, {
      width: 'min(26rem, 90vw)',
      data: {
        title: 'Discard changes',
        message: `Are you sure you want to cancel  ${this.taskToEdit ? 'editing the task' : 'adding new task'} `,
        danger: true,
      },
    });
    confirmationRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.dialogRef.close();
    });
  }

  private hasUnsavedChanges(): boolean {
    return this.taskForm.dirty;
  }

  protected submitTask(): void {
    if (this.loading) return;
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const value = this.taskForm.getRawValue();
    const request = new TaskDto({
      title: value.title.trim(),
      description: value.description.trim(),
      status: value.status,
      priority: value.priority,
      dueDate: value.dueDate,
      tags: value.tags,
      assignee: {
        name: value.assigneeName.trim(),
        email: value.assigneeEmail.trim(),
      },
    });

    this.loading = true;

    const saveTask = this.taskToEdit
      ? this.dashboardData.updateTask(this.taskToEdit.id, request)
      : this.dashboardData.createTask(request);
    saveTask
      .pipe(
        finalize(() => {
          this.loading = false;
          this.changeDetector.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.taskSaved.emit();
          this.dialogRef.close();
        },
      });
  }
}
