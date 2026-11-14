import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { LabeledButtonComponent } from '../../ui/labeled-button/labeled-button.component';
@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [LabeledButtonComponent, TranslatePipe],
  templateUrl: './dashboard-sidebar.component.html',
  styleUrl: './dashboard-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSidebarComponent {
  readonly collapsed = input(false);
  readonly toggleRequested = output<void>();
  protected readonly items = [
    { label: 'navigation.dashboard', icon: '/assets/sidebar/dashboard.svg', route: '/' },
    { label: 'navigation.tasks', icon: '/assets/sidebar/tasks.svg', route: null },
    { label: 'navigation.calendar', icon: '/assets/sidebar/calendar.svg', route: null },
    { label: 'navigation.analytics', icon: '/assets/sidebar/analytics.svg', route: null },
    { label: 'navigation.team', icon: '/assets/sidebar/team.svg', route: '/team' },
    { label: 'navigation.settings', icon: '/assets/sidebar/Setting.svg', route: null },
  ];
}
