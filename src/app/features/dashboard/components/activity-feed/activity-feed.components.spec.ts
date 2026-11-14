import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityFeedComponent } from './activity-feed.component';
import type { ApiTask } from '../../models/task.model';
import { TaskLocalizationService } from '../../services/task-localization.service';

describe('ActivityFeedComponent', () => {
  let fixture: ComponentFixture<ActivityFeedComponent>;

  const makeTask = (overrides: Partial<ApiTask> = {}): ApiTask => ({
    id: 'task-1',
    title: 'Prepare report',
    description: 'Prepare the quarterly report',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-11-20T00:00:00.000Z',
    isOverdue: false,
    completedAt: null,
    assignee: { id: 'user-1', name: 'Alex Morgan', email: 'alex@example.com', avatar: '' },
    tags: [],
    createdAt: '2026-11-01T09:00:00.000Z',
    updatedAt: '2026-11-01T09:00:00.000Z',
    ...overrides,
  });

  function setTasks(tasks: ApiTask[]): void {
    fixture.componentRef.setInput('tasks', tasks);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityFeedComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: TaskLocalizationService, useValue: { translate: (text: string) => text } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ActivityFeedComponent);
    setTasks([]);
  });

  it('shows an empty state when there are no tasks with activity', () => {
    expect(fixture.nativeElement.textContent).toContain('No recent task activity yet.');
    expect(fixture.nativeElement.querySelectorAll('app-activity-card').length).toBe(0);
  });

  it('renders activity details and maps task statuses', () => {
    setTasks([
      makeTask({
        status: 'in_progress',
        updatedAt: '2026-11-02T10:00:00.000Z',
      }),
    ]);

    const card = fixture.nativeElement.querySelector('app-activity-card');
    expect(card.textContent).toContain('Task updated');
    expect(card.textContent).toContain('Prepare report');
    expect(card.textContent).toContain('In Progress');
    expect(card.textContent).toContain('Alex Morgan');
  });

  it('sorts newest activity first and limits the feed to five entries', () => {
    const tasks = Array.from({ length: 6 }, (_, index) => {
      const day = String(index + 1).padStart(2, '0');
      return makeTask({
        id: `task-${index + 1}`,
        title: `Task ${index + 1}`,
        createdAt: `2026-11-${day}T09:00:00.000Z`,
        updatedAt: `2026-11-${day}T09:00:00.000Z`,
      });
    });
    setTasks(tasks);

    const cards = fixture.nativeElement.querySelectorAll('app-activity-card');
    expect(cards.length).toBe(5);
    expect(cards[0].textContent).toContain('Task 6');
    expect(cards[4].textContent).toContain('Task 2');
    expect(fixture.nativeElement.textContent).not.toContain('Task 1');
  });

  it('ignores tasks without valid creation or update timestamps', () => {
    setTasks([
      makeTask({ createdAt: 'invalid-date', updatedAt: '' }),
      makeTask({
        id: 'valid-task',
        title: 'Valid task',
        createdAt: '2026-11-03T09:00:00.000Z',
        updatedAt: 'invalid-date',
      }),
    ]);

    const cards = fixture.nativeElement.querySelectorAll('app-activity-card');
    expect(cards.length).toBe(1);
    expect(cards[0].textContent).toContain('Valid task');
  });

  it('labels a task as created when its update timestamp is not later than creation', () => {
    setTasks([
      makeTask({
        createdAt: '2026-11-03T09:00:00.000Z',
        updatedAt: '2026-11-03T09:00:00.000Z',
      }),
    ]);

    expect(fixture.nativeElement.querySelector('.activity-action').textContent).toContain(
      'Task created',
    );
  });
});
