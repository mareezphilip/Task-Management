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
    { label: 'Dashboard', icon: '/assets/sidebar/dashboard.svg', active: true },
    { label: 'Tasks', icon: '/assets/sidebar/tasks.svg', active: false },
    { label: 'Calendar', icon: '/assets/sidebar/calendar.svg', active: false },
    { label: 'Analytics', icon: '/assets/sidebar/analytics.svg', active: false },
    { label: 'Team', icon: '/assets/sidebar/team.svg', active: false },
    { label: 'Settings', icon: '/assets/sidebar/Setting.svg', active: false },
  ];
}
