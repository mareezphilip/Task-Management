import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { DatePipe, registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import type { ActivityItem } from '../../models/activity.model';

import { I18nService } from '../../../../core/services/i18n/i18n.service';

registerLocaleData(localeAr, 'ar');

@Component({
  selector: 'app-activity-card',
  standalone: true,
  imports: [DatePipe, TranslatePipe],
  templateUrl: './activity-card.component.html',
  styleUrl: './activity-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityCardComponent {
  protected readonly i18n = inject(I18nService);
  readonly activity = input.required<ActivityItem>();
}
