import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { ApiTask } from '../../models/task.model';
import type { ActivityItem } from '../../models/activity.model';
import { ActivityCardComponent } from '../activity-card/activity-card.component';

import { TaskLocalizationService } from '../../services/task-localization.service';

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [ActivityCardComponent, TranslatePipe],
  templateUrl: './activity-feed.component.html',
  styleUrl: './activity-feed.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityFeedComponent {
  private readonly taskLocalization = inject(TaskLocalizationService);
  readonly tasks = input.required<ApiTask[]>();

  // label updates only when updatedAt is later than createdAt, and keep the five newest.
  protected readonly recentActivities = computed<ActivityItem[]>(() =>
    this.tasks()
      .flatMap((task) => {
        const createdAt = Date.parse(task.createdAt);
        const updatedAt = Date.parse(task.updatedAt);
        const timestamp = Number.isFinite(updatedAt) ? updatedAt : createdAt;
        if (!Number.isFinite(timestamp)) return [];

        const activity: ActivityItem = {
          id: task.id,
          title: this.taskLocalization.translate(task.title),
          action:
            Number.isFinite(updatedAt) && updatedAt > createdAt ? 'Task updated' : 'Task created',
          status:
            task.status === 'in_progress'
              ? 'In Progress'
              : task.status === 'done'
                ? 'Completed'
                : 'To Do',
          assignee: task.assignee.name,
          timestamp,
        };
        return [activity];
      })
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5),
  );
}
