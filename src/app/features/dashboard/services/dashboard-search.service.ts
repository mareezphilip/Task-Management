import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DashboardSearchService {
  readonly searchTerm = signal('');

  searchChanged(search: string): void {
    this.searchTerm.set(search.trim());
  }
}
