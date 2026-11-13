import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LabeledButtonComponent } from '../../ui/labeled-button/labeled-button.component';
@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [LabeledButtonComponent],
  templateUrl: './dashboard-sidebar.component.html',
  styleUrl: './dashboard-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSidebarComponent {
  protected readonly items = [
    { label: 'Dashboard', icon: '/assets/sidebar/dashboard.svg', route: '/' },
    { label: 'Tasks', icon: '/assets/sidebar/tasks.svg', route: null },
    { label: 'Calendar', icon: '/assets/sidebar/calendar.svg', route: null },
    { label: 'Analytics', icon: '/assets/sidebar/analytics.svg', route: null },
    { label: 'Team', icon: '/assets/sidebar/team.svg', route: '/team' },
    { label: 'Settings', icon: '/assets/sidebar/Setting.svg', route: null },
  ];
}
