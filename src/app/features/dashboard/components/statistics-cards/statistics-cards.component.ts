import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DashboardMetric } from '../../models/task.model';

@Component({
  selector: 'app-statistics-cards',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './statistics-cards.component.html',
  styleUrl: './statistics-cards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsCardsComponent {
  readonly metrics = input.required<DashboardMetric[]>();
}
