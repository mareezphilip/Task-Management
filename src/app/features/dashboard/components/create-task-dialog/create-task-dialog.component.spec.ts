import { provideZonelessChangeDetection } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CreateTaskDialogComponent } from './create-task-dialog.component';
import { ApiTask } from '../../models/task.model';
import { globalHttpInterceptorInterceptor } from '../../../../core/interceptors/GlobalHttpInterceptor/global-http-interceptor-interceptor';
import { GlobalErrorHandler } from '../../../../core/services/globalErrorHandler/global-error-handler';

describe('CreateTaskDialogComponent validation and editing', () => {
  const task: ApiTask = {
    id: 'task-1',
    title: 'Original title',
    description: 'Description',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-11-20T00:00:00.000Z',
    isOverdue: false,
    completedAt: null,
    tags: ['Design'],
    createdAt: '',
    updatedAt: '',
    assignee: { id: 'user-1', name: 'Alex', email: 'alex@example.com', avatar: '' },
  };

  function flushTeamRequest(): void {
    TestBed.inject(HttpTestingController)
      .expectOne('/api/team')
      .flush({ members: [task.assignee] });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CreateTaskDialogComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([globalHttpInterceptorInterceptor])),
        provideHttpClientTesting(),
        {
          provide: GlobalErrorHandler,
          useValue: { handleError: jasmine.createSpy('handleError') },
        },
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
      ],
    });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('keeps failed edits open and allows retrying the save', async () => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: task });
    const fixture = TestBed.createComponent(CreateTaskDialogComponent);
    const saved = jasmine.createSpy('taskSaved');
    fixture.componentInstance.taskSaved.subscribe(saved);
    fixture.detectChanges();
    flushTeamRequest();
    await fixture.whenStable();
    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    const submit = () =>
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    const http = TestBed.inject(HttpTestingController);

    submit();
    http.expectOne('/api/tasks/task-1').flush(
      { message: 'Save failed' },
      {
        status: 500,
        statusText: 'Server Error',
      },
    );
    fixture.detectChanges();
    expect(TestBed.inject(GlobalErrorHandler).handleError).toHaveBeenCalledTimes(1);
    expect(TestBed.inject(MatDialogRef).close).not.toHaveBeenCalled();
    expect(saved).not.toHaveBeenCalled();

    submit();
    http.expectOne('/api/tasks/task-1').flush({ task });
    expect(saved).toHaveBeenCalledTimes(1);
    expect(TestBed.inject(MatDialogRef).close).toHaveBeenCalledTimes(1);
  });

  it('shows required errors on submit and does not send an invalid task', async () => {
    const fixture = TestBed.createComponent(CreateTaskDialogComponent);
    fixture.detectChanges();
    flushTeamRequest();
    await fixture.whenStable();
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.field-error').length).toBe(4);
    TestBed.inject(HttpTestingController).expectNone('/api/tasks');
  });

  it('rejects whitespace-only titles and invalid assignee emails', async () => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: task });
    const fixture = TestBed.createComponent(CreateTaskDialogComponent);
    fixture.detectChanges();
    flushTeamRequest();
    await fixture.whenStable();
    const title: HTMLInputElement = fixture.nativeElement.querySelector('#task-title');
    title.value = '   ';
    title.dispatchEvent(new Event('input'));
    const taskForm = (fixture.componentInstance as unknown as { taskForm: FormGroup }).taskForm;
    taskForm.controls['assigneeEmail'].setValue('invalid-email');
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#task-title-error')).toBeTruthy();
    expect(taskForm.controls['assigneeEmail'].hasError('email')).toBeTrue();
    TestBed.inject(HttpTestingController).expectNone('/api/tasks/task-1');
  });

  it('prefills the date and keeps edits separate from the original task', async () => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: task });
    const fixture = TestBed.createComponent(CreateTaskDialogComponent);
    fixture.detectChanges();
    flushTeamRequest();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#task-due-date').value).toBe('2026-11-20');
    const name: HTMLInputElement = fixture.nativeElement.querySelector('#task-assignee');
    name.value = 'Changed name';
    name.dispatchEvent(new Event('input'));
    expect(task.assignee.name).toBe('Alex');
  });
});
