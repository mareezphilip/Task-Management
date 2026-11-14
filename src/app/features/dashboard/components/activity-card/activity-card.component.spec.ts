import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityCardComponent } from './activity-card.component';

describe('ActivityCardComponent', () => {
  let component: ActivityCardComponent;
  let fixture: ComponentFixture<ActivityCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityCardComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('activity', {
      id: 'task-1',
      title: 'Example task',
      action: 'Task created',
      status: 'To Do',
      assignee: 'Alex Morgan',
      timestamp: Date.parse('2026-11-01T09:00:00.000Z'),
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
