import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { Assignee } from '../../models/assignee.model';

@Injectable({
  providedIn: 'root',
})
export class TeamDataService {
  private readonly http = inject(HttpClient);

  getMembers(): Observable<{ members: Assignee[] }> {
    return this.http.get<{ members: Assignee[] }>('/api/team');
  }
}
