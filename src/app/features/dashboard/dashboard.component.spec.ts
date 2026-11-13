import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardComponent } from './dashboard.component';
import { DashboardDataService } from './services/dashboard-data.service';
import { ApiTask } from './models/task.model';
import { TaskDto } from "./DTO'S/task.dto";
import { globalHttpInterceptorInterceptor } from '../../core/interceptors/GlobalHttpInterceptor/global-http-interceptor-interceptor';
import { GlobalErrorHandler } from '../../core/services/globalErrorHandler/global-error-handler';
import { TaskBoardComponent } from './components/task-board/task-board.component';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let http: HttpTestingController;
  const task: ApiTask = {
    id: 'task-1', title: 'Example task', description: 'Description', status: 'todo',
    priority: 'medium', dueDate: '2026-11-20T00:00:00.000Z', isOverdue: false,
    completedAt: null, tags: [], createdAt: '', updatedAt: '',
    assignee: { id: 'user-1', name: 'Alex', email: 'alex@example.com', avatar: '' },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([globalHttpInterceptorInterceptor])),
        provideHttpClientTesting(),
        { provide: GlobalErrorHandler, useValue: { handleError: jasmine.createSpy('handleError') } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    http.expectOne('/api/tasks').flush({ tasks: [], meta: { totalCount: 0, lastUpdated: '' } });
    http.expectOne('/api/statistics').flush({ statistics: [], lastUpdated: '' });
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('clears loading when the initial requests fail', () => {
    fixture.destroy();
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    http.expectOne('/api/tasks').flush(null, { status: 500, statusText: 'Server Error' });
    http.expectOne('/api/statistics').flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
    expect(fixture.debugElement.query(By.directive(TaskBoardComponent)).componentInstance.saving()).toBeFalse();
    expect(TestBed.inject(GlobalErrorHandler).handleError).toHaveBeenCalledTimes(2);
  });

  it('rolls back a failed move and allows retrying it', () => {
    TestBed.inject(DashboardDataService).getTasks().subscribe();
    http.expectOne('/api/tasks').flush({ tasks: [task], meta: { totalCount: 1, lastUpdated: '' } });
    fixture.detectChanges();
    const board = fixture.debugElement.query(By.directive(TaskBoardComponent));
    const move = { task: board.componentInstance.tasks()[0], status: 'in-progress', beforeTaskId: null };
    board.triggerEventHandler('taskMoved', move);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.board-column')[1].textContent).toContain(task.title);
    http.expectOne('/api/tasks/task-1/move').flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(board.componentInstance.saving()).toBeFalse();
    expect(fixture.nativeElement.querySelectorAll('.board-column')[0].textContent).toContain(task.title);
    expect(fixture.nativeElement.querySelectorAll('.board-column')[1].textContent).not.toContain(task.title);
    expect(TestBed.inject(GlobalErrorHandler).handleError).toHaveBeenCalledTimes(1);

    board.triggerEventHandler('taskMoved', move);
    http.expectOne('/api/tasks/task-1/move').flush({
      tasks: [{ ...task, status: 'in_progress' }], meta: { totalCount: 1, lastUpdated: '' },
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.board-column')[1].textContent).toContain(task.title);
    expect(board.componentInstance.saving()).toBeFalse();
  });

  it('renders the dashboard sections', () => {
    expect(fixture.nativeElement.querySelector('app-dashboard-header')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-task-board')).toBeTruthy();
  });

  it('reflects created and edited tasks without fetching the list again', () => {
    const data = TestBed.inject(DashboardDataService);
    data.createTask(new TaskDto(task)).subscribe();
    http.expectOne('/api/tasks').flush({ task });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-task-card h3').textContent).toContain('Example task');

    data.updateTask(task.id, new TaskDto({ ...task, title: 'Updated task', status: 'done' })).subscribe();
    http.expectOne('/api/tasks/task-1').flush({ task: { ...task, title: 'Updated task', status: 'done' } });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('app-task-card').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('.board-column')[2].textContent).toContain('Updated task');
    http.expectNone('/api/tasks');
    http.expectNone('/api/statistics');
  });
});
