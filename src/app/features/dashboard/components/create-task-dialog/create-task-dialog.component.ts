import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TaskDto } from "../../DTO'S/task.dto";
import { ApiTask, ApiTaskStatus, TASK_PRIORITY_OPTIONS } from '../../models/task.model';
import { DashboardDataService } from '../../services/dashboard-data.service';
import { TeamDataService } from '../../../team/services/TeamDataService/team-data.service';
import type { Assignee } from '../../../team/models/assignee.model';
import { ConfirmDialogComponent } from '../../../../shared/ui/confirm-dialog/confirm-dialog.component';

import { I18nService } from '../../../../core/services/i18n/i18n.service';

@Component({
  selector: 'app-create-task-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    InputTextModule,
    CheckboxModule,
    SelectModule,
    TranslatePipe,
  ],
  templateUrl: './create-task-dialog.component.html',
  styleUrl: './create-task-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateTaskDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<CreateTaskDialogComponent>);
  private readonly dialog = inject(MatDialog);
  private readonly dashboardData = inject(DashboardDataService);
  private readonly i18n = inject(I18nService);
  private readonly teamData = inject(TeamDataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly formBuilder = inject(FormBuilder);
  protected readonly taskToEdit = inject<ApiTask | null>(MAT_DIALOG_DATA, { optional: true });
  readonly taskSaved = output<void>();
  protected loading = false;
  protected readonly teamMembers = signal<Assignee[]>([]);
  protected readonly membersLoading = signal(true);

  protected readonly statusOptions = computed(() =>
    [
      { value: 'todo' as ApiTaskStatus, key: 'status.todo' },
      { value: 'in_progress' as ApiTaskStatus, key: 'status.progress' },
      { value: 'done' as ApiTaskStatus, key: 'status.completed' },
    ].map(({ value, key }) => ({ value, label: this.i18n.translate(key) })),
  );
  protected readonly priorityOptions = computed(() =>
    TASK_PRIORITY_OPTIONS.map((option) => ({
      ...option,
      label: this.i18n.translate(`priority.${option.value}`),
    })),
  );
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
    if (task) {
      this.taskDto = new TaskDto({
        ...task,
        dueDate: task.dueDate.slice(0, 10),
      });
    }
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
      assigneeEmail: [this.taskDto.assignee.email, [Validators.required, Validators.email]],
      tags: [this.taskDto.tags],
    });
  }

  ngOnInit(): void {
    this.teamData
      .getMembers()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.membersLoading.set(false)),
      )
      .subscribe(({ members }) => {
        this.teamMembers.set(members);
        const assigneeEmail = this.taskForm.controls['assigneeEmail'].value;
        if (assigneeEmail && !members.some((member) => member.email === assigneeEmail)) {
          this.taskForm.controls['assigneeEmail'].setValue('');
        }
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
        title: this.i18n.translate('confirm.discardTitle'),
        message: this.i18n.translate('confirm.discardMessage'),
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
    const selectedAssignee = this.teamMembers().find(
      (member) => member.email === value.assigneeEmail,
    );
    if (!selectedAssignee) {
      this.taskForm.controls['assigneeEmail'].setErrors({ required: true });
      this.taskForm.controls['assigneeEmail'].markAsTouched();
      return;
    }
    const request = new TaskDto({
      title:
        this.taskToEdit && !this.taskForm.controls['title'].dirty
          ? this.taskToEdit.title
          : value.title.trim(),
      description:
        this.taskToEdit && !this.taskForm.controls['description'].dirty
          ? this.taskToEdit.description
          : value.description.trim(),
      status: value.status,
      priority: value.priority,
      dueDate: value.dueDate,
      tags: value.tags,
      assignee: {
        name: selectedAssignee.name,
        email: selectedAssignee.email,
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
