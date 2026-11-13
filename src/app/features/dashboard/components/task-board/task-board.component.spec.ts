import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskBoardComponent } from './task-board.component';
import { Task } from '../../models/task.model';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { By } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';

describe('TaskBoardComponent', () => {
  let fixture: ComponentFixture<TaskBoardComponent>;
  const tasks: Task[] = [
    { id: 'task-1', title: 'Example task', description: '', priority: 'low', status: 'todo', dueLabel: 'Due tomorrow', category: 'Admin', assignee: { name: 'Alex', initials: 'AL' } },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskBoardComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    fixture = TestBed.createComponent(TaskBoardComponent);
    fixture.componentRef.setInput('tasks', tasks);
    fixture.detectChanges();
  });

  it('renders the task status columns', () => {
    expect(fixture.nativeElement.querySelectorAll('.board-column').length).toBe(3);
  });

  function drop(previousStatus: Task['status'], status: Task['status'], previousIndex: number, currentIndex: number,
                isPointerOverContainer = true): void {
    const container = { data: status };
    const event = {
      item: { data: tasks[0] },
      previousContainer: previousStatus === status ? container : { data: previousStatus },
      container,
      previousIndex,
      currentIndex,
      isPointerOverContainer,
    } as CdkDragDrop<Task['status'], Task['status'], Task>;
    const columnIndex = ['todo', 'in-progress', 'done'].indexOf(status);
    fixture.debugElement.queryAll(By.css('.task-list'))[columnIndex]
      .triggerEventHandler('cdkDropListDropped', event);
  }

  it('emits the next card as the destination when reordering in a column', () => {
    fixture.componentRef.setInput('tasks', [tasks[0], { ...tasks[0], id: 'task-2' }, { ...tasks[0], id: 'task-3' }]);
    fixture.detectChanges();
    const moved = jasmine.createSpy('taskMoved');
    fixture.componentInstance.taskMoved.subscribe(moved);

    drop('todo', 'todo', 0, 1);

    expect(moved).toHaveBeenCalledWith({ task: tasks[0], status: 'todo', beforeTaskId: 'task-3' });
  });

  it('emits a move to an empty column', () => {
    const moved = jasmine.createSpy('taskMoved');
    fixture.componentInstance.taskMoved.subscribe(moved);

    drop('todo', 'done', 0, 0);

    expect(moved).toHaveBeenCalledWith({ task: tasks[0], status: 'done', beforeTaskId: null });
  });

  it('ignores unchanged positions and drops outside a column', () => {
    const moved = jasmine.createSpy('taskMoved');
    fixture.componentInstance.taskMoved.subscribe(moved);

    drop('todo', 'todo', 0, 0);
    drop('todo', 'done', 0, 0, false);

    expect(moved).not.toHaveBeenCalled();
  });

  it('ignores moves while saving', () => {
    fixture.componentRef.setInput('saving', true);
    fixture.detectChanges();
    const moved = jasmine.createSpy('taskMoved');
    fixture.componentInstance.taskMoved.subscribe(moved);

    drop('todo', 'done', 0, 0);

    expect(moved).not.toHaveBeenCalled();
  });
});
