import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DashboardSidebarComponent } from '../../shared/layout/dashboard-sidebar/dashboard-sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [DashboardSidebarComponent, RouterOutlet],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayout {
}
