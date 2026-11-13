import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskCardComponent } from './task-card.component';
import { Task } from '../../models/task.model';

describe('TaskCardComponent', () => {
  let fixture: ComponentFixture<TaskCardComponent>;
  const task: Task = {
    id: 'task-1', title: 'Example task', description: 'Task description', priority: 'medium',
    status: 'todo', dueLabel: 'Due tomorrow', category: 'Design',
    assignee: { name: 'Alex', initials: 'AL' },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TaskCardComponent] }).compileComponents();
    fixture = TestBed.createComponent(TaskCardComponent);
    fixture.componentRef.setInput('task', task);
    fixture.detectChanges();
  });

  it('renders the supplied task title', () => {
    expect(fixture.nativeElement.querySelector('h3').textContent).toContain('Example task');
  });
});
