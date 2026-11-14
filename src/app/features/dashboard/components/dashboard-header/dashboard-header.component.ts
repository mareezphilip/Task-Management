import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';

import { I18nService } from '../../../../core/services/i18n/i18n.service';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './dashboard-header.component.html',
  styleUrl: './dashboard-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHeaderComponent {
  protected readonly i18n = inject(I18nService);
  readonly searchChanged = output<string>();

  protected onSearchInput(event: Event): void {
    this.searchChanged.emit((event.target as HTMLInputElement).value);
  }
}
