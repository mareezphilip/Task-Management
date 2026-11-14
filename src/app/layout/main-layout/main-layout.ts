import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { DashboardSidebarComponent } from '../../shared/layout/dashboard-sidebar/dashboard-sidebar.component';
import { DashboardHeaderComponent } from '../../features/dashboard/components/dashboard-header/dashboard-header.component';
import { DashboardSearchService } from '../../features/dashboard/services/dashboard-search.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [DashboardHeaderComponent, DashboardSidebarComponent, RouterOutlet],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayout {
  private readonly dashboardSearch = inject(DashboardSearchService);
  private readonly router = inject(Router);
  protected readonly sidebarCollapsed = signal(false);
  protected readonly showTaskSearch = this.isDashboardRoute(this.router.url);

  private isDashboardRoute(url: string): boolean {
    const path = url.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
    return path === '/';
  }

  protected searchChanged(search: string): void {
    this.dashboardSearch.searchChanged(search);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }
}
