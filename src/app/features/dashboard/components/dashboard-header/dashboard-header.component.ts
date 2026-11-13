import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  templateUrl: './dashboard-header.component.html',
  styleUrl: './dashboard-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHeaderComponent {
  readonly searchChanged = output<string>();

  protected onSearchInput(event: Event): void {
    this.searchChanged.emit((event.target as HTMLInputElement).value);
  }
}
