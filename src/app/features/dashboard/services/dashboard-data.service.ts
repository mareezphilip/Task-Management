import { computed, Injectable, inject, signal } from '@angular/core';
import { httpResource, HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { TaskDto } from "../DTO'S/task.dto";
import {
  ApiTask,
  ApiTaskStatus,
  StatisticsResponse,
  TasksResponse,
  UpdateTaskRequest,
} from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';
  private readonly tasksState = signal<TasksResponse['tasks']>([]);
  readonly tasksResource = httpResource<TasksResponse>(() => `${this.baseUrl}/tasks`);
  readonly statisticsResource = httpResource<StatisticsResponse>(
    () => `${this.baseUrl}/statistics`,
  );
  readonly tasks = this.tasksState.asReadonly();
  readonly totalTasks = computed(() => this.tasksState().length);

  setTasks(tasks: TasksResponse['tasks']): void {
    this.tasksState.set(tasks);
  }

  getTasks(status: ApiTaskStatus | 'all' = 'all', search = ''): Observable<TasksResponse> {
    let params = new HttpParams();
    if (status !== 'all') params = params.set('status', status);
    if (search.trim()) params = params.set('search', search.trim());
    return this.http
      .get<TasksResponse>(`${this.baseUrl}/tasks`, {
        params: params.keys().length ? params : undefined,
      })
      .pipe(
        tap((response) => {
          if (status === 'all' && !search.trim()) {
            this.tasksState.set(response.tasks);
          }
        }),
      );
  }

  createTask(task: TaskDto): Observable<{ task: ApiTask }> {
    return this.http.post<{ task: ApiTask }>(`${this.baseUrl}/tasks`, task).pipe(
      tap(({ task: createdTask }) => {
        this.tasksState.update((tasks) => [
          ...tasks.filter((existingTask) => existingTask.id !== createdTask.id),
          createdTask,
        ]);
      }),
    );
  }

  updateTask(id: string, task: UpdateTaskRequest): Observable<{ task: ApiTask }> {
    return this.http
      .put<{ task: ApiTask }>(`${this.baseUrl}/tasks/${encodeURIComponent(id)}`, task)
      .pipe(
        tap(({ task: updatedTask }) => {
          this.tasksState.update((tasks) =>
            tasks.map((existingTask) => (existingTask.id === id ? updatedTask : existingTask)),
          );
        }),
      );
  }

  deleteTask(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/tasks/${encodeURIComponent(id)}`)
      .pipe(tap(() => this.tasksState.update((tasks) => tasks.filter((task) => task.id !== id))));
  }

  moveTask(
    id: string,
    status: ApiTaskStatus,
    beforeTaskId: string | null,
  ): Observable<TasksResponse> {
    return this.http
      .patch<TasksResponse>(`${this.baseUrl}/tasks/${encodeURIComponent(id)}/move`, {
        status,
        beforeTaskId,
      })
      .pipe(tap((response) => this.tasksState.set(response.tasks)));
  }

  getStatistics(): Observable<StatisticsResponse> {
    return this.http.get<StatisticsResponse>(`${this.baseUrl}/statistics`);
  }
}
