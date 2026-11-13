import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatisticsCardsComponent } from './statistics-cards.component';
import { DashboardMetric } from '../../models/task.model';

describe('StatisticsCardsComponent', () => {
  let fixture: ComponentFixture<StatisticsCardsComponent>;
  const metrics: DashboardMetric[] = [
    { label: 'Total Tasks', value: 10, caption: 'This week', icon: '▥', tone: 'blue' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StatisticsCardsComponent] }).compileComponents();
    fixture = TestBed.createComponent(StatisticsCardsComponent);
    fixture.componentRef.setInput('metrics', metrics);
    fixture.detectChanges();
  });

  it('renders the supplied dashboard metrics', () => {
    expect(fixture.nativeElement.textContent).toContain('Total Tasks');
  });
});
