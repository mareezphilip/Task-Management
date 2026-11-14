import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  effect,
  inject,
  input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import Chart from 'chart.js/auto';

import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { I18nService } from '../../../../core/services/i18n/i18n.service';
import { ApiTask } from '../../models/task.model';

@Component({
  selector: 'app-statistics-charts',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './statistics-charts.component.html',
  styleUrl: './statistics-charts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsChartsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('statusCanvas') private statusCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('priorityCanvas') private priorityCanvas?: ElementRef<HTMLCanvasElement>;

  readonly tasks = input<ApiTask[]>([]);
  readonly distribution = computed(() => {
    const tasks = this.tasks();
    return (['todo', 'in_progress', 'done'] as const).map((status) => {
      const labelKey =
        status === 'todo'
          ? 'status.todo'
          : status === 'done'
            ? 'status.completed'
            : 'status.progress';
      return { status, labelKey, count: tasks.filter((task) => task.status === status).length };
    });
  });
  readonly priorities = computed(() =>
    (['low', 'medium', 'high'] as const).map((priority) => ({
      priority,
      count: this.tasks().filter((task) => task.priority === priority).length,
    })),
  );

  private readonly i18n = inject(I18nService);
  private statusChart?: Chart<'doughnut', number[], string>;
  private priorityChart?: Chart<'bar', number[], string>;

  constructor() {
    effect(() => this.updateCharts(this.tasks(), this.i18n.language()));
  }

  ngAfterViewInit(): void {
    this.updateCharts(this.tasks(), this.i18n.language());
  }

  ngOnDestroy(): void {
    this.statusChart?.destroy();
    this.priorityChart?.destroy();
  }

  private updateCharts(tasks: ApiTask[], language: string): void {
    if (!this.statusCanvas || !this.priorityCanvas) return;

    const statuses = ['todo', 'in_progress', 'done'] as const;
    const priorities = ['low', 'medium', 'high'] as const;
    const statusCounts = statuses.map(
      (status) => tasks.filter((task) => task.status === status).length,
    );
    const priorityCounts = priorities.map(
      (priority) => tasks.filter((task) => task.priority === priority).length,
    );
    const statusLabels = ['status.todo', 'status.progress', 'status.completed'].map((key) =>
      this.i18n.translate(key),
    );
    const priorityLabels = priorities.map((priority) =>
      this.i18n.translate(`priority.${priority}`),
    );
    const rtl = language === 'ar';

    if (!this.statusChart) {
      const context = this.statusCanvas.nativeElement.getContext('2d');
      if (!context) return;
      this.statusChart = new Chart(context, {
        type: 'doughnut',
        data: {
          labels: statusLabels,
          datasets: [
            {
              data: statusCounts,
              backgroundColor: ['#8b5cf6', '#2587d9', '#24a36a'],
              borderWidth: 0,
              hoverOffset: 5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: { legend: { display: false } },
        },
      });
    } else {
      this.statusChart.data.labels = statusLabels;
      this.statusChart.data.datasets[0].data = statusCounts;
      this.statusChart.update();
    }

    if (!this.priorityChart) {
      const context = this.priorityCanvas.nativeElement.getContext('2d');
      if (!context) return;
      this.priorityChart = new Chart(context, {
        type: 'bar',
        data: {
          labels: priorityLabels,
          datasets: [
            {
              data: priorityCounts,
              backgroundColor: ['#24a36a', '#e9a23b', '#dc5361'],
              borderRadius: 6,
              maxBarThickness: 48,
            },
          ],
        },
        options: {
          indexAxis: rtl ? 'y' : 'x',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              beginAtZero: true,
              ticks: { precision: 0 },
              grid: { display: rtl },
              border: { display: false },
            },
            y: {
              beginAtZero: true,
              ticks: { precision: 0 },
              grid: { display: !rtl },
              border: { display: false },
            },
          },
        },
      });
    } else {
      this.priorityChart.data.labels = priorityLabels;
      this.priorityChart.data.datasets[0].data = priorityCounts;
      this.priorityChart.options.indexAxis = rtl ? 'y' : 'x';
      this.priorityChart.update();
    }
  }
}
