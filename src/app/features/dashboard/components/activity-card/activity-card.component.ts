import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ActivityItem } from '../../models/activity.model';

@Component({
  selector: 'app-activity-card',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './activity-card.component.html',
  styleUrl: './activity-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityCardComponent {
  readonly activity = input.required<ActivityItem>();
}
