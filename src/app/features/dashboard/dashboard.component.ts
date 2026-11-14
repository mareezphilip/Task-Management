import { TranslatePipe } from '../../core/pipes/translate.pipe';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ApiTask,
  ApiTaskStatus,
  DashboardMetric,
  Task,
  TaskMove,
  TaskPriority,
  TaskStatus,
  TASK_PRIORITY_OPTIONS,
} from './models/task.model';
import { DashboardDataService } from './services/dashboard-data.service';
import { DashboardSearchService } from './services/dashboard-search.service';
import { TaskLocalizationService } from './services/task-localization.service';
import { CreateTaskDialogComponent } from './components/create-task-dialog/create-task-dialog.component';
import { StatisticsCardsComponent } from './components/statistics-cards/statistics-cards.component';
import { TaskBoardComponent } from './components/task-board/task-board.component';
import { ActivityFeedComponent } from './components/activity-feed/activity-feed.component';
import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog/confirm-dialog.component';
import { LoadingService } from '../../core/services/loading-service/loading.service';

import { I18nService } from '../../core/services/i18n/i18n.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatDialogModule,
    FormsModule,
    SelectModule,
    TranslatePipe,
    StatisticsCardsComponent,
    TaskBoardComponent,
    ActivityFeedComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly dashboardData = inject(DashboardDataService);
  private readonly dashboardSearch = inject(DashboardSearchService);
  private readonly dialog = inject(MatDialog);
  private readonly i18n = inject(I18nService);
  private readonly taskLocalization = inject(TaskLocalizationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetector = inject(ChangeDetectorRef);
  protected readonly loading = inject(LoadingService);
  private readonly statistics = signal<DashboardMetric[]>([]);
  protected readonly activityTasks = this.dashboardData.tasks;
  private readonly optimisticTasks = signal<Task[] | null>(null);
  protected readonly tasks = computed(() => {
    const search = this.dashboardSearch.searchTerm().toLowerCase();
    const sourceTasks = this.dashboardData.tasks();
    const sourceById = new Map(sourceTasks.map((task) => [task.id, task]));
    const optimisticTasks = this.optimisticTasks();
    return (
      optimisticTasks
        ? optimisticTasks.map((task) => {
            const source = sourceById.get(task.id);
            return source ? { ...this.toDashboardTask(source), status: task.status } : task;
          })
        : sourceTasks.map((task) => this.toDashboardTask(task))
    )
      .filter(
        (task) =>
          this.activeFilter() === 'all' || this.toApiStatus(task.status) === this.activeFilter(),
      )
      .filter(
        (task) => this.selectedPriority() === 'all' || task.priority === this.selectedPriority(),
      )
      .filter(
        (task) =>
          this.selectedAssignee() === 'all' || task.assignee.fullName === this.selectedAssignee(),
      )
      .filter(
        (task) => !search || `${task.title} ${task.description}`.toLowerCase().includes(search),
      );
  });
  protected readonly priorityOptions = computed(() => [
    { label: this.i18n.translate('task.filter.allPriorities'), value: 'all' as const },
    ...TASK_PRIORITY_OPTIONS.map((option) => ({
      ...option,
      label: this.i18n.translate(`priority.${option.value}`),
    })),
  ]);
  protected readonly assigneeOptions = computed(() => [
    { label: this.i18n.translate('task.filter.allAssignees'), value: 'all' },
    ...Array.from(
      new Set(
        this.dashboardData
          .tasks()
          .map((task) => task.assignee.name.trim())
          .filter(Boolean),
      ),
    )
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ label: name, value: name })),
  ]);
  protected readonly metrics = computed(() => {
    const tasks = this.dashboardData.tasks();
    return this.statistics().map((metric) => ({
      ...metric,
      caption: this.translateMetricCaption(metric.caption),
      value:
        metric.label === 'Total Tasks'
          ? tasks.length
          : metric.label === 'Completed'
            ? tasks.filter((task) => task.status === 'done').length
            : metric.label === 'In Progress'
              ? tasks.filter((task) => task.status === 'in_progress').length
              : metric.label === 'Overdue'
                ? tasks.filter((task) => task.isOverdue).length
                : metric.value,
    }));
  });
  protected isSavingMove = false;
  protected readonly activeFilter = signal<ApiTaskStatus | 'all'>('all');
  protected readonly selectedPriority = signal<TaskPriority | 'all'>('all');
  protected readonly selectedAssignee = signal<string>('all');
  protected readonly filters: { label: string; status: ApiTaskStatus | 'all' }[] = [
    { label: 'filter.all', status: 'all' },
    { label: 'filter.todo', status: 'todo' },
    { label: 'filter.progress', status: 'in_progress' },
    { label: 'filter.completed', status: 'done' },
  ];

  ngOnInit(): void {
    this.loadStatistics();
    this.loadTasks();
  }

  protected selectFilter(status: ApiTaskStatus | 'all'): void {
    this.activeFilter.set(status);
  }

  protected openCreateForm(): void {
    this.dialog.open(CreateTaskDialogComponent, {
      width: 'min(50rem, 94vw)',
      maxWidth: '94vw',
      disableClose: true,
    });
  }

  protected editTask(task: Task): void {
    const apiTask = this.dashboardData.tasks().find((item) => item.id === task.id);
    if (!apiTask) return;
    this.dialog.open(CreateTaskDialogComponent, {
      width: 'min(50rem, 94vw)',
      maxWidth: '94vw',
      disableClose: true,
      data: apiTask,
    });
  }

  protected deleteTask(task: Task): void {
    const confirmationRef = this.dialog.open(ConfirmDialogComponent, {
      width: 'min(26rem, 90vw)',
      data: {
        title: this.i18n.translate('confirm.deleteTitle'),
        message: this.i18n.translate('confirm.deleteMessage'),
        danger: true,
      },
    });
    confirmationRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.dashboardData.deleteTask(task.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    });
  }

  protected moveTask(change: TaskMove): void {
    if (this.isSavingMove) return;
    const reorderedTasks = this.dashboardData
      .tasks()
      .filter((task) => task.id !== change.task.id)
      .map((task) => this.toDashboardTask(task));
    const beforeIndex = reorderedTasks.findIndex((task) => task.id === change.beforeTaskId);
    reorderedTasks.splice(beforeIndex === -1 ? reorderedTasks.length : beforeIndex, 0, {
      ...change.task,
      status: change.status,
    });
    this.optimisticTasks.set(reorderedTasks);
    this.isSavingMove = true;

    this.dashboardData
      .moveTask(change.task.id, this.toApiStatus(change.status), change.beforeTaskId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.optimisticTasks.set(null);
          this.isSavingMove = false;
          this.changeDetector.markForCheck();
        }),
      )
      .subscribe();
  }

  private loadStatistics(): void {
    this.dashboardData.getStatistics().subscribe({
      next: (response) => {
        this.statistics.set(
          response.statistics.map((statistic) => ({
            label: statistic.title,
            value: statistic.value,
            caption: `${statistic.change} ${statistic.changeLabel}`,
            icon: statistic.icon,
            tone: this.metricTone(statistic.color),
          })),
        );
        this.changeDetector.markForCheck();
      },
    });
  }

  private loadTasks(): void {
    this.dashboardData.getTasks().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  private toDashboardTask(task: ApiTask): Task {
    const dueDate = new Date(task.dueDate);
    const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / 86_400_000);
    const dueLabel =
      task.status === 'done'
        ? 'Completed'
        : task.isOverdue
          ? `Overdue by ${Math.max(1, Math.abs(daysUntilDue))} day${Math.abs(daysUntilDue) === 1 ? '' : 's'}`
          : daysUntilDue === 0
            ? 'Due today'
            : `Due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`;
    const dueKey: Task['dueKey'] =
      task.status === 'done'
        ? 'completed'
        : task.isOverdue
          ? 'overdueDays'
          : daysUntilDue === 0
            ? 'today'
            : 'inDays';

    return {
      id: task.id,
      title: this.taskLocalization.translate(task.title),
      description: this.taskLocalization.translate(task.description),
      priority: task.priority,
      status: task.status === 'in_progress' ? 'in-progress' : task.status,
      dueLabel,
      dueKey,
      dueDays: Math.max(1, Math.abs(daysUntilDue)),
      category: task.tags[0] ?? 'General',
      assignee: {
        name: task.assignee.name.split(' ')[0],
        fullName: task.assignee.name,
        initials: task.assignee.name
          .split(' ')
          .map((part) => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
      },
      overdue: task.isOverdue,
    };
  }

  private metricTone(color: string): DashboardMetric['tone'] {
    return color === 'green' || color === 'slate' || color === 'red' ? color : 'blue';
  }

  private translateMetricCaption(caption: string): string {
    const numericPrefix = caption.match(/^([+-]?\d+)\s+(.+)$/);
    if (!numericPrefix) return this.i18n.translate(`metric.caption.${caption}`);
    return `${numericPrefix[1]} ${this.i18n.translate(`metric.caption.${numericPrefix[2]}`)}`;
  }

  private toApiStatus(status: TaskStatus): ApiTaskStatus {
    return status === 'in-progress' ? 'in_progress' : status;
  }
}
